const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { logger } = require('../../utils/logger');
const { sendErrorMessage, replyToInteraction } = require('../../utils/interactions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set or remove slowmode for a channel')
        .addIntegerOption(option =>
            option.setName('seconds')
                .setDescription('Slowmode duration in seconds (0 to disable, max 21600)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Channel to set slowmode for (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildNews)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for setting slowmode')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false),
    
    cooldown: 3,
    
    async execute(interaction) {
        const seconds = interaction.options.getInteger('seconds');
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        try {
            // Validate channel type
            if (![ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildNews].includes(targetChannel.type)) {
                return await sendErrorMessage(interaction, 'Slowmode can only be set on text, voice, or news channels.');
            }
            
            // Check permissions
            if (!targetChannel.permissionsFor(interaction.member).has(PermissionFlagsBits.ManageChannels)) {
                return await sendErrorMessage(interaction, 'You need Manage Channels permission in the target channel.');
            }
            
            if (!targetChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
                return await sendErrorMessage(interaction, 'I need Manage Channels permission in the target channel.');
            }
            
            // Get current slowmode
            const currentSlowmode = targetChannel.rateLimitPerUser;
            
            // Set the slowmode
            await targetChannel.setRateLimitPerUser(seconds, `${reason} | Set by ${interaction.user.tag}`);
            
            // Create response embed
            const embed = new EmbedBuilder()
                .setTimestamp();
            
            if (seconds === 0) {
                embed
                    .setColor(0x00ff00)
                    .setTitle('🚀 Slowmode Disabled')
                    .setDescription(`Slowmode has been disabled in ${targetChannel}`)
                    .addFields(
                        { name: 'Channel', value: targetChannel.toString(), inline: true },
                        { name: 'Previous Slowmode', value: formatDuration(currentSlowmode), inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    );
            } else {
                embed
                    .setColor(0xffaa00)
                    .setTitle('⏱️ Slowmode Set')
                    .setDescription(`Slowmode has been set to **${formatDuration(seconds)}** in ${targetChannel}`)
                    .addFields(
                        { name: 'Channel', value: targetChannel.toString(), inline: true },
                        { name: 'Duration', value: formatDuration(seconds), inline: true },
                        { name: 'Previous', value: formatDuration(currentSlowmode), inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    );
            }
            
            await replyToInteraction(interaction, { embeds: [embed] });
            
            // Log to mod log channel if configured
            await logSlowmodeAction(interaction, targetChannel, seconds, currentSlowmode, reason);
            
            logger.info(`${interaction.user.tag} set slowmode to ${seconds}s in #${targetChannel.name} (${interaction.guild.name})`);
            
        } catch (error) {
            logger.error('Error setting slowmode:', error);
            
            let errorMessage = 'An error occurred while setting slowmode.';
            
            if (error.code === 50013) {
                errorMessage = 'Missing permissions to manage this channel.';
            } else if (error.code === 50001) {
                errorMessage = 'Missing access to this channel.';
            }
            
            await sendErrorMessage(interaction, errorMessage);
        }
    },
};

function formatDuration(seconds) {
    if (seconds === 0) return 'Disabled';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
    
    return parts.join(' ') || '0s';
}

async function logSlowmodeAction(interaction, channel, newSeconds, oldSeconds, reason) {
    try {
        const { db } = require('../../utils/database');
        
        // Get mod log channel from guild settings
        const settings = await db.get(
            'SELECT mod_log_channel FROM guild_settings WHERE guild_id = ?',
            [interaction.guild.id]
        );
        
        if (!settings || !settings.mod_log_channel) return;
        
        const modLogChannel = interaction.guild.channels.cache.get(settings.mod_log_channel);
        if (!modLogChannel || modLogChannel.id === channel.id) return; // Don't log in same channel
        
        const embed = new EmbedBuilder()
            .setColor(newSeconds === 0 ? 0x00ff00 : 0xffaa00)
            .setTitle(`⏱️ SLOWMODE ${newSeconds === 0 ? 'DISABLED' : 'SET'}`)
            .addFields(
                { name: 'Channel', value: `${channel} (${channel.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'New Duration', value: formatDuration(newSeconds), inline: true },
                { name: 'Previous Duration', value: formatDuration(oldSeconds), inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();
        
        await modLogChannel.send({ embeds: [embed] });
        
    } catch (error) {
        logger.error('Error logging slowmode action:', error);
    }
}
