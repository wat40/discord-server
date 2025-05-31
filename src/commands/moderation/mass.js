const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logger } = require('../../utils/logger');
const { sendErrorMessage, replyToInteraction, deferReply } = require('../../utils/interactions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mass')
        .setDescription('Mass moderation actions')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ban')
                .setDescription('Mass ban users by ID')
                .addStringOption(option =>
                    option.setName('user_ids')
                        .setDescription('User IDs separated by spaces or commas')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for mass ban')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('delete_days')
                        .setDescription('Days of messages to delete (0-7)')
                        .setMinValue(0)
                        .setMaxValue(7)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('kick')
                .setDescription('Mass kick users by ID')
                .addStringOption(option =>
                    option.setName('user_ids')
                        .setDescription('User IDs separated by spaces or commas')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for mass kick')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('role')
                .setDescription('Mass add/remove roles')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to perform')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Add Role', value: 'add' },
                            { name: 'Remove Role', value: 'remove' }
                        ))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add/remove')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('user_ids')
                        .setDescription('User IDs separated by spaces or commas')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for mass role change')
                        .setRequired(false)))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .setDMPermission(false),
    
    cooldown: 10,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        // Additional permission check for mass actions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await sendErrorMessage(interaction, 'You need Administrator permission to use mass moderation commands.');
        }
        
        try {
            switch (subcommand) {
                case 'ban':
                    await handleMassBan(interaction);
                    break;
                case 'kick':
                    await handleMassKick(interaction);
                    break;
                case 'role':
                    await handleMassRole(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Error in mass command:', error);
            await sendErrorMessage(interaction, 'An error occurred while processing the mass action.');
        }
    },
};

async function handleMassBan(interaction) {
    const userIdsString = interaction.options.getString('user_ids');
    const reason = interaction.options.getString('reason') || 'Mass ban - No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;
    
    // Parse user IDs
    const userIds = parseUserIds(userIdsString);
    if (userIds.length === 0) {
        return await sendErrorMessage(interaction, 'No valid user IDs provided.');
    }
    
    if (userIds.length > 50) {
        return await sendErrorMessage(interaction, 'Cannot ban more than 50 users at once.');
    }
    
    await deferReply(interaction);
    
    const results = {
        successful: [],
        failed: [],
        alreadyBanned: [],
        notFound: []
    };
    
    for (const userId of userIds) {
        try {
            // Check if user is already banned
            const banList = await interaction.guild.bans.fetch();
            if (banList.has(userId)) {
                results.alreadyBanned.push(userId);
                continue;
            }
            
            // Try to fetch user info
            let user;
            try {
                user = await interaction.client.users.fetch(userId);
            } catch {
                results.notFound.push(userId);
                continue;
            }
            
            // Check if user is in guild and their role hierarchy
            const member = interaction.guild.members.cache.get(userId);
            if (member) {
                if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                    results.failed.push({ userId, reason: 'Higher or equal role' });
                    continue;
                }
                
                if (!member.bannable) {
                    results.failed.push({ userId, reason: 'Not bannable' });
                    continue;
                }
            }
            
            // Perform the ban
            await interaction.guild.members.ban(userId, {
                reason: `${reason} | Mass ban by ${interaction.user.tag}`,
                deleteMessageDays: deleteDays
            });
            
            results.successful.push({ userId, tag: user.tag });
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            logger.error(`Error banning user ${userId}:`, error);
            results.failed.push({ userId, reason: error.message });
        }
    }
    
    // Create result embed
    const embed = new EmbedBuilder()
        .setColor(results.successful.length > 0 ? 0xff0000 : 0xff9900)
        .setTitle('🔨 Mass Ban Results')
        .addFields(
            { name: 'Successful', value: results.successful.length.toString(), inline: true },
            { name: 'Failed', value: results.failed.length.toString(), inline: true },
            { name: 'Already Banned', value: results.alreadyBanned.length.toString(), inline: true }
        )
        .setTimestamp();
    
    if (results.successful.length > 0) {
        const successList = results.successful.slice(0, 10).map(r => r.tag || r.userId).join('\n');
        embed.addFields({
            name: `✅ Successfully Banned (${results.successful.length})`,
            value: successList + (results.successful.length > 10 ? `\n... and ${results.successful.length - 10} more` : ''),
            inline: false
        });
    }
    
    if (results.failed.length > 0) {
        const failedList = results.failed.slice(0, 5).map(r => `${r.userId}: ${r.reason}`).join('\n');
        embed.addFields({
            name: `❌ Failed (${results.failed.length})`,
            value: failedList + (results.failed.length > 5 ? `\n... and ${results.failed.length - 5} more` : ''),
            inline: false
        });
    }
    
    await interaction.editReply({ embeds: [embed] });
    
    // Log to mod log
    await logMassAction(interaction, 'MASS_BAN', results, reason);
    
    logger.info(`${interaction.user.tag} performed mass ban in ${interaction.guild.name}: ${results.successful.length} successful, ${results.failed.length} failed`);
}

async function handleMassKick(interaction) {
    const userIdsString = interaction.options.getString('user_ids');
    const reason = interaction.options.getString('reason') || 'Mass kick - No reason provided';
    
    const userIds = parseUserIds(userIdsString);
    if (userIds.length === 0) {
        return await sendErrorMessage(interaction, 'No valid user IDs provided.');
    }
    
    if (userIds.length > 50) {
        return await sendErrorMessage(interaction, 'Cannot kick more than 50 users at once.');
    }
    
    await deferReply(interaction);
    
    const results = {
        successful: [],
        failed: [],
        notInGuild: []
    };
    
    for (const userId of userIds) {
        try {
            const member = interaction.guild.members.cache.get(userId);
            if (!member) {
                results.notInGuild.push(userId);
                continue;
            }
            
            // Check role hierarchy
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                results.failed.push({ userId, reason: 'Higher or equal role' });
                continue;
            }
            
            if (!member.kickable) {
                results.failed.push({ userId, reason: 'Not kickable' });
                continue;
            }
            
            // Perform the kick
            await member.kick(`${reason} | Mass kick by ${interaction.user.tag}`);
            results.successful.push({ userId, tag: member.user.tag });
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            logger.error(`Error kicking user ${userId}:`, error);
            results.failed.push({ userId, reason: error.message });
        }
    }
    
    // Create result embed
    const embed = new EmbedBuilder()
        .setColor(results.successful.length > 0 ? 0xff9900 : 0xff0000)
        .setTitle('👢 Mass Kick Results')
        .addFields(
            { name: 'Successful', value: results.successful.length.toString(), inline: true },
            { name: 'Failed', value: results.failed.length.toString(), inline: true },
            { name: 'Not in Guild', value: results.notInGuild.length.toString(), inline: true }
        )
        .setTimestamp();
    
    if (results.successful.length > 0) {
        const successList = results.successful.slice(0, 10).map(r => r.tag).join('\n');
        embed.addFields({
            name: `✅ Successfully Kicked (${results.successful.length})`,
            value: successList + (results.successful.length > 10 ? `\n... and ${results.successful.length - 10} more` : ''),
            inline: false
        });
    }
    
    await interaction.editReply({ embeds: [embed] });
    
    // Log to mod log
    await logMassAction(interaction, 'MASS_KICK', results, reason);
    
    logger.info(`${interaction.user.tag} performed mass kick in ${interaction.guild.name}: ${results.successful.length} successful, ${results.failed.length} failed`);
}

async function handleMassRole(interaction) {
    const action = interaction.options.getString('action');
    const role = interaction.options.getRole('role');
    const userIdsString = interaction.options.getString('user_ids');
    const reason = interaction.options.getString('reason') || `Mass role ${action} - No reason provided`;
    
    const userIds = parseUserIds(userIdsString);
    if (userIds.length === 0) {
        return await sendErrorMessage(interaction, 'No valid user IDs provided.');
    }
    
    if (userIds.length > 100) {
        return await sendErrorMessage(interaction, 'Cannot modify roles for more than 100 users at once.');
    }
    
    // Check role hierarchy
    if (role.position >= interaction.member.roles.highest.position) {
        return await sendErrorMessage(interaction, 'You cannot manage a role that is higher than or equal to your highest role.');
    }
    
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return await sendErrorMessage(interaction, 'I cannot manage a role that is higher than or equal to my highest role.');
    }
    
    await deferReply(interaction);
    
    const results = {
        successful: [],
        failed: [],
        notInGuild: [],
        alreadyHas: [],
        doesntHave: []
    };
    
    for (const userId of userIds) {
        try {
            const member = interaction.guild.members.cache.get(userId);
            if (!member) {
                results.notInGuild.push(userId);
                continue;
            }
            
            if (action === 'add') {
                if (member.roles.cache.has(role.id)) {
                    results.alreadyHas.push({ userId, tag: member.user.tag });
                    continue;
                }
                
                await member.roles.add(role, `${reason} | Mass role add by ${interaction.user.tag}`);
            } else {
                if (!member.roles.cache.has(role.id)) {
                    results.doesntHave.push({ userId, tag: member.user.tag });
                    continue;
                }
                
                await member.roles.remove(role, `${reason} | Mass role remove by ${interaction.user.tag}`);
            }
            
            results.successful.push({ userId, tag: member.user.tag });
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 50));
            
        } catch (error) {
            logger.error(`Error ${action}ing role for user ${userId}:`, error);
            results.failed.push({ userId, reason: error.message });
        }
    }
    
    // Create result embed
    const embed = new EmbedBuilder()
        .setColor(results.successful.length > 0 ? 0x00ff00 : 0xff9900)
        .setTitle(`🎭 Mass Role ${action.charAt(0).toUpperCase() + action.slice(1)} Results`)
        .setDescription(`Role: ${role}`)
        .addFields(
            { name: 'Successful', value: results.successful.length.toString(), inline: true },
            { name: 'Failed', value: results.failed.length.toString(), inline: true },
            { name: 'Skipped', value: (results.alreadyHas.length + results.doesntHave.length).toString(), inline: true }
        )
        .setTimestamp();
    
    if (results.successful.length > 0) {
        const successList = results.successful.slice(0, 10).map(r => r.tag).join('\n');
        embed.addFields({
            name: `✅ Successfully ${action === 'add' ? 'Added' : 'Removed'} (${results.successful.length})`,
            value: successList + (results.successful.length > 10 ? `\n... and ${results.successful.length - 10} more` : ''),
            inline: false
        });
    }
    
    await interaction.editReply({ embeds: [embed] });
    
    // Log to mod log
    await logMassAction(interaction, `MASS_ROLE_${action.toUpperCase()}`, results, reason, role);
    
    logger.info(`${interaction.user.tag} performed mass role ${action} in ${interaction.guild.name}: ${results.successful.length} successful, ${results.failed.length} failed`);
}

function parseUserIds(userIdsString) {
    // Split by spaces, commas, or newlines and filter out invalid IDs
    return userIdsString
        .split(/[\s,\n]+/)
        .map(id => id.trim())
        .filter(id => /^\d{17,19}$/.test(id)); // Discord user ID format
}

async function logMassAction(interaction, action, results, reason, role = null) {
    try {
        const { db } = require('../../utils/database');
        
        const settings = await db.get(
            'SELECT mod_log_channel FROM guild_settings WHERE guild_id = ?',
            [interaction.guild.id]
        );
        
        if (!settings || !settings.mod_log_channel) return;
        
        const modLogChannel = interaction.guild.channels.cache.get(settings.mod_log_channel);
        if (!modLogChannel) return;
        
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`🔨 ${action.replace('_', ' ')}`)
            .addFields(
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Successful', value: results.successful.length.toString(), inline: true },
                { name: 'Failed', value: results.failed.length.toString(), inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setTimestamp();
        
        if (role) {
            embed.addFields({ name: 'Role', value: `${role.name} (${role.id})`, inline: true });
        }
        
        await modLogChannel.send({ embeds: [embed] });
        
    } catch (error) {
        logger.error('Error logging mass action:', error);
    }
}
