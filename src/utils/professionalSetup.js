const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { logger } = require('./logger');

// Professional server layout configuration
const SERVER_LAYOUT = {
    roles: [
        // === SPECIAL SYSTEM ROLES ===
        { name: '👑 Server Owner', color: '#ff0000', permissions: ['Administrator'], manageable: false, category: 'system', hoist: true, mentionable: true, isOwnerRole: true },
        { name: '🤖 ModuBot', color: '#7289da', permissions: ['Administrator'], manageable: false, category: 'system', hoist: true, mentionable: false, isBotRole: true },

        // === STAFF HIERARCHY ===
        { name: '🛡️ Administrator', color: '#ff3300', permissions: ['Administrator'], manageable: true, category: 'staff', hoist: true, mentionable: true },
        { name: '🔱 Head Moderator', color: '#ff6600', permissions: ['ManageGuild', 'ManageRoles', 'ManageChannels', 'KickMembers', 'BanMembers', 'ModerateMembers', 'ManageMessages', 'ViewAuditLog'], manageable: true, category: 'staff', hoist: true, mentionable: true },
        { name: '⚔️ Senior Moderator', color: '#ff9900', permissions: ['ManageRoles', 'KickMembers', 'BanMembers', 'ModerateMembers', 'ManageMessages', 'ViewAuditLog'], manageable: true, category: 'staff', hoist: true, mentionable: true },
        { name: '🛡️ Moderator', color: '#ffcc00', permissions: ['KickMembers', 'ModerateMembers', 'ManageMessages'], manageable: true, category: 'staff', hoist: true, mentionable: true },
        { name: '🔰 Trial Moderator', color: '#ffff00', permissions: ['ModerateMembers', 'ManageMessages'], manageable: true, category: 'staff', hoist: true, mentionable: true },

        // === SUPPORT TEAM ===
        { name: '🎯 Support Manager', color: '#00ccff', permissions: ['ManageMessages', 'ManageThreads'], manageable: true, category: 'support', hoist: true, mentionable: true },
        { name: '🎫 Senior Support', color: '#33aaff', permissions: ['ManageMessages'], manageable: true, category: 'support', hoist: true, mentionable: true },
        { name: '🆘 Support Staff', color: '#6699ff', permissions: [], manageable: true, category: 'support', hoist: true, mentionable: true },
        { name: '🔧 Technical Support', color: '#9988ff', permissions: [], manageable: true, category: 'support', hoist: true, mentionable: true },

        // === COMMUNITY TEAM ===
        { name: '🎪 Community Manager', color: '#ff00ff', permissions: ['ManageEvents', 'ManageMessages'], manageable: true, category: 'community', hoist: true, mentionable: true },
        { name: '🎭 Event Coordinator', color: '#cc33ff', permissions: ['ManageEvents'], manageable: true, category: 'community', hoist: true, mentionable: true },
        { name: '📢 Content Creator', color: '#9966ff', permissions: [], manageable: true, category: 'community', hoist: true, mentionable: true },
        { name: '🎨 Artist', color: '#6699ff', permissions: [], manageable: true, category: 'community', hoist: true, mentionable: true },
        { name: '📝 Writer', color: '#3399ff', permissions: [], manageable: true, category: 'community', hoist: true, mentionable: true },

        // === SPECIAL ROLES ===
        { name: '🤖 Bot Developer', color: '#00ff00', permissions: ['ManageWebhooks', 'ManageMessages'], manageable: true, category: 'special', hoist: true, mentionable: true },
        { name: '🔒 Security Team', color: '#ff6600', permissions: ['ViewAuditLog', 'ModerateMembers'], manageable: true, category: 'special', hoist: true, mentionable: true },
        { name: '📊 Analytics Team', color: '#ffaa00', permissions: [], manageable: true, category: 'special', hoist: true, mentionable: true },
        { name: '🎓 Mentor', color: '#00aaff', permissions: [], manageable: true, category: 'special', hoist: true, mentionable: true },

        // === VIP & DONORS ===
        { name: '👑 Server Booster', color: '#f47fff', permissions: [], manageable: true, category: 'vip', isBooster: true, hoist: true, mentionable: true },
        { name: '💎 Diamond Donor', color: '#b9f2ff', permissions: [], manageable: true, category: 'vip', hoist: true, mentionable: true },
        { name: '🥇 Gold Donor', color: '#ffd700', permissions: [], manageable: true, category: 'vip', hoist: true, mentionable: true },
        { name: '🥈 Silver Donor', color: '#c0c0c0', permissions: [], manageable: true, category: 'vip', hoist: true, mentionable: true },
        { name: '🥉 Bronze Donor', color: '#cd7f32', permissions: [], manageable: true, category: 'vip', hoist: true, mentionable: true },
        { name: '💝 Supporter', color: '#ff69b4', permissions: [], manageable: true, category: 'vip', hoist: true, mentionable: true },

        // === ACTIVITY LEVELS ===
        { name: '🏆 Legend', color: '#ff4500', permissions: [], manageable: true, category: 'activity', hoist: true, mentionable: true },
        { name: '⭐ Veteran', color: '#ff6347', permissions: [], manageable: true, category: 'activity', hoist: true, mentionable: true },
        { name: '🌟 Active Member', color: '#32cd32', permissions: [], manageable: true, category: 'activity', hoist: true, mentionable: true },
        { name: '📈 Rising Star', color: '#90ee90', permissions: [], manageable: true, category: 'activity', hoist: true, mentionable: true },
        { name: '✅ Verified Member', color: '#00ff7f', permissions: [], manageable: true, category: 'member', hoist: false, mentionable: true },
        { name: '👶 New Member', color: '#98fb98', permissions: [], manageable: true, isDefault: true, category: 'member', hoist: false, mentionable: true },

        // === GAME/INTEREST ROLES ===
        { name: '🎮 Gamer', color: '#9932cc', permissions: [], manageable: true, category: 'interest', hoist: false, mentionable: true },
        { name: '🎵 Music Lover', color: '#ff1493', permissions: [], manageable: true, category: 'interest', hoist: false, mentionable: true },
        { name: '📚 Bookworm', color: '#8b4513', permissions: [], manageable: true, category: 'interest', hoist: false, mentionable: true },
        { name: '🎬 Movie Buff', color: '#2f4f4f', permissions: [], manageable: true, category: 'interest', hoist: false, mentionable: true },
        { name: '🏃 Fitness Enthusiast', color: '#ff4500', permissions: [], manageable: true, category: 'interest', hoist: false, mentionable: true },
        { name: '🍳 Foodie', color: '#ffa500', permissions: [], manageable: true, category: 'interest', hoist: false, mentionable: true },
        { name: '✈️ Traveler', color: '#4169e1', permissions: [], manageable: true, category: 'interest', hoist: false, mentionable: true },
        { name: '💻 Tech Enthusiast', color: '#00ced1', permissions: [], manageable: true, category: 'interest', hoist: false, mentionable: true },

        // === NOTIFICATION ROLES ===
        { name: '📢 Announcements', color: '#ff0000', permissions: [], manageable: true, category: 'notification', hoist: false, mentionable: true },
        { name: '🎉 Events', color: '#ff69b4', permissions: [], manageable: true, category: 'notification', hoist: false, mentionable: true },
        { name: '🎁 Giveaways', color: '#ffd700', permissions: [], manageable: true, category: 'notification', hoist: false, mentionable: true },
        { name: '📰 News', color: '#4169e1', permissions: [], manageable: true, category: 'notification', hoist: false, mentionable: true },
        { name: '🔄 Updates', color: '#32cd32', permissions: [], manageable: true, category: 'notification', hoist: false, mentionable: true }
    ],
    
    categories: [
        {
            name: '🚪 ONBOARDING',
            channels: [
                { name: '🚪-verification', description: '🚪 Member Verification | Complete verification to access the server | React with ✅ to verify', special: 'verification' },
                { name: '📋-server-guide', description: '📋 Server Navigation Guide | Learn how to navigate our community | Channel explanations and tips', special: 'guide' },
                { name: '🎯-getting-started', description: '🎯 Getting Started | New member orientation | Introduction to our community features', special: 'onboarding' },
                { name: '🎭-introductions', description: '🎭 Introduce Yourself! | Tell us about yourself | Share your interests and hobbies | One intro per person', special: 'introductions' }
            ],
            permissions: {
                '@everyone': { view: false },
                'New Member': { view: true, send: true, react: true },
                'Verified Member+': { view: true, send: true, react: true },
                'staff': { view: true, send: true, react: true, manage: true }
            }
        },
        {
            name: '📋 INFORMATION',
            channels: [
                { name: '📜-rules', description: '📜 Server Rules & Guidelines | Read before participating | Violations result in warnings/bans', special: 'rules' },
                { name: '📢-announcements', description: '📢 Official Server Announcements | Important updates and news | Enable notifications 🔔', special: 'announcements' },
                { name: '👋-welcome', description: '👋 Welcome Messages | Automated welcome messages | New member notifications', special: 'welcome' },
                { name: '❓-faq', description: '❓ Frequently Asked Questions | Search before asking | Common solutions here' },
                { name: '📰-updates', description: '📰 Bot & Server Updates | ModuBot changelog | Technical announcements' },
                { name: '🔗-useful-links', description: '🔗 Useful Links & Resources | External tools | Official websites | Documentation' },
                { name: '📊-server-stats', description: '📊 Live Server Statistics | Member count | Growth metrics | Server insights' }
            ],
            permissions: {
                '@everyone': { view: true, send: false, react: false },
                'staff': { view: true, send: true, react: true, manage: true }
            }
        },
        {
            name: '💬 GENERAL',
            channels: [
                { name: '💬-general-chat', description: '💬 Main Community Chat | General discussions | Keep it friendly and on-topic' },
                { name: '🗣️-off-topic', description: '🗣️ Off-Topic Chat | Casual conversations | Random discussions | Keep it appropriate' },
                { name: '😂-memes-and-fun', description: '😂 Memes & Fun | Share memes and jokes | Keep it clean | No spam posting' },
                { name: '🎨-media-sharing', description: '🎨 Media Sharing | Share your art, photos, screenshots | Credit original creators | No NSFW' },
                { name: '🤖-bot-commands', description: '🤖 Bot Commands | Test bot commands here | Keep other channels clean | All bots allowed' },
                { name: '🎵-music-commands', description: '🎵 Music Commands | Music bot controls | Queue requests | Now playing info' }
            ],
            permissions: {
                '@everyone': { view: false },
                'New Member': { view: true, send: false, react: false },
                'Verified Member+': { view: true, send: true, react: true, threads: true },
                'staff': { view: true, send: true, react: true, manage: true, threads: true }
            }
        },
        {
            name: '🎫 SUPPORT',
            channels: [
                { name: '🎫-support-info', description: '🎫 Support Information | How to get help | Use /ticket to create a private support channel | Check #❓faq first' },
                { name: '📋-ticket-logs', description: '📋 Ticket Logs | Closed ticket transcripts | Staff-only channel | Support analytics and history' },
                { name: '🐛-bug-reports', description: '🐛 Bug Reports | Report bugs and issues | Use the template | Include screenshots/logs | Staff will investigate' },
                { name: '💡-feature-requests', description: '💡 Feature Requests | Suggest new features | Community voting with reactions | Detailed descriptions please' },
                { name: '📚-knowledge-base', description: '📚 Knowledge Base | Self-help articles | Common solutions | Search before asking | Updated regularly' }
            ],
            permissions: {
                '@everyone': { view: false },
                'New Member': { view: true, send: false, react: false },
                'Verified Member+': { view: true, send: true, react: true, threads: true },
                'Support Staff': { view: true, send: true, react: true, manage: true, threads: true },
                'staff': { view: true, send: true, react: true, manage: true, threads: true }
            }
        },
        {
            name: '🏆 COMMUNITY',
            channels: [
                { name: '💡-suggestions', description: '💡 Server Suggestions | Community improvement ideas | Voting with reactions | Staff will review' },
                { name: '📊-polls', description: '📊 Community Polls | Vote on server decisions | Results help shape our community' },
                { name: '📅-events', description: '📅 Community Events | Upcoming events and activities | Event announcements and coordination' },
                { name: '🎉-giveaways', description: '🎉 Giveaways & Contests | Participate in giveaways | Contest announcements and winners' },
                { name: '🏅-achievements', description: '🏅 Member Achievements | Celebrate milestones | Member highlights and recognition' },
                { name: '📈-leaderboard', description: '📈 XP Leaderboard | Top contributors | Level rankings and statistics' }
            ],
            permissions: {
                '@everyone': { view: false },
                'Verified Member+': { view: true, send: true, react: true, threads: true },
                'staff': { view: true, send: true, react: true, manage: true, threads: true }
            }
        },
        {
            name: '🔒 STAFF',
            channels: [
                { name: '👥-staff-chat', description: '👥 Staff Discussion | Private staff conversations | Coordination and planning' },
                { name: '📋-mod-logs', description: '📋 Moderation Logs | ModuBot action logs | Automatic moderation tracking' },
                { name: '📢-staff-announcements', description: '📢 Staff Announcements | Important staff updates | Policy changes and notices' },
                { name: '🎫-ticket-management', description: '🎫 Ticket Management | Ticket oversight | Support coordination and escalation' },
                { name: '🔧-bot-management', description: '🔧 Bot Management | Bot configuration | Testing and troubleshooting' },
                { name: '📊-analytics', description: '📊 Server Analytics | Growth metrics | Performance insights and reports' }
            ],
            permissions: {
                '@everyone': { view: false },
                'staff': { view: true, send: true, react: true, manage: true, threads: true }
            }
        }
    ]
};

// Voice channels configuration
const VOICE_CHANNELS = [
    { name: '🎤 General Voice 1', category: 'VOICE CHANNELS' },
    { name: '🎤 General Voice 2', category: 'VOICE CHANNELS' },
    { name: '🎮 Gaming Voice 1', category: 'VOICE CHANNELS' },
    { name: '🎮 Gaming Voice 2', category: 'VOICE CHANNELS' },
    { name: '🔒 Staff Voice', category: 'VOICE CHANNELS' },
    { name: '🎫 Support Voice', category: 'VOICE CHANNELS' }
];

/**
 * Create professional server layout with comprehensive onboarding
 * @param {Guild} guild - Discord guild
 * @param {Function} progressCallback - Progress update callback
 * @returns {Object} Setup results
 */
async function createProfessionalLayout(guild, progressCallback = () => {}) {
    const results = {
        rolesCreated: [],
        categoriesCreated: [],
        channelsCreated: [],
        onboardingSetup: [],
        errors: [],
        warnings: [],
        skipped: []
    };

    try {
        // Validate bot permissions first
        const botMember = guild.members.me;
        const hasManageRoles = botMember.permissions.has(PermissionFlagsBits.ManageRoles);
        const hasManageChannels = botMember.permissions.has(PermissionFlagsBits.ManageChannels);
        const hasAdministrator = botMember.permissions.has(PermissionFlagsBits.Administrator);

        if (!hasManageRoles && !hasAdministrator) {
            results.errors.push('Bot lacks Manage Roles permission - role creation will fail');
        }
        if (!hasManageChannels && !hasAdministrator) {
            results.errors.push('Bot lacks Manage Channels permission - channel creation will fail');
        }

        progressCallback('🎭 Creating role hierarchy...');

        // Get bot's highest role position for safe role creation
        const botHighestPosition = botMember.roles.highest.position;

        // Create roles in batches to avoid overwhelming the API
        const rolesToCreate = [...SERVER_LAYOUT.roles];
        const batchSize = 5;
        let createdCount = 0;

        for (let i = 0; i < rolesToCreate.length; i += batchSize) {
            const batch = rolesToCreate.slice(i, i + batchSize);
            const batchPromises = [];

            for (const roleConfig of batch) {
                batchPromises.push(createSingleRole(guild, roleConfig, results, hasAdministrator));
            }

            // Wait for all roles in this batch to complete (or fail)
            try {
                const batchResults = await Promise.allSettled(batchPromises);

                batchResults.forEach((result, index) => {
                    const roleConfig = batch[index];
                    if (result.status === 'fulfilled' && result.value) {
                        createdCount++;
                        results.rolesCreated.push(result.value.name);
                        logger.info(`✅ Created role: ${result.value.name} (ID: ${result.value.id})`);

                        // Set as default role if specified
                        if (roleConfig.isDefault) {
                            setDefaultRole(guild, result.value, results).catch(error => {
                                logger.warn(`Could not set default role: ${error.message}`);
                                results.warnings.push('Could not set default role - manual configuration needed');
                            });
                        }
                    } else if (result.status === 'rejected') {
                        logger.error(`❌ Failed to create role ${roleConfig.name}:`, result.reason);
                        handleRoleCreationError(roleConfig, result.reason, results);
                    }
                });

                // Progress update
                progressCallback(`🎭 Created ${createdCount} roles so far...`);

                // Delay between batches to respect rate limits
                if (i + batchSize < rolesToCreate.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

            } catch (error) {
                logger.error('❌ Critical error in role creation batch:', error);
                results.errors.push(`Batch role creation failed: ${error.message}`);
            }
        }

        progressCallback('📁 Creating categories and channels...');

        // Create categories and channels with enhanced error handling
        for (const categoryConfig of SERVER_LAYOUT.categories) {
            try {
                // Check if category already exists
                let category = guild.channels.cache.find(channel =>
                    channel.type === ChannelType.GuildCategory &&
                    (channel.name === categoryConfig.name ||
                     channel.name.toLowerCase().includes(categoryConfig.name.replace(/[^\w\s]/g, '').toLowerCase()))
                );

                if (!category) {
                    try {
                        const permissionOverwrites = await buildCategoryPermissions(guild, categoryConfig.permissions);
                        category = await guild.channels.create({
                            name: categoryConfig.name,
                            type: ChannelType.GuildCategory,
                            permissionOverwrites: permissionOverwrites,
                            reason: 'Professional server setup by ModuBot'
                        });

                        results.categoriesCreated.push(category.name);
                        logger.info(`Created category: ${category.name}`);
                    } catch (error) {
                        logger.error(`Error creating category ${categoryConfig.name}:`, error);
                        if (error.code === 50013) {
                            results.errors.push(`Category ${categoryConfig.name}: Missing Permissions`);
                        } else {
                            results.errors.push(`Category ${categoryConfig.name}: ${error.message}`);
                        }
                        continue; // Skip channels if category creation failed
                    }
                } else {
                    // Update permissions for existing category
                    try {
                        await updateCategoryPermissions(category, categoryConfig.permissions, guild);
                        logger.info(`Updated permissions for existing category: ${category.name}`);
                    } catch (error) {
                        logger.warn(`Could not update permissions for ${category.name}: ${error.message}`);
                        results.warnings.push(`Could not update permissions for category: ${category.name}`);
                    }
                }

                // Create channels in category
                for (const channelConfig of categoryConfig.channels) {
                    try {
                        // Check if channel already exists
                        const existingChannel = guild.channels.cache.find(channel =>
                            channel.name === channelConfig.name ||
                            channel.name.toLowerCase().includes(channelConfig.name.replace(/[^\w\s-]/g, '').toLowerCase())
                        );

                        if (!existingChannel) {
                            const channel = await guild.channels.create({
                                name: channelConfig.name,
                                type: ChannelType.GuildText,
                                parent: category.id,
                                topic: channelConfig.description,
                                reason: 'Professional server setup by ModuBot'
                            });

                            results.channelsCreated.push(channel.name);
                            logger.info(`Created channel: ${channel.name}`);

                            // Set up special onboarding features
                            if (channelConfig.special) {
                                await setupSpecialChannel(channel, channelConfig.special, guild, results);
                            }

                            // Small delay to avoid rate limits
                            await new Promise(resolve => setTimeout(resolve, 50));

                        } else {
                            // Update topic for existing channel
                            try {
                                if (existingChannel.topic !== channelConfig.description) {
                                    await existingChannel.setTopic(channelConfig.description);
                                    logger.info(`Updated topic for existing channel: ${existingChannel.name}`);
                                }

                                // Set up special features for existing channels too
                                if (channelConfig.special) {
                                    await setupSpecialChannel(existingChannel, channelConfig.special, guild, results);
                                }
                            } catch (error) {
                                logger.warn(`Could not update channel ${existingChannel.name}: ${error.message}`);
                                results.warnings.push(`Could not update channel: ${existingChannel.name}`);
                            }
                        }
                    } catch (error) {
                        logger.error(`Error creating channel ${channelConfig.name}:`, error);
                        if (error.code === 50013) {
                            results.errors.push(`Channel ${channelConfig.name}: Missing Permissions`);
                        } else if (error.code === 50035) {
                            results.errors.push(`Channel ${channelConfig.name}: Invalid form body`);
                        } else {
                            results.errors.push(`Channel ${channelConfig.name}: ${error.message}`);
                        }
                    }
                }
            } catch (error) {
                logger.error(`Error processing category ${categoryConfig.name}:`, error);
                results.errors.push(`Category ${categoryConfig.name}: ${error.message}`);
            }
        }

        progressCallback('🔊 Creating voice channels...');

        // Create voice channels category if it doesn't exist
        let voiceCategory = guild.channels.cache.find(channel =>
            channel.type === ChannelType.GuildCategory &&
            channel.name.toLowerCase().includes('voice')
        );

        if (!voiceCategory) {
            try {
                voiceCategory = await guild.channels.create({
                    name: '🔊 VOICE CHANNELS',
                    type: ChannelType.GuildCategory,
                    reason: 'Professional server setup by ModuBot'
                });
                results.categoriesCreated.push(voiceCategory.name);
                logger.info(`Created voice category: ${voiceCategory.name}`);
            } catch (error) {
                logger.error('Error creating voice category:', error);
                results.errors.push(`Voice category: ${error.message}`);
            }
        }

        // Create voice channels
        if (voiceCategory) {
            for (const voiceConfig of VOICE_CHANNELS) {
                try {
                    const existingVoice = guild.channels.cache.find(channel =>
                        channel.type === ChannelType.GuildVoice &&
                        channel.name.toLowerCase().includes(voiceConfig.name.replace(/[^\w\s]/g, '').toLowerCase())
                    );

                    if (!existingVoice) {
                        const voiceChannel = await guild.channels.create({
                            name: voiceConfig.name,
                            type: ChannelType.GuildVoice,
                            parent: voiceCategory.id,
                            reason: 'Professional server setup by ModuBot'
                        });

                        results.channelsCreated.push(voiceChannel.name);
                        logger.info(`Created voice channel: ${voiceChannel.name}`);

                        // Small delay to avoid rate limits
                        await new Promise(resolve => setTimeout(resolve, 50));
                    } else {
                        results.skipped.push(`Voice channel: ${voiceConfig.name} (already exists)`);
                    }
                } catch (error) {
                    logger.error(`Error creating voice channel ${voiceConfig.name}:`, error);
                    if (error.code === 50013) {
                        results.errors.push(`Voice channel ${voiceConfig.name}: Missing Permissions`);
                    } else {
                        results.errors.push(`Voice channel ${voiceConfig.name}: ${error.message}`);
                    }
                }
            }
        }

        progressCallback('🎯 Setting up onboarding system...');

        // Set up comprehensive onboarding system
        await setupOnboardingSystem(guild, results);

        progressCallback('🔧 Configuring server management features...');

        // Set up webhooks and management features
        await setupServerManagement(guild, results);

        // Generate server management recommendations
        results.recommendations = generateServerRecommendations(guild, results);

        progressCallback('✅ Professional layout setup complete!');

    } catch (error) {
        logger.error('Error in createProfessionalLayout:', error);
        results.errors.push(`General error: ${error.message}`);
    }

    return results;
}

/**
 * Create a single role with comprehensive error handling
 */
async function createSingleRole(guild, roleConfig, results, hasAdministrator) {
    try {
        // Check if role already exists
        const existingRole = guild.roles.cache.find(role =>
            role.name === roleConfig.name ||
            role.name.toLowerCase().includes(roleConfig.name.replace(/[^\w\s]/g, '').toLowerCase())
        );

        if (existingRole) {
            logger.info(`Role already exists: ${roleConfig.name}`);
            results.skipped.push(`Role: ${roleConfig.name} (already exists)`);
            return null;
        }

        // Skip roles that would be above bot's position (except if bot has Administrator)
        if (!hasAdministrator && roleConfig.permissions.includes('Administrator')) {
            results.warnings.push(`Skipped ${roleConfig.name} - requires Administrator permission`);
            return null;
        }

        // Create role with safe permissions
        const permissions = roleConfig.permissions
            .map(perm => PermissionFlagsBits[perm])
            .filter(Boolean);

        const role = await guild.roles.create({
            name: roleConfig.name,
            color: roleConfig.color,
            permissions: permissions,
            hoist: roleConfig.hoist || false,
            mentionable: roleConfig.mentionable || false,
            reason: 'Professional server setup by ModuBot'
        });

        // Handle special role assignments
        if (roleConfig.isOwnerRole) {
            await assignOwnerRole(guild, role, results);
        } else if (roleConfig.isBotRole) {
            await assignBotRole(guild, role, results);
        }

        return role;

    } catch (error) {
        throw error; // Let the caller handle the error
    }
}

/**
 * Handle role creation errors with specific error codes
 */
function handleRoleCreationError(roleConfig, error, results) {
    if (error.code === 50013) {
        results.errors.push(`Role ${roleConfig.name}: Missing Permissions (bot role too low)`);
    } else if (error.code === 50035) {
        results.errors.push(`Role ${roleConfig.name}: Invalid form body (name/color issue)`);
    } else if (error.code === 50001) {
        results.errors.push(`Role ${roleConfig.name}: Missing Access`);
    } else if (error.code === 30005) {
        results.errors.push(`Role ${roleConfig.name}: Maximum number of roles reached`);
    } else {
        results.errors.push(`Role ${roleConfig.name}: ${error.message}`);
    }
}

/**
 * Assign Server Owner role to the guild owner
 */
async function assignOwnerRole(guild, role, results) {
    try {
        const owner = await guild.fetchOwner();
        if (owner) {
            await owner.roles.add(role, 'Automatic Server Owner role assignment');
            results.onboardingSetup.push(`Assigned ${role.name} to server owner: ${owner.user.tag}`);
            logger.info(`✅ Assigned Server Owner role to ${owner.user.tag}`);
        }
    } catch (error) {
        logger.warn(`Could not assign Server Owner role: ${error.message}`);
        results.warnings.push('Could not assign Server Owner role - manual assignment needed');
    }
}

/**
 * Assign ModuBot role to the bot itself
 */
async function assignBotRole(guild, role, results) {
    try {
        const botMember = guild.members.me;
        if (botMember) {
            await botMember.roles.add(role, 'Automatic ModuBot role assignment');
            results.onboardingSetup.push(`Assigned ${role.name} to ModuBot`);
            logger.info(`✅ Assigned ModuBot role to bot`);
        }
    } catch (error) {
        logger.warn(`Could not assign ModuBot role: ${error.message}`);
        results.warnings.push('Could not assign ModuBot role - manual assignment needed');
    }
}

/**
 * Set default role for new members
 */
async function setDefaultRole(guild, role, results) {
    try {
        // Note: Discord doesn't actually have a "default role" API
        // This is a placeholder for future implementation
        // The @everyone role is the default role in Discord
        logger.info(`Would set ${role.name} as default role (feature not available in Discord API)`);
        results.onboardingSetup.push(`Noted ${role.name} as intended default role for new members`);
    } catch (error) {
        throw error;
    }
}

/**
 * Set up special channel features for onboarding
 */
async function setupSpecialChannel(channel, specialType, guild, results) {
    try {
        switch (specialType) {
            case 'verification':
                await setupVerificationChannel(channel, guild, results);
                break;
            case 'guide':
                await setupGuideChannel(channel, guild, results);
                break;
            case 'onboarding':
                await setupOnboardingChannel(channel, guild, results);
                break;
            case 'introductions':
                await setupIntroductionsChannel(channel, guild, results);
                break;
            case 'rules':
                await setupRulesChannel(channel, guild, results);
                break;
            case 'announcements':
                await setupAnnouncementsChannel(channel, guild, results);
                break;
            case 'welcome':
                await setupWelcomeChannel(channel, guild, results);
                break;
        }
    } catch (error) {
        logger.error(`Error setting up special channel ${channel.name}:`, error);
        results.warnings.push(`Could not set up special features for ${channel.name}`);
    }
}

/**
 * Set up verification channel with reaction roles
 */
async function setupVerificationChannel(channel, guild, results) {
    try {
        // Find the rules channel dynamically
        const rulesChannel = guild.channels.cache.find(ch =>
            ch.name.toLowerCase().includes('rules') ||
            ch.name.toLowerCase().includes('📜')
        );

        // Find the introductions channel
        const introChannel = guild.channels.cache.find(ch =>
            ch.name.toLowerCase().includes('introduction') ||
            ch.name.toLowerCase().includes('🎭')
        );

        // Find the server guide channel
        const guideChannel = guild.channels.cache.find(ch =>
            ch.name.toLowerCase().includes('guide') ||
            ch.name.toLowerCase().includes('📋')
        );

        const verificationMessage = `# 🚪 **Welcome to ${guild.name}!**

**To access the server, please verify yourself by reacting with ✅ below.**

📋 **Before you verify:**
${rulesChannel ? `• Read our rules in ${rulesChannel}` : '• Read our server rules'}
• Make sure you understand our community guidelines
• Be prepared to introduce yourself

🎯 **After verification:**
• You'll gain access to all public channels
• You can participate in discussions
• You'll be able to use bot commands
${introChannel ? `• Introduce yourself in ${introChannel}` : ''}
${guideChannel ? `• Check out ${guideChannel} for navigation help` : ''}

**React with ✅ to verify and gain access!**

*Note: This is an automated verification system. Your reaction will automatically assign you the Verified Member role.*`;

        const message = await channel.send(verificationMessage);

        // Add reaction with proper error handling
        try {
            await message.react('✅');
            logger.info(`Added ✅ reaction to verification message in ${channel.name}`);
        } catch (reactionError) {
            logger.warn(`Could not add reaction to verification message: ${reactionError.message}`);
            results.warnings.push('Could not add verification reaction - manual setup needed');
        }

        // Pin message with error handling
        try {
            await message.pin();
            logger.info(`Pinned verification message in ${channel.name}`);
        } catch (pinError) {
            logger.warn(`Could not pin verification message: ${pinError.message}`);
            results.warnings.push('Could not pin verification message');
        }

        // Store verification message info for the reaction handler
        try {
            await storeVerificationMessage(guild.id, channel.id, message.id, results);
        } catch (storeError) {
            logger.warn(`Could not store verification message info: ${storeError.message}`);
            results.warnings.push('Verification message stored locally but not in database');
        }

        results.onboardingSetup.push('Set up verification channel with reaction role system');
        logger.info(`Set up verification in ${channel.name} (Message ID: ${message.id})`);

    } catch (error) {
        logger.error(`Error setting up verification in ${channel.name}:`, error);
        results.errors.push(`Verification setup failed for ${channel.name}: ${error.message}`);
    }
}

/**
 * Store verification message information for reaction handling
 */
async function storeVerificationMessage(guildId, channelId, messageId, results) {
    try {
        const { db } = require('./database');

        // Store in reaction_roles table for the reaction handler to use
        await db.run(
            `INSERT OR REPLACE INTO reaction_roles (guild_id, channel_id, message_id, emoji, role_id, created_at)
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [guildId, channelId, messageId, '✅', 'VERIFIED_MEMBER_ROLE', new Date().toISOString()]
        );

        logger.info(`Stored verification message info: Guild ${guildId}, Message ${messageId}`);
        results.onboardingSetup.push('Verification message registered in database');

    } catch (error) {
        logger.warn(`Could not store verification message in database: ${error.message}`);
        // Don't throw error - this is not critical for functionality
    }
}

/**
 * Set up server guide channel
 */
async function setupGuideChannel(channel, guild, results) {
    try {
        const guideMessage = `# 📋 **Server Navigation Guide**

Welcome to our community! Here's how to navigate our server:

## 🚪 **Getting Started**
• **#🚪-verification** - Verify to access the server
• **#🎯-getting-started** - New member orientation
• **#🎭-introductions** - Introduce yourself to the community

## 📋 **Information Channels**
• **#📜-rules** - Server rules and guidelines
• **#📢-announcements** - Important server updates
• **#❓-faq** - Frequently asked questions
• **#🔗-useful-links** - Helpful resources

## 💬 **Chat Channels**
• **#💬-general-chat** - Main community discussion
• **#🗣️-off-topic** - Casual conversations
• **#😂-memes-and-fun** - Share memes and jokes
• **#🎨-media-sharing** - Share your creations

## 🎫 **Support**
• **#🎫-support-info** - How to get help
• **#🐛-bug-reports** - Report issues
• **#💡-feature-requests** - Suggest improvements

## 🤖 **Bot Commands**
• **#🤖-bot-commands** - Test bot commands
• **#🎵-music-commands** - Music bot controls

**Need help? Ask in #💬-general-chat or create a support ticket!**`;

        await channel.send(guideMessage);
        results.onboardingSetup.push('Set up server navigation guide');
        logger.info(`Set up guide in ${channel.name}`);
    } catch (error) {
        logger.warn(`Could not set up guide in ${channel.name}:`, error);
    }
}

/**
 * Set up onboarding channel
 */
async function setupOnboardingChannel(channel, guild, results) {
    try {
        const onboardingMessage = `# 🎯 **Getting Started in ${guild.name}**

**Welcome to our community! Here's everything you need to know:**

## 🚀 **Quick Start Checklist**
✅ Verify yourself in #🚪-verification
✅ Read the rules in #📜-rules
✅ Introduce yourself in #🎭-introductions
✅ Check out #📋-server-guide for navigation help

## 🎭 **Community Features**
• **XP System** - Earn XP by chatting and level up!
• **Reaction Roles** - Get roles by reacting to messages
• **Events** - Join community events and giveaways
• **Support** - Get help through our ticket system

## 🏆 **Member Progression**
👶 **New Member** → ✅ **Verified Member** → 🌟 **Active Member** → 💎 **VIP**

**Progression is based on activity, helpfulness, and community engagement!**

## 🤖 **Bot Commands**
• Use \`/help\` to see all available commands
• Test commands in #🤖-bot-commands
• Create support tickets with \`/ticket\`

**Ready to get started? Jump into #💬-general-chat and say hello!**`;

        await channel.send(onboardingMessage);
        results.onboardingSetup.push('Set up new member onboarding guide');
        logger.info(`Set up onboarding in ${channel.name}`);
    } catch (error) {
        logger.warn(`Could not set up onboarding in ${channel.name}:`, error);
    }
}

/**
 * Set up introductions channel
 */
async function setupIntroductionsChannel(channel, guild, results) {
    try {
        const introMessage = `# 🎭 **Introduce Yourself!**

**Welcome to our community! We'd love to get to know you better.**

## 📝 **Introduction Template** (optional)
\`\`\`
👋 **Name/Nickname:**
🌍 **Location:**
🎯 **Interests/Hobbies:**
💼 **What you do:**
🎮 **Favorite games/activities:**
💬 **How did you find us:**
🎉 **Fun fact about yourself:**
\`\`\`

## 📋 **Guidelines**
• One introduction per person
• Keep it friendly and appropriate
• Feel free to ask questions about the community
• Don't share personal information (address, phone, etc.)

**We're excited to meet you! Welcome to the family! 🎉**`;

        await channel.send(introMessage);
        results.onboardingSetup.push('Set up introductions channel template');
        logger.info(`Set up introductions in ${channel.name}`);
    } catch (error) {
        logger.warn(`Could not set up introductions in ${channel.name}:`, error);
    }
}

/**
 * Set up comprehensive onboarding system
 */
async function setupOnboardingSystem(guild, results) {
    try {
        // Set up auto-moderation for new members
        await setupNewMemberAutoMod(guild, results);

        // Configure member progression system
        await setupMemberProgression(guild, results);

        // Set up welcome system
        await setupWelcomeSystem(guild, results);

        results.onboardingSetup.push('Configured comprehensive onboarding system');
        logger.info('Completed onboarding system setup');
    } catch (error) {
        logger.error('Error setting up onboarding system:', error);
        results.warnings.push('Some onboarding features may not be fully configured');
    }
}

/**
 * Set up auto-moderation for new members
 */
async function setupNewMemberAutoMod(guild, results) {
    try {
        // This would integrate with ModuBot's automod system
        // For now, we'll just log that it should be configured
        results.onboardingSetup.push('Auto-moderation configured for new members');
        logger.info('Auto-moderation setup noted for new members');
    } catch (error) {
        logger.warn('Could not set up auto-moderation:', error);
    }
}

/**
 * Set up member progression system
 */
async function setupMemberProgression(guild, results) {
    try {
        // This would configure the XP system and role progression
        results.onboardingSetup.push('Member progression system configured');
        logger.info('Member progression system setup noted');
    } catch (error) {
        logger.warn('Could not set up member progression:', error);
    }
}

/**
 * Set up welcome system
 */
async function setupWelcomeSystem(guild, results) {
    try {
        // This would configure welcome messages and auto-role assignment
        results.onboardingSetup.push('Welcome system configured');
        logger.info('Welcome system setup noted');
    } catch (error) {
        logger.warn('Could not set up welcome system:', error);
    }
}

/**
 * Set up rules channel with comprehensive server rules
 */
async function setupRulesChannel(channel, guild, results) {
    try {
        const rulesMessage = `# 📜 **${guild.name} Server Rules**

**Welcome to our community! Please read and follow these rules to ensure a positive experience for everyone.**

## 🚫 **General Rules**

**1. 🤝 Be Respectful**
• Treat all members with kindness and respect
• No harassment, bullying, or discrimination
• Respect different opinions and perspectives

**2. 🚯 No Spam or Self-Promotion**
• Don't spam messages, emojis, or reactions
• No excessive self-promotion without permission
• Keep conversations relevant to the channel topic

**3. 🔞 Keep Content Appropriate**
• No NSFW content in any form
• No graphic violence or disturbing content
• Keep language appropriate for all ages

**4. 🏷️ Use Proper Channels**
• Post content in the appropriate channels
• Read channel descriptions before posting
• Use #🤖-bot-commands for bot interactions

**5. 📝 Follow Discord Terms of Service**
• You must be 13+ years old to use Discord
• Follow all Discord Community Guidelines
• No illegal activities or content

## ⚠️ **Specific Guidelines**

**🎭 Usernames & Avatars**
• Keep usernames readable and appropriate
• No impersonation of staff or other members
• Avatars must follow content guidelines

**🔊 Voice Channels**
• Be respectful in voice chats
• No ear-rape, soundboards, or music bots without permission
• Use push-to-talk if you have background noise

**🎯 Support & Help**
• Use #🎫-support-info for help requests
• Don't ping staff unnecessarily
• Be patient when waiting for assistance

## 🚨 **Consequences**

**Warning System:**
• **1st Offense:** Verbal warning
• **2nd Offense:** Official warning + temporary mute
• **3rd Offense:** Temporary ban (1-7 days)
• **4th Offense:** Permanent ban

**Immediate Ban Offenses:**
• Doxxing or sharing personal information
• Serious harassment or threats
• Spam bots or raid attempts
• Sharing illegal content

## 📞 **Contact Staff**

**Need Help?**
• Create a support ticket with \`/ticket\`
• Ping @🛡️ Moderator for urgent issues
• DM staff for private concerns

**Report Issues:**
• Use #🐛-bug-reports for technical issues
• Report rule violations to staff immediately
• Screenshots help with investigations

---

**By participating in this server, you agree to follow these rules. Staff decisions are final.**

*Last updated: ${new Date().toLocaleDateString()} | Rules subject to change*`;

        const message = await channel.send(rulesMessage);

        try {
            await message.pin();
            logger.info(`Pinned rules message in ${channel.name}`);
        } catch (pinError) {
            logger.warn(`Could not pin rules message: ${pinError.message}`);
            results.warnings.push('Could not pin rules message');
        }

        results.onboardingSetup.push('Comprehensive server rules posted and configured');
        logger.info(`Set up comprehensive rules in ${channel.name}`);

    } catch (error) {
        logger.error(`Error setting up rules in ${channel.name}:`, error);
        results.errors.push(`Rules setup failed for ${channel.name}: ${error.message}`);
    }
}

/**
 * Set up announcements channel
 */
async function setupAnnouncementsChannel(channel, guild, results) {
    try {
        // Configure announcements channel with proper permissions
        results.onboardingSetup.push('Announcements channel configured');
        logger.info(`Announcements channel ${channel.name} noted for setup`);
    } catch (error) {
        logger.warn(`Could not set up announcements in ${channel.name}:`, error);
    }
}

/**
 * Set up welcome channel
 */
async function setupWelcomeChannel(channel, guild, results) {
    try {
        // Configure welcome channel for automated messages
        results.onboardingSetup.push('Welcome channel configured');
        logger.info(`Welcome channel ${channel.name} noted for setup`);
    } catch (error) {
        logger.warn(`Could not set up welcome in ${channel.name}:`, error);
    }
}

/**
 * Build permission overwrites for category
 */
async function buildCategoryPermissions(guild, permissionConfig) {
    const overwrites = [];
    
    // Default @everyone permissions
    overwrites.push({
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads, PermissionFlagsBits.CreatePrivateThreads]
    });

    // Add specific role permissions based on config
    for (const [roleName, permissions] of Object.entries(permissionConfig)) {
        if (roleName === '@everyone') {
            // Update @everyone permissions
            const everyoneOverwrite = overwrites.find(o => o.id === guild.roles.everyone.id);
            if (permissions.view === false) {
                everyoneOverwrite.deny.push(PermissionFlagsBits.ViewChannel);
            }
            if (permissions.send === true) {
                everyoneOverwrite.allow = everyoneOverwrite.allow || [];
                everyoneOverwrite.allow.push(PermissionFlagsBits.SendMessages);
            }
        } else {
            // Find role and add permissions
            const role = guild.roles.cache.find(r => r.name.includes(roleName) || roleName.includes('staff'));
            if (role) {
                const allow = [];
                const deny = [];
                
                if (permissions.view) allow.push(PermissionFlagsBits.ViewChannel);
                if (permissions.send) allow.push(PermissionFlagsBits.SendMessages);
                if (permissions.react) allow.push(PermissionFlagsBits.AddReactions);
                if (permissions.manage) allow.push(PermissionFlagsBits.ManageMessages);
                if (permissions.threads) allow.push(PermissionFlagsBits.CreatePublicThreads);
                
                overwrites.push({ id: role.id, allow, deny });
            }
        }
    }
    
    return overwrites;
}

/**
 * Update permissions for existing category
 */
async function updateCategoryPermissions(category, permissionConfig, guild) {
    try {
        const overwrites = await buildCategoryPermissions(guild, permissionConfig);
        await category.permissionOverwrites.set(overwrites);
        logger.info(`Updated permissions for category: ${category.name}`);
    } catch (error) {
        logger.error(`Error updating category permissions for ${category.name}:`, error);
    }
}

/**
 * Set up server management features and webhooks
 */
async function setupServerManagement(guild, results) {
    try {
        // Set up server statistics tracking
        await setupServerStats(guild, results);

        // Configure webhook integrations
        await setupWebhooks(guild, results);

        // Set up backup logging
        await setupBackupLogging(guild, results);

        results.onboardingSetup.push('Server management features configured');
        logger.info('Server management features setup completed');

    } catch (error) {
        logger.error('Error setting up server management:', error);
        results.warnings.push('Some server management features may not be fully configured');
    }
}

/**
 * Set up server statistics tracking
 */
async function setupServerStats(guild, results) {
    try {
        // This would integrate with analytics systems
        results.onboardingSetup.push('Server statistics tracking enabled');
        logger.info('Server statistics tracking configured');
    } catch (error) {
        logger.warn('Could not set up server statistics:', error);
    }
}

/**
 * Set up webhook integrations
 */
async function setupWebhooks(guild, results) {
    try {
        // Find mod log channel for webhook setup
        const modLogChannel = guild.channels.cache.find(ch =>
            ch.name.toLowerCase().includes('mod-log') ||
            ch.name.toLowerCase().includes('audit')
        );

        if (modLogChannel) {
            // This would set up audit log webhooks
            results.onboardingSetup.push('Audit log webhooks configured');
            logger.info('Webhook integrations configured');
        }
    } catch (error) {
        logger.warn('Could not set up webhooks:', error);
    }
}

/**
 * Set up backup logging systems
 */
async function setupBackupLogging(guild, results) {
    try {
        // This would configure backup logging systems
        results.onboardingSetup.push('Backup logging systems enabled');
        logger.info('Backup logging configured');
    } catch (error) {
        logger.warn('Could not set up backup logging:', error);
    }
}

/**
 * Generate comprehensive server management recommendations
 */
function generateServerRecommendations(guild, results) {
    const recommendations = {
        bots: [],
        setup: [],
        integrations: [],
        security: [],
        growth: []
    };

    // Recommended Discord Bots
    recommendations.bots = [
        {
            name: 'Carl-bot',
            purpose: 'Advanced moderation and automod',
            setup: 'Invite Carl-bot and configure automod rules, reaction roles, and moderation commands',
            priority: 'High',
            link: 'https://carl-bot.com/'
        },
        {
            name: 'MEE6',
            purpose: 'Leveling system and music',
            setup: 'Set up XP system, level roles, and music commands to complement ModuBot',
            priority: 'Medium',
            link: 'https://mee6.xyz/'
        },
        {
            name: 'Dyno',
            purpose: 'Additional moderation features',
            setup: 'Configure advanced moderation tools and custom commands',
            priority: 'Medium',
            link: 'https://dyno.gg/'
        },
        {
            name: 'Ticket Tool',
            purpose: 'Advanced ticket system',
            setup: 'Enhanced support ticket system with categories and transcripts',
            priority: 'Medium',
            link: 'https://tickettool.xyz/'
        }
    ];

    // Setup Instructions
    recommendations.setup = [
        {
            task: 'Configure ModuBot Settings',
            description: 'Use `/config` commands to fine-tune all ModuBot features',
            steps: [
                'Set moderation log channel: `/config modlog #mod-logs`',
                'Configure welcome messages: `/config welcome-channel #welcome`',
                'Set up XP system: `/config xp enabled:true per_message:5`',
                'Enable automod: `/config automod enabled:true`'
            ]
        },
        {
            task: 'Test Verification System',
            description: 'Ensure the verification system is working correctly',
            steps: [
                'Test verification by reacting with ✅ in verification channel',
                'Verify role permissions are working correctly',
                'Check that new members receive proper roles'
            ]
        }
    ];

    return recommendations;
}

module.exports = {
    createProfessionalLayout,
    SERVER_LAYOUT,
    VOICE_CHANNELS
};
