const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../utils/database');
const { logger } = require('../utils/logger');
const { createProfessionalLayout } = require('../utils/professionalSetup');
const { sendErrorMessage } = require('../utils/interactions');

/**
 * Handle setup button interactions
 */
async function handleSetupButtons(interaction) {
    if (!interaction.isButton()) return;
    
    const customId = interaction.customId;
    
    // Check if this is a setup button
    if (!customId.startsWith('setup_')) return;
    
    try {
        await interaction.deferUpdate();
        
        switch (customId) {
            case 'setup_professional_start':
                await handleProfessionalSetupStart(interaction);
                break;
            case 'setup_quick_start':
                await handleQuickSetupStart(interaction);
                break;
            case 'setup_advanced_start':
                await handleAdvancedSetupStart(interaction);
                break;
            case 'setup_reset_confirm':
                await handleResetConfirm(interaction);
                break;
            case 'setup_reset_cancel':
                await handleResetCancel(interaction);
                break;
            case 'setup_reconfigure':
                await handleReconfigure(interaction);
                break;
            case 'setup_test':
                await handleTestConfiguration(interaction);
                break;
            case 'setup_quick_switch':
                await handleQuickSwitch(interaction);
                break;
            case 'setup_advanced_switch':
                await handleAdvancedSwitch(interaction);
                break;
            default:
                logger.warn(`Unknown setup button: ${customId}`);
        }
    } catch (error) {
        logger.error('Error handling setup button:', error);
        await sendErrorMessage(interaction, 'An error occurred during setup. Please try again.');
    }
}

/**
 * Handle professional setup start
 */
async function handleProfessionalSetupStart(interaction) {
    // Check permissions
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await sendErrorMessage(interaction, 'You need Administrator permission to run the professional setup.');
    }
    
    // Create progress embed
    const progressEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🏗️ Professional Setup in Progress...')
        .setDescription('Setting up your professional Discord server. This may take a few minutes.')
        .addFields(
            { name: 'Current Step', value: '🔄 Initializing...', inline: false },
            { name: 'Progress', value: '▱▱▱▱▱▱▱▱▱▱ 0%', inline: false }
        )
        .setTimestamp();
    
    await interaction.editReply({ embeds: [progressEmbed], components: [] });
    
    // Initialize guild settings
    await ensureGuildSettings(interaction.guild.id);
    
    let currentStep = 0;
    const totalSteps = 5;
    
    const updateProgress = async (step, description) => {
        currentStep = step;
        const percentage = Math.round((currentStep / totalSteps) * 100);
        const progressBar = '█'.repeat(Math.floor(percentage / 10)) + '▱'.repeat(10 - Math.floor(percentage / 10));
        
        const updatedEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🏗️ Professional Setup in Progress...')
            .setDescription('Setting up your professional Discord server. This may take a few minutes.')
            .addFields(
                { name: 'Current Step', value: description, inline: false },
                { name: 'Progress', value: `${progressBar} ${percentage}%`, inline: false }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [updatedEmbed] });
    };
    
    try {
        // Step 1: Create professional layout
        await updateProgress(1, '🏗️ Creating professional server layout...');
        const layoutResults = await createProfessionalLayout(interaction.guild, updateProgress);
        
        // Step 2: Configure ModuBot settings
        await updateProgress(2, '⚙️ Configuring ModuBot settings...');
        await configureBotSettings(interaction.guild);
        
        // Step 3: Set up channel configurations
        await updateProgress(3, '📋 Configuring channels...');
        await configureChannels(interaction.guild);
        
        // Step 4: Set up role permissions
        await updateProgress(4, '🎭 Finalizing role permissions...');
        await finalizeRolePermissions(interaction.guild);
        
        // Step 5: Complete
        await updateProgress(5, '✅ Setup complete!');
        
        // Create completion embed with enhanced results
        const hasErrors = layoutResults.errors.length > 0;
        const hasWarnings = layoutResults.warnings.length > 0;
        const embedColor = hasErrors ? 0xff9900 : (hasWarnings ? 0xffff00 : 0x00ff00);

        const completionEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(hasErrors ? '⚠️ Professional Setup Completed with Issues' : '✅ Professional Setup Complete!')
            .setDescription(hasErrors ?
                'Your Discord server has been set up with a professional layout. Some features may need manual configuration due to permission limitations.' :
                'Your Discord server has been set up with a comprehensive professional layout and onboarding system.')
            .addFields(
                { name: '🎭 Roles Created', value: layoutResults.rolesCreated.length > 0 ?
                    layoutResults.rolesCreated.slice(0, 8).join('\n') + (layoutResults.rolesCreated.length > 8 ? `\n... and ${layoutResults.rolesCreated.length - 8} more` : '') :
                    'None (already existed)', inline: true },
                { name: '📁 Categories Created', value: layoutResults.categoriesCreated.length > 0 ?
                    layoutResults.categoriesCreated.slice(0, 6).join('\n') + (layoutResults.categoriesCreated.length > 6 ? `\n... and ${layoutResults.categoriesCreated.length - 6} more` : '') :
                    'None (already existed)', inline: true },
                { name: '📋 Channels Created', value: layoutResults.channelsCreated.length > 0 ?
                    `${layoutResults.channelsCreated.length} channels created` :
                    'None (already existed)', inline: true }
            )
            .setFooter({ text: 'Professional server setup by ModuBot' })
            .setTimestamp();

        // Add onboarding features if any were set up
        if (layoutResults.onboardingSetup && layoutResults.onboardingSetup.length > 0) {
            completionEmbed.addFields({
                name: '🎯 Onboarding Features',
                value: layoutResults.onboardingSetup.slice(0, 6).join('\n') + (layoutResults.onboardingSetup.length > 6 ? `\n... and ${layoutResults.onboardingSetup.length - 6} more` : ''),
                inline: false
            });
        }

        // Add bot configuration info
        completionEmbed.addFields({
            name: '⚙️ Bot Configuration',
            value: '• Moderation logging enabled\n• Support system configured\n• XP system activated\n• Welcome system ready\n• Auto-moderation configured',
            inline: false
        });

        // Add next steps
        completionEmbed.addFields({
            name: '📚 Next Steps',
            value: '• Review and adjust permissions\n• Customize welcome messages\n• Train your staff team\n• Test verification system\n• Use `/config` for fine-tuning',
            inline: false
        });

        // Add errors if any
        if (layoutResults.errors.length > 0) {
            completionEmbed.addFields({
                name: '❌ Issues Encountered',
                value: layoutResults.errors.slice(0, 5).join('\n') + (layoutResults.errors.length > 5 ? `\n... and ${layoutResults.errors.length - 5} more` : ''),
                inline: false
            });
        }

        // Add warnings if any
        if (layoutResults.warnings.length > 0) {
            completionEmbed.addFields({
                name: '⚠️ Warnings',
                value: layoutResults.warnings.slice(0, 5).join('\n') + (layoutResults.warnings.length > 5 ? `\n... and ${layoutResults.warnings.length - 5} more` : ''),
                inline: false
            });
        }

        // Add skipped items if any
        if (layoutResults.skipped && layoutResults.skipped.length > 0) {
            completionEmbed.addFields({
                name: '⏭️ Skipped Items',
                value: layoutResults.skipped.slice(0, 5).join('\n') + (layoutResults.skipped.length > 5 ? `\n... and ${layoutResults.skipped.length - 5} more` : ''),
                inline: false
            });
        }

        // Add server management recommendations if available
        if (layoutResults.recommendations) {
            const recommendations = layoutResults.recommendations;

            if (recommendations.bots && recommendations.bots.length > 0) {
                const topBots = recommendations.bots.slice(0, 3).map(bot =>
                    `**${bot.name}** - ${bot.purpose} (${bot.priority} Priority)`
                ).join('\n');

                completionEmbed.addFields({
                    name: '🤖 Recommended Bots',
                    value: topBots + '\n\n*Use `/setup recommendations` for detailed setup guides*',
                    inline: false
                });
            }
        }
        
        await interaction.editReply({ embeds: [completionEmbed] });

        // Record setup history
        await db.run(
            'INSERT INTO setup_history (guild_id, setup_type, completed_by, results) VALUES (?, ?, ?, ?)',
            [interaction.guild.id, 'professional', interaction.user.id, JSON.stringify(layoutResults)]
        );

        logger.info(`Professional setup completed for ${interaction.guild.name} by ${interaction.user.tag}`);
        
    } catch (error) {
        logger.error('Error during professional setup:', error);
        
        const errorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Setup Error')
            .setDescription('An error occurred during the professional setup.')
            .addFields(
                { name: 'Error Details', value: error.message || 'Unknown error occurred', inline: false },
                { name: 'What to do', value: '• Check bot permissions\n• Ensure bot role is high enough\n• Try running setup again\n• Contact support if issues persist', inline: false }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Handle quick setup start
 */
async function handleQuickSetupStart(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🚀 Quick Setup Started')
        .setDescription('Setting up basic ModuBot configuration...')
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed], components: [] });
    
    try {
        // Initialize guild settings
        await ensureGuildSettings(interaction.guild.id);
        
        // Create basic channels if they don't exist
        await createBasicChannels(interaction.guild);
        
        const completionEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Quick Setup Complete!')
            .setDescription('ModuBot has been configured with basic settings.')
            .addFields(
                { name: '⚙️ Configuration', value: '• Database initialized\n• Basic settings applied\n• Essential channels created', inline: false },
                { name: '📚 Next Steps', value: '• Use `/config` to customize settings\n• Set up additional channels\n• Configure permissions\n• Run `/setup mode:professional` for full layout', inline: false }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [completionEmbed] });
        
    } catch (error) {
        logger.error('Error during quick setup:', error);
        await sendErrorMessage(interaction, 'An error occurred during quick setup. Please try again.');
    }
}

/**
 * Handle advanced setup start
 */
async function handleAdvancedSetupStart(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x9932cc)
        .setTitle('⚙️ Advanced Setup')
        .setDescription('Advanced setup is coming soon! For now, please use the Professional Setup for a complete server layout.')
        .addFields(
            { name: 'Available Now', value: '• Professional Setup - Complete server layout\n• Quick Setup - Basic configuration', inline: false },
            { name: 'Coming Soon', value: '• Custom role configuration\n• Advanced permission settings\n• Integration options', inline: false }
        )
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed], components: [] });
}

/**
 * Handle reset confirmation
 */
async function handleResetConfirm(interaction) {
    try {
        // Reset guild settings
        await db.run('DELETE FROM guild_settings WHERE guild_id = ?', [interaction.guild.id]);
        
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Configuration Reset')
            .setDescription('All ModuBot settings have been reset for this server.')
            .addFields(
                { name: 'What was reset', value: '• All server settings\n• Channel configurations\n• Bot preferences', inline: false },
                { name: 'What was preserved', value: '• User XP and levels\n• Warning history\n• Ticket logs\n• Custom tags', inline: false },
                { name: 'Next Steps', value: 'Run `/setup` again to reconfigure ModuBot.', inline: false }
            )
            .setTimestamp();
        
        await interaction.editReply({ embeds: [embed], components: [] });
        
        logger.info(`Configuration reset for ${interaction.guild.name} by ${interaction.user.tag}`);
        
    } catch (error) {
        logger.error('Error resetting configuration:', error);
        await sendErrorMessage(interaction, 'An error occurred while resetting configuration.');
    }
}

/**
 * Handle reset cancellation
 */
async function handleResetCancel(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('❌ Reset Cancelled')
        .setDescription('Configuration reset has been cancelled. Your settings remain unchanged.')
        .setTimestamp();
    
    await interaction.editReply({ embeds: [embed], components: [] });
}

/**
 * Ensure guild settings exist
 */
async function ensureGuildSettings(guildId) {
    const existing = await db.get('SELECT * FROM guild_settings WHERE guild_id = ?', [guildId]);
    
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
}

/**
 * Configure bot settings
 */
async function configureBotSettings(guild) {
    // Find mod log channel
    const modLogChannel = guild.channels.cache.find(channel => 
        channel.name.includes('mod-log') || channel.name.includes('📋-mod-logs')
    );
    
    // Find support category
    const supportCategory = guild.channels.cache.find(channel => 
        channel.type === 4 && channel.name.includes('SUPPORT')
    );
    
    // Find welcome channel
    const welcomeChannel = guild.channels.cache.find(channel => 
        channel.name.includes('welcome') || channel.name.includes('👋-welcome')
    );
    
    // Update settings
    const updates = [];
    const values = [];
    
    if (modLogChannel) {
        updates.push('mod_log_channel = ?');
        values.push(modLogChannel.id);
    }
    
    if (supportCategory) {
        updates.push('support_category = ?');
        values.push(supportCategory.id);
    }
    
    if (welcomeChannel) {
        updates.push('welcome_channel = ?');
        values.push(welcomeChannel.id);
    }
    
    if (updates.length > 0) {
        values.push(guild.id);
        await db.run(
            `UPDATE guild_settings SET ${updates.join(', ')} WHERE guild_id = ?`,
            values
        );
    }
}

/**
 * Configure channels with specific settings
 */
async function configureChannels(guild) {
    // Set slowmode for specific channels
    const channelConfigs = [
        { name: '👋-welcome', slowmode: 30 },
        { name: '💬-general-chat', slowmode: 5 },
        { name: '🗣️-off-topic', slowmode: 3 }
    ];
    
    for (const config of channelConfigs) {
        const channel = guild.channels.cache.find(ch => ch.name.includes(config.name.replace(/[^\w-]/g, '')));
        if (channel && channel.rateLimitPerUser !== config.slowmode) {
            try {
                await channel.setRateLimitPerUser(config.slowmode);
                logger.info(`Set slowmode for ${channel.name}: ${config.slowmode}s`);
            } catch (error) {
                logger.warn(`Could not set slowmode for ${channel.name}:`, error);
            }
        }
    }
}

/**
 * Finalize role permissions
 */
async function finalizeRolePermissions(guild) {
    // Ensure bot role is positioned correctly
    const botMember = guild.members.me;
    if (botMember && botMember.roles.highest.position < guild.roles.cache.size - 5) {
        logger.info('Bot role position is optimal for managing server');
    }
}

/**
 * Create basic channels for quick setup
 */
async function createBasicChannels(guild) {
    const basicChannels = [
        { name: 'general', type: 0 },
        { name: 'mod-logs', type: 0, private: true }
    ];
    
    for (const channelConfig of basicChannels) {
        const existing = guild.channels.cache.find(ch => ch.name.includes(channelConfig.name));
        if (!existing) {
            try {
                const permissions = channelConfig.private ? [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    }
                ] : [];
                
                await guild.channels.create({
                    name: channelConfig.name,
                    type: channelConfig.type,
                    permissionOverwrites: permissions
                });
                
                logger.info(`Created basic channel: ${channelConfig.name}`);
            } catch (error) {
                logger.warn(`Could not create basic channel ${channelConfig.name}:`, error);
            }
        }
    }
}

/**
 * Handle reconfigure button
 */
async function handleReconfigure(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🔄 Reconfigure ModuBot')
        .setDescription('Choose how you want to reconfigure your server setup.')
        .addFields(
            { name: '🚀 Quick Setup', value: 'Basic bot configuration and essential channels', inline: true },
            { name: '🏗️ Professional Setup', value: 'Complete professional server layout with all features', inline: true },
            { name: '🔄 Reset & Start Over', value: 'Clear all settings and start fresh', inline: true }
        )
        .setFooter({ text: 'Choose your preferred setup method' })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('setup_quick_start')
                .setLabel('🚀 Quick Setup')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('setup_professional_start')
                .setLabel('🏗️ Professional Setup')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('setup_reset_confirm')
                .setLabel('🔄 Reset All')
                .setStyle(ButtonStyle.Danger)
        );

    await interaction.editReply({ embeds: [embed], components: [row] });
}

/**
 * Handle test configuration button
 */
async function handleTestConfiguration(interaction) {
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🧪 Testing Configuration...')
        .setDescription('Running comprehensive tests on your ModuBot setup.')
        .addFields(
            { name: 'Current Step', value: '🔄 Initializing tests...', inline: false }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed], components: [] });

    try {
        const testResults = await runConfigurationTests(interaction.guild);

        const resultEmbed = new EmbedBuilder()
            .setColor(testResults.allPassed ? 0x00ff00 : 0xff9900)
            .setTitle('🧪 Configuration Test Results')
            .setDescription(testResults.allPassed ?
                '✅ All tests passed! Your ModuBot configuration is working perfectly.' :
                '⚠️ Some issues were found. Review the results below.')
            .addFields(
                { name: '✅ Passed Tests', value: testResults.passed.length > 0 ? testResults.passed.join('\n') : 'None', inline: true },
                { name: '❌ Failed Tests', value: testResults.failed.length > 0 ? testResults.failed.join('\n') : 'None', inline: true },
                { name: '⚠️ Warnings', value: testResults.warnings.length > 0 ? testResults.warnings.join('\n') : 'None', inline: true }
            )
            .setFooter({ text: 'Use /config to fix any issues found' })
            .setTimestamp();

        if (testResults.recommendations.length > 0) {
            resultEmbed.addFields({
                name: '💡 Recommendations',
                value: testResults.recommendations.slice(0, 5).join('\n'),
                inline: false
            });
        }

        await interaction.editReply({ embeds: [resultEmbed] });

    } catch (error) {
        logger.error('Error running configuration tests:', error);

        const errorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('❌ Test Error')
            .setDescription('An error occurred while testing the configuration.')
            .addFields(
                { name: 'Error Details', value: error.message || 'Unknown error', inline: false },
                { name: 'What to do', value: '• Check bot permissions\n• Ensure database is accessible\n• Try running tests again', inline: false }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [errorEmbed] });
    }
}

/**
 * Handle quick switch button
 */
async function handleQuickSwitch(interaction) {
    await handleQuickSetupStart(interaction);
}

/**
 * Handle advanced switch button
 */
async function handleAdvancedSwitch(interaction) {
    await handleAdvancedSetupStart(interaction);
}

/**
 * Run comprehensive configuration tests
 */
async function runConfigurationTests(guild) {
    const results = {
        passed: [],
        failed: [],
        warnings: [],
        recommendations: [],
        allPassed: true
    };

    try {
        // Test 1: Bot permissions
        const botMember = guild.members.me;
        if (botMember.permissions.has(PermissionFlagsBits.Administrator)) {
            results.passed.push('✅ Bot has Administrator permissions');
        } else {
            const requiredPerms = [
                PermissionFlagsBits.ManageChannels,
                PermissionFlagsBits.ManageRoles,
                PermissionFlagsBits.KickMembers,
                PermissionFlagsBits.BanMembers,
                PermissionFlagsBits.ModerateMembers
            ];

            const missingPerms = requiredPerms.filter(perm => !botMember.permissions.has(perm));
            if (missingPerms.length === 0) {
                results.passed.push('✅ Bot has required permissions');
            } else {
                results.failed.push('❌ Bot missing critical permissions');
                results.allPassed = false;
            }
        }

        // Test 2: Database connectivity
        try {
            const settings = await db.get('SELECT * FROM guild_settings WHERE guild_id = ?', [guild.id]);
            if (settings) {
                results.passed.push('✅ Database connection working');
            } else {
                results.warnings.push('⚠️ No guild settings found');
                results.recommendations.push('💡 Run setup to initialize settings');
            }
        } catch (error) {
            results.failed.push('❌ Database connection failed');
            results.allPassed = false;
        }

        // Test 3: Essential channels
        const essentialChannels = ['mod-log', 'support', 'general'];
        let foundChannels = 0;

        for (const channelName of essentialChannels) {
            const channel = guild.channels.cache.find(ch =>
                ch.name.toLowerCase().includes(channelName.toLowerCase())
            );
            if (channel) {
                foundChannels++;
            }
        }

        if (foundChannels >= 2) {
            results.passed.push('✅ Essential channels found');
        } else {
            results.warnings.push('⚠️ Some essential channels missing');
            results.recommendations.push('💡 Run professional setup to create missing channels');
        }

        // Test 4: Role hierarchy
        const staffRoles = guild.roles.cache.filter(role =>
            role.name.toLowerCase().includes('mod') ||
            role.name.toLowerCase().includes('admin') ||
            role.name.toLowerCase().includes('staff')
        );

        if (staffRoles.size > 0) {
            results.passed.push('✅ Staff roles configured');
        } else {
            results.warnings.push('⚠️ No staff roles found');
            results.recommendations.push('💡 Create staff roles for proper moderation');
        }

        // Test 5: Bot role position
        if (botMember.roles.highest.position > guild.roles.cache.size / 2) {
            results.passed.push('✅ Bot role position is optimal');
        } else {
            results.warnings.push('⚠️ Bot role position could be higher');
            results.recommendations.push('💡 Move bot role higher for better functionality');
        }

        // Test 6: Server features
        if (guild.features.includes('COMMUNITY')) {
            results.passed.push('✅ Community server features enabled');
        } else {
            results.warnings.push('⚠️ Community features not enabled');
            results.recommendations.push('💡 Enable community features for better server management');
        }

    } catch (error) {
        logger.error('Error in configuration tests:', error);
        results.failed.push('❌ Test execution failed');
        results.allPassed = false;
    }

    return results;
}

module.exports = {
    handleSetupButtons
};
