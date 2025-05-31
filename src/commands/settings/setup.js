const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { db } = require('../../utils/database');
const { logger } = require('../../utils/logger');
const { replyToInteraction, sendErrorMessage, deferReply } = require('../../utils/interactions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Interactive setup wizard for ModuBot')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('Setup mode')
                .setRequired(false)
                .addChoices(
                    { name: '🚀 Quick Setup', value: 'quick' },
                    { name: '🏗️ Professional Server Layout', value: 'professional' },
                    { name: '⚙️ Advanced Setup', value: 'advanced' },
                    { name: '🔄 Reset Configuration', value: 'reset' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),

    async execute(interaction) {
        await deferReply(interaction);

        try {
            const guildId = interaction.guild.id;
            const mode = interaction.options.getString('mode') || 'quick';

            // Check if guild settings already exist
            const existingSettings = await db.get(
                'SELECT * FROM guild_settings WHERE guild_id = ?',
                [guildId]
            );

            if (existingSettings && mode !== 'reset') {
                return await showExistingSetup(interaction, existingSettings);
            }

            if (mode === 'reset') {
                return await resetConfiguration(interaction);
            }

            // Start setup process based on mode
            switch (mode) {
                case 'professional':
                    return await startProfessionalSetup(interaction);
                case 'advanced':
                    return await startAdvancedSetup(interaction);
                case 'quick':
                default:
                    return await startQuickSetup(interaction);
            }

        } catch (error) {
            logger.error('Error during setup:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('❌ Setup Error')
                .setDescription('An error occurred during setup. Please try again or contact support.')
                .addFields(
                    { name: 'Error Details', value: 'Check bot permissions and try again', inline: false }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};

// Helper Functions

async function showExistingSetup(interaction, settings) {
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ ModuBot Already Configured')
        .setDescription('ModuBot is already set up for this server. Here are your current settings:')
        .addFields(
            { name: '🎫 Support Category', value: settings.support_category ? `<#${settings.support_category}>` : 'Not set', inline: true },
            { name: '📋 Mod Log Channel', value: settings.mod_log_channel ? `<#${settings.mod_log_channel}>` : 'Not set', inline: true },
            { name: '👋 Welcome Channel', value: settings.welcome_channel ? `<#${settings.welcome_channel}>` : 'Not set', inline: true },
            { name: '⚠️ Max Warnings', value: settings.max_warnings.toString(), inline: true },
            { name: '🏆 XP System', value: settings.xp_enabled ? 'Enabled' : 'Disabled', inline: true },
            { name: '🔧 Prefix', value: settings.prefix, inline: true }
        )
        .setFooter({ text: 'Use /config to modify individual settings or /setup mode:reset to reconfigure' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_reconfigure')
                .setLabel('🔄 Reconfigure')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('setup_test')
                .setLabel('🧪 Test Configuration')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row] });
}

async function resetConfiguration(interaction) {
    const confirmEmbed = new EmbedBuilder()
        .setColor(0xff9900)
        .setTitle('⚠️ Reset Configuration')
        .setDescription('This will reset ALL ModuBot settings for this server. This action cannot be undone.')
        .addFields(
            { name: '🗑️ What will be reset:', value: '• All server settings\n• Channel configurations\n• Custom prefixes\n• Warning limits\n• XP settings', inline: false },
            { name: '💾 What will be kept:', value: '• User XP/levels\n• Warning history\n• Ticket logs\n• Custom tags', inline: false }
        )
        .setFooter({ text: 'Click Confirm to proceed or Cancel to abort' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_reset_confirm')
                .setLabel('✅ Confirm Reset')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('setup_reset_cancel')
                .setLabel('❌ Cancel')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [confirmEmbed], components: [row] });
}

async function startQuickSetup(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🚀 Quick Setup Wizard')
        .setDescription('Welcome to ModuBot! Let\'s get your server configured quickly.')
        .addFields(
            { name: '📋 Quick Setup Includes:', value: '• Basic server settings\n• Essential channels creation\n• Default permissions\n• Core bot features', inline: false },
            { name: '⏱️ Estimated Time:', value: '2-3 minutes', inline: true },
            { name: '🎯 Best For:', value: 'New servers, simple setups', inline: true }
        )
        .setFooter({ text: 'Click Start to begin the quick setup process' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_quick_start')
                .setLabel('🚀 Start Quick Setup')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('setup_advanced_switch')
                .setLabel('⚙️ Switch to Advanced')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row] });
}

async function startProfessionalSetup(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x9932cc)
        .setTitle('🏗️ Professional Server Layout Setup')
        .setDescription('Create a complete professional Discord server with the comprehensive layout from our documentation.')
        .addFields(
            { name: '🏗️ Professional Setup Includes:', value: '• Complete server structure (categories, channels, roles)\n• Professional permission system\n• Comprehensive channel descriptions\n• Role hierarchy with proper permissions\n• ModuBot configuration', inline: false },
            { name: '⏱️ Estimated Time:', value: '5-10 minutes', inline: true },
            { name: '🎯 Best For:', value: 'New servers, professional communities', inline: true },
            { name: '⚠️ Important:', value: 'This will create many channels and roles. Existing elements will be preserved.', inline: false }
        )
        .setFooter({ text: 'Click Start to begin the professional setup process' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_professional_start')
                .setLabel('🏗️ Start Professional Setup')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('setup_quick_switch')
                .setLabel('🚀 Switch to Quick')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row] });
}

async function startAdvancedSetup(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x9932cc)
        .setTitle('⚙️ Advanced Setup Wizard')
        .setDescription('Configure ModuBot with detailed customization options.')
        .addFields(
            { name: '🔧 Advanced Setup Includes:', value: '• Detailed channel configuration\n• Custom role permissions\n• Advanced moderation settings\n• Custom automation rules\n• Integration options', inline: false },
            { name: '⏱️ Estimated Time:', value: '10-15 minutes', inline: true },
            { name: '🎯 Best For:', value: 'Large servers, custom needs', inline: true }
        )
        .setFooter({ text: 'Click Start to begin the advanced setup process' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_advanced_start')
                .setLabel('⚙️ Start Advanced Setup')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('setup_quick_switch')
                .setLabel('🚀 Switch to Quick')
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [row] });
}
