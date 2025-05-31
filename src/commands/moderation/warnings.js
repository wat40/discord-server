const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../../utils/database');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View or manage user warnings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View warnings for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to view warnings for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all warnings for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to clear warnings for')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for clearing warnings')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a specific warning')
                .addIntegerOption(option =>
                    option.setName('warning_id')
                        .setDescription('ID of the warning to remove')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for removing warning')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List recent warnings in the server')
                .addIntegerOption(option =>
                    option.setName('limit')
                        .setDescription('Number of warnings to show (1-25)')
                        .setMinValue(1)
                        .setMaxValue(25)
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    
    cooldown: 3,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            switch (subcommand) {
                case 'view':
                    await handleViewWarnings(interaction);
                    break;
                case 'clear':
                    await handleClearWarnings(interaction);
                    break;
                case 'remove':
                    await handleRemoveWarning(interaction);
                    break;
                case 'list':
                    await handleListWarnings(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Error in warnings command:', error);
            
            const errorMessage = {
                content: '❌ An error occurred while processing the warnings command.',
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },
};

async function handleViewWarnings(interaction) {
    const target = interaction.options.getUser('user');
    const member = interaction.guild.members.cache.get(target.id);
    
    if (!member) {
        return interaction.reply({
            content: '❌ User not found in this server.',
            ephemeral: true
        });
    }
    
    // Get warnings for the user
    const warnings = await db.all(
        'SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC',
        [target.id, interaction.guild.id]
    );
    
    // Get max warnings setting
    const guildSettings = await db.get(
        'SELECT max_warnings FROM guild_settings WHERE guild_id = ?',
        [interaction.guild.id]
    );
    
    const maxWarnings = guildSettings?.max_warnings || 3;
    
    const embed = new EmbedBuilder()
        .setColor(warnings.length >= maxWarnings ? 0xff0000 : warnings.length > 0 ? 0xffaa00 : 0x00ff00)
        .setTitle(`⚠️ Warnings for ${target.tag}`)
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: 'Total Warnings', value: `${warnings.length}/${maxWarnings}`, inline: true },
            { name: 'User ID', value: target.id, inline: true },
            { name: 'Status', value: warnings.length >= maxWarnings ? '🔴 At Limit' : warnings.length > 0 ? '🟡 Has Warnings' : '🟢 Clean Record', inline: true }
        )
        .setTimestamp();
    
    if (warnings.length === 0) {
        embed.setDescription('This user has no warnings.');
    } else {
        // Show recent warnings (up to 10)
        const recentWarnings = warnings.slice(0, 10);
        const warningList = recentWarnings.map((warning, index) => {
            const date = new Date(warning.created_at).toLocaleDateString();
            const moderator = interaction.guild.members.cache.get(warning.moderator_id)?.user.tag || 'Unknown';
            return `**${warning.id}.** ${warning.reason}\n*${date} by ${moderator}*`;
        }).join('\n\n');
        
        embed.addFields({
            name: `Recent Warnings (${Math.min(warnings.length, 10)}/${warnings.length})`,
            value: warningList.length > 1024 ? warningList.substring(0, 1021) + '...' : warningList,
            inline: false
        });
        
        if (warnings.length > 10) {
            embed.setFooter({ text: `Showing 10 of ${warnings.length} warnings` });
        }
    }
    
    // Add action buttons for moderators
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`warnings_clear_${target.id}`)
                .setLabel('Clear All Warnings')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(warnings.length === 0),
            new ButtonBuilder()
                .setCustomId(`warnings_refresh_${target.id}`)
                .setLabel('Refresh')
                .setStyle(ButtonStyle.Secondary)
        );
    
    await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleClearWarnings(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Get current warning count
    const warningCount = await db.get(
        'SELECT COUNT(*) as count FROM warnings WHERE user_id = ? AND guild_id = ?',
        [target.id, interaction.guild.id]
    );
    
    if (warningCount.count === 0) {
        return interaction.reply({
            content: '❌ This user has no warnings to clear.',
            ephemeral: true
        });
    }
    
    // Clear all warnings
    await db.run(
        'DELETE FROM warnings WHERE user_id = ? AND guild_id = ?',
        [target.id, interaction.guild.id]
    );
    
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Warnings Cleared')
        .setDescription(`All warnings have been cleared for **${target.tag}**`)
        .addFields(
            { name: 'Warnings Removed', value: warningCount.count.toString(), inline: true },
            { name: 'Moderator', value: interaction.user.tag, inline: true },
            { name: 'Reason', value: reason, inline: false }
        )
        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
    // Log action
    await logModAction(interaction, 'WARNINGS_CLEARED', target, reason, warningCount.count);
    
    logger.info(`${interaction.user.tag} cleared ${warningCount.count} warnings for ${target.tag} in ${interaction.guild.name}`);
}

async function handleRemoveWarning(interaction) {
    const warningId = interaction.options.getInteger('warning_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Get the warning
    const warning = await db.get(
        'SELECT * FROM warnings WHERE id = ? AND guild_id = ?',
        [warningId, interaction.guild.id]
    );
    
    if (!warning) {
        return interaction.reply({
            content: '❌ Warning not found or not in this server.',
            ephemeral: true
        });
    }
    
    // Get user info
    const target = await interaction.client.users.fetch(warning.user_id).catch(() => null);
    
    // Remove the warning
    await db.run('DELETE FROM warnings WHERE id = ?', [warningId]);
    
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Warning Removed')
        .setDescription(`Warning #${warningId} has been removed`)
        .addFields(
            { name: 'User', value: target ? target.tag : `<@${warning.user_id}>`, inline: true },
            { name: 'Original Reason', value: warning.reason, inline: true },
            { name: 'Moderator', value: interaction.user.tag, inline: true },
            { name: 'Removal Reason', value: reason, inline: false }
        )
        .setTimestamp();
    
    if (target) {
        embed.setThumbnail(target.displayAvatarURL({ dynamic: true }));
    }
    
    await interaction.reply({ embeds: [embed] });
    
    // Log action
    await logModAction(interaction, 'WARNING_REMOVED', target, reason, 1, warningId);
    
    logger.info(`${interaction.user.tag} removed warning #${warningId} in ${interaction.guild.name}`);
}

async function handleListWarnings(interaction) {
    const limit = interaction.options.getInteger('limit') || 10;
    
    // Get recent warnings
    const warnings = await db.all(
        'SELECT * FROM warnings WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?',
        [interaction.guild.id, limit]
    );
    
    if (warnings.length === 0) {
        return interaction.reply({
            content: '✅ No warnings found in this server.',
            ephemeral: true
        });
    }
    
    const embed = new EmbedBuilder()
        .setColor(0xffaa00)
        .setTitle(`⚠️ Recent Warnings (${warnings.length})`)
        .setDescription(`Showing the ${warnings.length} most recent warnings in this server`)
        .setTimestamp();
    
    const warningList = await Promise.all(warnings.map(async (warning, index) => {
        const user = await interaction.client.users.fetch(warning.user_id).catch(() => null);
        const moderator = await interaction.client.users.fetch(warning.moderator_id).catch(() => null);
        const date = new Date(warning.created_at).toLocaleDateString();
        
        return `**${warning.id}.** ${user ? user.tag : 'Unknown User'}\n*${warning.reason}*\n*${date} by ${moderator ? moderator.tag : 'Unknown'}*`;
    }));
    
    const warningText = warningList.join('\n\n');
    
    if (warningText.length > 4096) {
        embed.setDescription('Too many warnings to display. Use `/warnings view` for specific users.');
    } else {
        embed.addFields({
            name: 'Warnings',
            value: warningText,
            inline: false
        });
    }
    
    await interaction.reply({ embeds: [embed] });
}

async function logModAction(interaction, action, target, reason, count, warningId = null) {
    try {
        // Get mod log channel from guild settings
        const settings = await db.get(
            'SELECT mod_log_channel FROM guild_settings WHERE guild_id = ?',
            [interaction.guild.id]
        );
        
        if (!settings || !settings.mod_log_channel) return;
        
        const modLogChannel = interaction.guild.channels.cache.get(settings.mod_log_channel);
        if (!modLogChannel) return;
        
        const logEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle(`✅ ${action}`)
            .addFields(
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();
        
        if (target) {
            logEmbed.addFields({ name: 'User', value: `${target.tag} (${target.id})`, inline: true });
            logEmbed.setThumbnail(target.displayAvatarURL({ dynamic: true }));
        }
        
        if (count) {
            logEmbed.addFields({ name: 'Count', value: count.toString(), inline: true });
        }
        
        if (warningId) {
            logEmbed.addFields({ name: 'Warning ID', value: warningId.toString(), inline: true });
        }
        
        await modLogChannel.send({ embeds: [logEmbed] });
        
    } catch (error) {
        logger.error('Error logging mod action:', error);
    }
}
