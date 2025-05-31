const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('delete_days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    
    cooldown: 5,
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteDays = interaction.options.getInteger('delete_days') || 0;
        const member = interaction.guild.members.cache.get(target.id);
        
        // Check if user is already banned
        try {
            const banList = await interaction.guild.bans.fetch();
            if (banList.has(target.id)) {
                return interaction.reply({
                    content: '❌ This user is already banned.',
                    ephemeral: true
                });
            }
        } catch (error) {
            logger.error('Error checking ban list:', error);
        }
        
        // Validation checks for members in the server
        if (member) {
            if (member.id === interaction.user.id) {
                return interaction.reply({
                    content: '❌ You cannot ban yourself.',
                    ephemeral: true
                });
            }
            
            if (member.id === interaction.client.user.id) {
                return interaction.reply({
                    content: '❌ I cannot ban myself.',
                    ephemeral: true
                });
            }
            
            // Check role hierarchy
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    content: '❌ You cannot ban someone with a higher or equal role.',
                    ephemeral: true
                });
            }
            
            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    content: '❌ I cannot ban someone with a higher or equal role than me.',
                    ephemeral: true
                });
            }
            
            if (!member.bannable) {
                return interaction.reply({
                    content: '❌ I cannot ban this member.',
                    ephemeral: true
                });
            }
        }
        
        try {
            // Send DM to user before banning (if they're in the server)
            if (member) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('🔨 You have been banned')
                        .setDescription(`You have been banned from **${interaction.guild.name}**`)
                        .addFields(
                            { name: 'Reason', value: reason },
                            { name: 'Moderator', value: interaction.user.tag }
                        )
                        .setTimestamp();
                    
                    await target.send({ embeds: [dmEmbed] });
                } catch (error) {
                    logger.warn(`Could not send DM to ${target.tag} about ban`);
                }
            }
            
            // Ban the user
            await interaction.guild.members.ban(target, {
                reason: `${reason} | Banned by ${interaction.user.tag}`,
                deleteMessageDays: deleteDays
            });
            
            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🔨 Member Banned')
                .setDescription(`**${target.tag}** has been banned from the server`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: interaction.user.tag },
                    { name: 'Messages Deleted', value: `${deleteDays} day(s)` }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await interaction.reply({ embeds: [successEmbed] });
            
            // Log to mod log channel if configured
            await logModAction(interaction, 'BAN', target, reason, deleteDays);
            
            logger.info(`${interaction.user.tag} banned ${target.tag} from ${interaction.guild.name}. Reason: ${reason}`);
            
        } catch (error) {
            logger.error('Error banning member:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to ban the member.',
                ephemeral: true
            });
        }
    },
};

async function logModAction(interaction, action, target, reason, deleteDays = null) {
    try {
        const { db } = require('../../utils/database');
        
        // Get mod log channel from guild settings
        const settings = await db.get(
            'SELECT mod_log_channel FROM guild_settings WHERE guild_id = ?',
            [interaction.guild.id]
        );
        
        if (!settings || !settings.mod_log_channel) return;
        
        const modLogChannel = interaction.guild.channels.cache.get(settings.mod_log_channel);
        if (!modLogChannel) return;
        
        const fields = [
            { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
            { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
            { name: 'Reason', value: reason, inline: false }
        ];
        
        if (deleteDays !== null) {
            fields.push({ name: 'Messages Deleted', value: `${deleteDays} day(s)`, inline: true });
        }
        
        const logEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`🔨 ${action}`)
            .addFields(fields)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await modLogChannel.send({ embeds: [logEmbed] });
        
    } catch (error) {
        logger.error('Error logging mod action:', error);
    }
}
