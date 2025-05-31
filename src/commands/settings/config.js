const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const { db } = require('../../utils/database');
const { logger } = require('../../utils/logger');
const { sendErrorMessage, replyToInteraction, safeErrorReply } = require('../../utils/interactions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure ModuBot settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View current server configuration'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('modlog')
                .setDescription('Set moderation log channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for moderation logs')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('support')
                .setDescription('Set support ticket category')
                .addChannelOption(option =>
                    option.setName('category')
                        .setDescription('Category for support tickets')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('welcome')
                .setDescription('Configure welcome system')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Welcome channel')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Welcome message ({user} = mention, {server} = server name)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('warnings')
                .setDescription('Set maximum warnings before action')
                .addIntegerOption(option =>
                    option.setName('max')
                        .setDescription('Maximum warnings (1-10)')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('xp')
                .setDescription('Configure XP system')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable XP system')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('per_message')
                        .setDescription('XP per message (1-50)')
                        .setMinValue(1)
                        .setMaxValue(50)
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('cooldown')
                        .setDescription('XP cooldown in seconds (30-300)')
                        .setMinValue(30)
                        .setMaxValue(300)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('automod')
                .setDescription('Configure auto-moderation')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable auto-moderation')
                        .setRequired(true))
                .addBooleanOption(option =>
                    option.setName('spam_filter')
                        .setDescription('Enable spam filtering')
                        .setRequired(false))
                .addBooleanOption(option =>
                    option.setName('link_filter')
                        .setDescription('Enable link filtering')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('prefix')
                .setDescription('Set bot prefix')
                .addStringOption(option =>
                    option.setName('new_prefix')
                        .setDescription('New prefix (1-5 characters)')
                        .setMinLength(1)
                        .setMaxLength(5)
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),
    
    cooldown: 5,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            // Ensure guild settings exist
            await ensureGuildSettings(interaction.guild.id);
            
            switch (subcommand) {
                case 'view':
                    await handleViewConfig(interaction);
                    break;
                case 'modlog':
                    await handleModlogConfig(interaction);
                    break;
                case 'support':
                    await handleSupportConfig(interaction);
                    break;
                case 'welcome':
                    await handleWelcomeConfig(interaction);
                    break;
                case 'warnings':
                    await handleWarningsConfig(interaction);
                    break;
                case 'xp':
                    await handleXPConfig(interaction);
                    break;
                case 'automod':
                    await handleAutomodConfig(interaction);
                    break;
                case 'prefix':
                    await handlePrefixConfig(interaction);
                    break;
                default:
                    return await sendErrorMessage(interaction, 'Unknown configuration option.');
            }

        } catch (error) {
            logger.error('Error in config command:', error);
            logger.error('Error details:', {
                message: error.message,
                code: error.code,
                errno: error.errno,
                stack: error.stack
            });

            return await safeErrorReply(interaction, 'An error occurred while updating configuration. Please try again or contact support.');
        }
    },
};

async function ensureGuildSettings(guildId) {
    try {
        const existing = await db.get(
            'SELECT * FROM guild_settings WHERE guild_id = ?',
            [guildId]
        );

        if (!existing) {
            await db.run(
                `INSERT INTO guild_settings (
                    guild_id, prefix, max_warnings, xp_enabled,
                    xp_per_message, xp_cooldown, automod_enabled,
                    spam_filter, link_filter
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [guildId, '!', 3, 1, 5, 60000, 0, 0, 0]
            );
            logger.info(`Created default guild settings for ${guildId}`);
        }
    } catch (error) {
        logger.error('Error ensuring guild settings:', error);
        throw error;
    }
}

async function handleViewConfig(interaction) {
    const settings = await db.get(
        'SELECT * FROM guild_settings WHERE guild_id = ?',
        [interaction.guild.id]
    );
    
    if (!settings) {
        return await sendErrorMessage(interaction, 'No configuration found. Run `/setup` first.');
    }
    
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('⚙️ Server Configuration')
        .setDescription(`Configuration for **${interaction.guild.name}**`)
        .addFields(
            {
                name: '🔧 Basic Settings',
                value: [
                    `**Prefix:** ${settings.prefix}`,
                    `**Max Warnings:** ${settings.max_warnings}`,
                    `**XP System:** ${settings.xp_enabled ? 'Enabled' : 'Disabled'}`
                ].join('\n'),
                inline: true
            },
            {
                name: '📋 Channels',
                value: [
                    `**Mod Log:** ${settings.mod_log_channel ? `<#${settings.mod_log_channel}>` : 'Not set'}`,
                    `**Support:** ${settings.support_category ? `<#${settings.support_category}>` : 'Not set'}`,
                    `**Welcome:** ${settings.welcome_channel ? `<#${settings.welcome_channel}>` : 'Not set'}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🛡️ Moderation',
                value: [
                    `**Auto-mod:** ${settings.automod_enabled ? 'Enabled' : 'Disabled'}`,
                    `**Spam Filter:** ${settings.spam_filter ? 'Enabled' : 'Disabled'}`,
                    `**Link Filter:** ${settings.link_filter ? 'Enabled' : 'Disabled'}`
                ].join('\n'),
                inline: true
            },
            {
                name: '🏆 XP System',
                value: [
                    `**XP per Message:** ${settings.xp_per_message || 5}`,
                    `**Cooldown:** ${Math.floor((settings.xp_cooldown || 60000) / 1000)}s`,
                    `**Status:** ${settings.xp_enabled ? '🟢 Active' : '🔴 Disabled'}`
                ].join('\n'),
                inline: true
            }
        )
        .setFooter({ text: 'Use /config <setting> to modify individual settings' })
        .setTimestamp();
    
    if (settings.welcome_message) {
        embed.addFields({
            name: '👋 Welcome Message',
            value: settings.welcome_message,
            inline: false
        });
    }
    
    await replyToInteraction(interaction, { embeds: [embed] });
}

async function handleModlogConfig(interaction) {
    const channel = interaction.options.getChannel('channel');
    
    await db.run(
        'UPDATE guild_settings SET mod_log_channel = ? WHERE guild_id = ?',
        [channel.id, interaction.guild.id]
    );
    
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Moderation Log Updated')
        .setDescription(`Moderation logs will now be sent to ${channel}`)
        .setTimestamp();
    
    await replyToInteraction(interaction, { embeds: [embed] });
    logger.info(`${interaction.user.tag} set mod log channel to ${channel.name} in ${interaction.guild.name}`);
}

async function handleSupportConfig(interaction) {
    const category = interaction.options.getChannel('category');

    await db.run(
        'UPDATE guild_settings SET support_category = ? WHERE guild_id = ?',
        [category.id, interaction.guild.id]
    );

    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Support Category Updated')
        .setDescription(`Support tickets will now be created in ${category}`)
        .setTimestamp();

    await replyToInteraction(interaction, { embeds: [embed] });
    logger.info(`${interaction.user.tag} set support category to ${category.name} in ${interaction.guild.name}`);
}

async function handleWelcomeConfig(interaction) {
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');

    const updates = [];
    const values = [];

    if (channel) {
        updates.push('welcome_channel = ?');
        values.push(channel.id);
    }

    if (message) {
        updates.push('welcome_message = ?');
        values.push(message);
    }

    if (updates.length === 0) {
        return await sendErrorMessage(interaction, 'Please provide either a channel or message to update.');
    }

    values.push(interaction.guild.id);

    await db.run(
        `UPDATE guild_settings SET ${updates.join(', ')} WHERE guild_id = ?`,
        values
    );

    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Welcome System Updated')
        .setTimestamp();

    const fields = [];
    if (channel) fields.push(`**Channel:** ${channel}`);
    if (message) fields.push(`**Message:** ${message}`);

    embed.setDescription(fields.join('\n'));

    await replyToInteraction(interaction, { embeds: [embed] });
    logger.info(`${interaction.user.tag} updated welcome settings in ${interaction.guild.name}`);
}

async function handleWarningsConfig(interaction) {
    const maxWarnings = interaction.options.getInteger('max');

    await db.run(
        'UPDATE guild_settings SET max_warnings = ? WHERE guild_id = ?',
        [maxWarnings, interaction.guild.id]
    );

    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Warning Limit Updated')
        .setDescription(`Maximum warnings before action: **${maxWarnings}**`)
        .setTimestamp();

    await replyToInteraction(interaction, { embeds: [embed] });
    logger.info(`${interaction.user.tag} set max warnings to ${maxWarnings} in ${interaction.guild.name}`);
}

async function handleXPConfig(interaction) {
    const enabled = interaction.options.getBoolean('enabled');
    const perMessage = interaction.options.getInteger('per_message');
    const cooldown = interaction.options.getInteger('cooldown');

    const updates = ['xp_enabled = ?'];
    const values = [enabled ? 1 : 0];

    if (perMessage !== null) {
        updates.push('xp_per_message = ?');
        values.push(perMessage);
    }

    if (cooldown !== null) {
        updates.push('xp_cooldown = ?');
        values.push(cooldown * 1000); // Convert to milliseconds
    }

    values.push(interaction.guild.id);

    await db.run(
        `UPDATE guild_settings SET ${updates.join(', ')} WHERE guild_id = ?`,
        values
    );

    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ XP System Updated')
        .addFields(
            { name: 'Status', value: enabled ? 'Enabled' : 'Disabled', inline: true }
        )
        .setTimestamp();

    if (perMessage !== null) {
        embed.addFields({ name: 'XP per Message', value: perMessage.toString(), inline: true });
    }

    if (cooldown !== null) {
        embed.addFields({ name: 'Cooldown', value: `${cooldown} seconds`, inline: true });
    }

    await replyToInteraction(interaction, { embeds: [embed] });
    logger.info(`${interaction.user.tag} updated XP settings in ${interaction.guild.name}`);
}

async function handleAutomodConfig(interaction) {
    const enabled = interaction.options.getBoolean('enabled');
    const spamFilter = interaction.options.getBoolean('spam_filter');
    const linkFilter = interaction.options.getBoolean('link_filter');

    const updates = ['automod_enabled = ?'];
    const values = [enabled ? 1 : 0];

    if (spamFilter !== null) {
        updates.push('spam_filter = ?');
        values.push(spamFilter ? 1 : 0);
    }

    if (linkFilter !== null) {
        updates.push('link_filter = ?');
        values.push(linkFilter ? 1 : 0);
    }

    values.push(interaction.guild.id);

    await db.run(
        `UPDATE guild_settings SET ${updates.join(', ')} WHERE guild_id = ?`,
        values
    );

    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Auto-Moderation Updated')
        .addFields(
            { name: 'Auto-mod Status', value: enabled ? 'Enabled' : 'Disabled', inline: true }
        )
        .setTimestamp();

    if (spamFilter !== null) {
        embed.addFields({ name: 'Spam Filter', value: spamFilter ? 'Enabled' : 'Disabled', inline: true });
    }

    if (linkFilter !== null) {
        embed.addFields({ name: 'Link Filter', value: linkFilter ? 'Enabled' : 'Disabled', inline: true });
    }

    await replyToInteraction(interaction, { embeds: [embed] });
    logger.info(`${interaction.user.tag} updated automod settings in ${interaction.guild.name}`);
}

async function handlePrefixConfig(interaction) {
    const newPrefix = interaction.options.getString('new_prefix');

    await db.run(
        'UPDATE guild_settings SET prefix = ? WHERE guild_id = ?',
        [newPrefix, interaction.guild.id]
    );

    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Prefix Updated')
        .setDescription(`Bot prefix changed to: **${newPrefix}**`)
        .setTimestamp();

    await replyToInteraction(interaction, { embeds: [embed] });
    logger.info(`${interaction.user.tag} changed prefix to ${newPrefix} in ${interaction.guild.name}`);
}
