const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { logger } = require('../../utils/logger');
const { sendErrorMessage, replyToInteraction, deferReply } = require('../../utils/interactions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock or unlock a channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock a channel to prevent messages')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to lock (defaults to current channel)')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildNews)
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for locking the channel')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock a channel to allow messages')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to unlock (defaults to current channel)')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildNews)
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for unlocking the channel')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Lock or unlock the entire server')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Lock Server', value: 'lock' },
                            { name: 'Unlock Server', value: 'unlock' }
                        ))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for server lockdown')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .setDMPermission(false),
    
    cooldown: 5,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            switch (subcommand) {
                case 'lock':
                    await handleChannelLock(interaction);
                    break;
                case 'unlock':
                    await handleChannelUnlock(interaction);
                    break;
                case 'server':
                    await handleServerLockdown(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Error in lockdown command:', error);
            await sendErrorMessage(interaction, 'An error occurred while processing the lockdown command.');
        }
    },
};

async function handleChannelLock(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Validate channel type
    if (![ChannelType.GuildText, ChannelType.GuildNews].includes(targetChannel.type)) {
        return await sendErrorMessage(interaction, 'Can only lock text or news channels.');
    }
    
    // Check permissions
    if (!targetChannel.permissionsFor(interaction.member).has(PermissionFlagsBits.ManageChannels)) {
        return await sendErrorMessage(interaction, 'You need Manage Channels permission in the target channel.');
    }
    
    if (!targetChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
        return await sendErrorMessage(interaction, 'I need Manage Channels permission in the target channel.');
    }
    
    // Check if channel is already locked
    const everyoneRole = interaction.guild.roles.everyone;
    const currentPermissions = targetChannel.permissionOverwrites.cache.get(everyoneRole.id);
    
    if (currentPermissions && currentPermissions.deny.has(PermissionFlagsBits.SendMessages)) {
        return await sendErrorMessage(interaction, 'This channel is already locked.');
    }
    
    await deferReply(interaction);
    
    try {
        // Lock the channel
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
            SendMessages: false,
            AddReactions: false,
            CreatePublicThreads: false,
            CreatePrivateThreads: false
        }, { reason: `Channel locked by ${interaction.user.tag}: ${reason}` });
        
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('🔒 Channel Locked')
            .setDescription(`${targetChannel} has been locked`)
            .addFields(
                { name: 'Channel', value: targetChannel.toString(), inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
        // Send notification in the locked channel
        if (targetChannel.id !== interaction.channel.id) {
            const notificationEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🔒 Channel Locked')
                .setDescription(`This channel has been locked by ${interaction.user}`)
                .addFields({ name: 'Reason', value: reason })
                .setTimestamp();
            
            await targetChannel.send({ embeds: [notificationEmbed] });
        }
        
        // Log action
        await logLockdownAction(interaction, 'CHANNEL_LOCKED', targetChannel, reason);
        
        logger.info(`${interaction.user.tag} locked #${targetChannel.name} in ${interaction.guild.name}`);
        
    } catch (error) {
        logger.error('Error locking channel:', error);
        await interaction.editReply({ content: '❌ Failed to lock the channel. Please check my permissions.' });
    }
}

async function handleChannelUnlock(interaction) {
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Validate channel type
    if (![ChannelType.GuildText, ChannelType.GuildNews].includes(targetChannel.type)) {
        return await sendErrorMessage(interaction, 'Can only unlock text or news channels.');
    }
    
    // Check permissions
    if (!targetChannel.permissionsFor(interaction.member).has(PermissionFlagsBits.ManageChannels)) {
        return await sendErrorMessage(interaction, 'You need Manage Channels permission in the target channel.');
    }
    
    if (!targetChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageChannels)) {
        return await sendErrorMessage(interaction, 'I need Manage Channels permission in the target channel.');
    }
    
    await deferReply(interaction);
    
    try {
        // Unlock the channel
        const everyoneRole = interaction.guild.roles.everyone;
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
            SendMessages: null,
            AddReactions: null,
            CreatePublicThreads: null,
            CreatePrivateThreads: null
        }, { reason: `Channel unlocked by ${interaction.user.tag}: ${reason}` });
        
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('🔓 Channel Unlocked')
            .setDescription(`${targetChannel} has been unlocked`)
            .addFields(
                { name: 'Channel', value: targetChannel.toString(), inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
        // Send notification in the unlocked channel
        if (targetChannel.id !== interaction.channel.id) {
            const notificationEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('🔓 Channel Unlocked')
                .setDescription(`This channel has been unlocked by ${interaction.user}`)
                .addFields({ name: 'Reason', value: reason })
                .setTimestamp();
            
            await targetChannel.send({ embeds: [notificationEmbed] });
        }
        
        // Log action
        await logLockdownAction(interaction, 'CHANNEL_UNLOCKED', targetChannel, reason);
        
        logger.info(`${interaction.user.tag} unlocked #${targetChannel.name} in ${interaction.guild.name}`);
        
    } catch (error) {
        logger.error('Error unlocking channel:', error);
        await interaction.editReply({ content: '❌ Failed to unlock the channel. Please check my permissions.' });
    }
}

async function handleServerLockdown(interaction) {
    const action = interaction.options.getString('action');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await sendErrorMessage(interaction, 'You need Administrator permission to perform server lockdown.');
    }
    
    await deferReply(interaction);
    
    try {
        const everyoneRole = interaction.guild.roles.everyone;
        const textChannels = interaction.guild.channels.cache.filter(
            channel => [ChannelType.GuildText, ChannelType.GuildNews].includes(channel.type)
        );
        
        let successCount = 0;
        let failCount = 0;
        
        for (const [, channel] of textChannels) {
            try {
                if (action === 'lock') {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: false,
                        AddReactions: false,
                        CreatePublicThreads: false,
                        CreatePrivateThreads: false
                    }, { reason: `Server lockdown by ${interaction.user.tag}: ${reason}` });
                } else {
                    await channel.permissionOverwrites.edit(everyoneRole, {
                        SendMessages: null,
                        AddReactions: null,
                        CreatePublicThreads: null,
                        CreatePrivateThreads: null
                    }, { reason: `Server unlock by ${interaction.user.tag}: ${reason}` });
                }
                successCount++;
            } catch (error) {
                logger.warn(`Failed to ${action} channel ${channel.name}:`, error.message);
                failCount++;
            }
        }
        
        const embed = new EmbedBuilder()
            .setColor(action === 'lock' ? 0xff0000 : 0x00ff00)
            .setTitle(`🔒 Server ${action === 'lock' ? 'Lockdown' : 'Unlock'}`)
            .setDescription(`Server has been ${action === 'lock' ? 'locked down' : 'unlocked'}`)
            .addFields(
                { name: 'Channels Affected', value: `${successCount} successful, ${failCount} failed`, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        
        // Log action
        await logLockdownAction(interaction, action === 'lock' ? 'SERVER_LOCKED' : 'SERVER_UNLOCKED', null, reason, successCount);
        
        logger.info(`${interaction.user.tag} performed server ${action} in ${interaction.guild.name} (${successCount} channels)`);
        
    } catch (error) {
        logger.error('Error in server lockdown:', error);
        await interaction.editReply({ content: '❌ Failed to perform server lockdown. Please check my permissions.' });
    }
}

async function logLockdownAction(interaction, action, channel, reason, channelCount = null) {
    try {
        const { db } = require('../../utils/database');
        
        const settings = await db.get(
            'SELECT mod_log_channel FROM guild_settings WHERE guild_id = ?',
            [interaction.guild.id]
        );
        
        if (!settings || !settings.mod_log_channel) return;
        
        const modLogChannel = interaction.guild.channels.cache.get(settings.mod_log_channel);
        if (!modLogChannel || (channel && modLogChannel.id === channel.id)) return;
        
        const embed = new EmbedBuilder()
            .setColor(action.includes('LOCKED') ? 0xff0000 : 0x00ff00)
            .setTitle(`🔒 ${action.replace('_', ' ')}`)
            .addFields(
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();
        
        if (channel) {
            embed.addFields({ name: 'Channel', value: `${channel} (${channel.id})`, inline: true });
        }
        
        if (channelCount !== null) {
            embed.addFields({ name: 'Channels Affected', value: channelCount.toString(), inline: true });
        }
        
        await modLogChannel.send({ embeds: [embed] });
        
    } catch (error) {
        logger.error('Error logging lockdown action:', error);
    }
}
