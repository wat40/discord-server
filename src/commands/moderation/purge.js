const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('filter')
                .setDescription('Filter messages to delete')
                .setRequired(false)
                .addChoices(
                    { name: 'All messages', value: 'all' },
                    { name: 'Bot messages only', value: 'bots' },
                    { name: 'Human messages only', value: 'humans' },
                    { name: 'Messages with attachments', value: 'attachments' },
                    { name: 'Messages with embeds', value: 'embeds' },
                    { name: 'Messages with links', value: 'links' }
                ))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for purging messages')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .setDMPermission(false),
    
    cooldown: 5,
    
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');
        const filter = interaction.options.getString('filter') || 'all';
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ 
                limit: Math.min(amount + 10, 100) // Fetch a few extra to account for filtering
            });
            
            // Filter messages based on criteria
            let messagesToDelete = Array.from(messages.values());
            
            // Filter by user if specified
            if (targetUser) {
                messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
            }
            
            // Apply content filter
            switch (filter) {
                case 'bots':
                    messagesToDelete = messagesToDelete.filter(msg => msg.author.bot);
                    break;
                case 'humans':
                    messagesToDelete = messagesToDelete.filter(msg => !msg.author.bot);
                    break;
                case 'attachments':
                    messagesToDelete = messagesToDelete.filter(msg => msg.attachments.size > 0);
                    break;
                case 'embeds':
                    messagesToDelete = messagesToDelete.filter(msg => msg.embeds.length > 0);
                    break;
                case 'links':
                    messagesToDelete = messagesToDelete.filter(msg => 
                        /https?:\/\/[^\s]+/gi.test(msg.content)
                    );
                    break;
                // 'all' case doesn't need filtering
            }
            
            // Limit to requested amount
            messagesToDelete = messagesToDelete.slice(0, amount);
            
            // Filter out messages older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            const recentMessages = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            const oldMessages = messagesToDelete.length - recentMessages.length;
            
            if (recentMessages.length === 0) {
                return interaction.editReply({
                    content: '❌ No messages found matching your criteria, or all messages are older than 14 days.'
                });
            }
            
            // Delete messages
            let deletedCount = 0;
            
            if (recentMessages.length === 1) {
                // Delete single message
                await recentMessages[0].delete();
                deletedCount = 1;
            } else {
                // Bulk delete multiple messages
                const deleted = await interaction.channel.bulkDelete(recentMessages, true);
                deletedCount = deleted.size;
            }
            
            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🗑️ Messages Purged')
                .addFields(
                    { name: 'Messages Deleted', value: deletedCount.toString(), inline: true },
                    { name: 'Channel', value: interaction.channel.toString(), inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Filter Applied', value: formatFilter(filter, targetUser), inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();
            
            if (oldMessages > 0) {
                successEmbed.addFields({
                    name: '⚠️ Note',
                    value: `${oldMessages} message(s) were older than 14 days and could not be deleted.`,
                    inline: false
                });
            }
            
            await interaction.editReply({ embeds: [successEmbed] });
            
            // Send confirmation message in channel (will auto-delete)
            const channelEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setDescription(`🗑️ **${deletedCount}** message(s) deleted by ${interaction.user}`)
                .setTimestamp();
            
            const confirmMsg = await interaction.channel.send({ embeds: [channelEmbed] });
            
            // Auto-delete confirmation after 5 seconds
            setTimeout(async () => {
                try {
                    await confirmMsg.delete();
                } catch (error) {
                    // Message might already be deleted
                }
            }, 5000);
            
            // Log to mod log channel
            await logModAction(interaction, deletedCount, targetUser, filter, reason);
            
            logger.info(`${interaction.user.tag} purged ${deletedCount} messages in #${interaction.channel.name} (${interaction.guild.name})`);
            
        } catch (error) {
            logger.error('Error purging messages:', error);
            
            let errorMessage = '❌ An error occurred while purging messages.';
            
            if (error.code === 50034) {
                errorMessage = '❌ Cannot delete messages older than 14 days.';
            } else if (error.code === 50013) {
                errorMessage = '❌ Missing permissions to delete messages.';
            }
            
            await interaction.editReply({ content: errorMessage });
        }
    },
};

function formatFilter(filter, targetUser) {
    const filterMap = {
        'all': 'All messages',
        'bots': 'Bot messages only',
        'humans': 'Human messages only',
        'attachments': 'Messages with attachments',
        'embeds': 'Messages with embeds',
        'links': 'Messages with links'
    };
    
    let filterText = filterMap[filter] || 'All messages';
    
    if (targetUser) {
        filterText += ` from ${targetUser.tag}`;
    }
    
    return filterText;
}

async function logModAction(interaction, deletedCount, targetUser, filter, reason) {
    try {
        const { db } = require('../../utils/database');
        
        // Get mod log channel from guild settings
        const settings = await db.get(
            'SELECT mod_log_channel FROM guild_settings WHERE guild_id = ?',
            [interaction.guild.id]
        );
        
        if (!settings || !settings.mod_log_channel) return;
        
        const modLogChannel = interaction.guild.channels.cache.get(settings.mod_log_channel);
        if (!modLogChannel || modLogChannel.id === interaction.channel.id) return; // Don't log in same channel
        
        const logEmbed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle('🗑️ PURGE')
            .addFields(
                { name: 'Channel', value: `${interaction.channel} (${interaction.channel.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Messages Deleted', value: deletedCount.toString(), inline: true },
                { name: 'Filter', value: formatFilter(filter, targetUser), inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();
        
        await modLogChannel.send({ embeds: [logEmbed] });
        
    } catch (error) {
        logger.error('Error logging purge action:', error);
    }
}
