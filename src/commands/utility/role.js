const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage user roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for adding the role')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to remove')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for removing the role')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get information about a role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to get information about')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all roles in the server')
                .addBooleanOption(option =>
                    option.setName('show_permissions')
                        .setDescription('Show role permissions')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('members')
                .setDescription('List members with a specific role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to list members for')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .setDMPermission(false),
    
    cooldown: 3,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            switch (subcommand) {
                case 'add':
                    await handleAddRole(interaction);
                    break;
                case 'remove':
                    await handleRemoveRole(interaction);
                    break;
                case 'info':
                    await handleRoleInfo(interaction);
                    break;
                case 'list':
                    await handleListRoles(interaction);
                    break;
                case 'members':
                    await handleRoleMembers(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Error in role command:', error);
            
            const errorMessage = {
                content: '❌ An error occurred while processing the role command.',
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

async function handleAddRole(interaction) {
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    
    if (!member) {
        return interaction.reply({
            content: '❌ User not found in this server.',
            ephemeral: true
        });
    }
    
    // Check if user already has the role
    if (member.roles.cache.has(role.id)) {
        return interaction.reply({
            content: `❌ ${user.tag} already has the ${role.name} role.`,
            ephemeral: true
        });
    }
    
    // Check role hierarchy
    if (role.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
            content: '❌ You cannot assign a role that is higher than or equal to your highest role.',
            ephemeral: true
        });
    }
    
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
            content: '❌ I cannot assign a role that is higher than or equal to my highest role.',
            ephemeral: true
        });
    }
    
    // Check if role is manageable
    if (!role.editable) {
        return interaction.reply({
            content: '❌ I cannot manage this role.',
            ephemeral: true
        });
    }
    
    try {
        await member.roles.add(role, `${reason} | Added by ${interaction.user.tag}`);
        
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('✅ Role Added')
            .setDescription(`Successfully added the **${role.name}** role to ${user}`)
            .addFields(
                { name: 'User', value: user.tag, inline: true },
                { name: 'Role', value: role.name, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
        // Log action
        await logRoleAction(interaction, 'ROLE_ADDED', user, role, reason);
        
        logger.info(`${interaction.user.tag} added role ${role.name} to ${user.tag} in ${interaction.guild.name}`);
        
    } catch (error) {
        logger.error('Error adding role:', error);
        await interaction.reply({
            content: '❌ Failed to add the role. Please check my permissions.',
            ephemeral: true
        });
    }
}

async function handleRemoveRole(interaction) {
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = interaction.guild.members.cache.get(user.id);
    
    if (!member) {
        return interaction.reply({
            content: '❌ User not found in this server.',
            ephemeral: true
        });
    }
    
    // Check if user has the role
    if (!member.roles.cache.has(role.id)) {
        return interaction.reply({
            content: `❌ ${user.tag} doesn't have the ${role.name} role.`,
            ephemeral: true
        });
    }
    
    // Check role hierarchy
    if (role.position >= interaction.member.roles.highest.position) {
        return interaction.reply({
            content: '❌ You cannot remove a role that is higher than or equal to your highest role.',
            ephemeral: true
        });
    }
    
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
            content: '❌ I cannot remove a role that is higher than or equal to my highest role.',
            ephemeral: true
        });
    }
    
    try {
        await member.roles.remove(role, `${reason} | Removed by ${interaction.user.tag}`);
        
        const embed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle('🗑️ Role Removed')
            .setDescription(`Successfully removed the **${role.name}** role from ${user}`)
            .addFields(
                { name: 'User', value: user.tag, inline: true },
                { name: 'Role', value: role.name, inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
        
        // Log action
        await logRoleAction(interaction, 'ROLE_REMOVED', user, role, reason);
        
        logger.info(`${interaction.user.tag} removed role ${role.name} from ${user.tag} in ${interaction.guild.name}`);
        
    } catch (error) {
        logger.error('Error removing role:', error);
        await interaction.reply({
            content: '❌ Failed to remove the role. Please check my permissions.',
            ephemeral: true
        });
    }
}

async function handleRoleInfo(interaction) {
    const role = interaction.options.getRole('role');
    
    // Get role permissions
    const permissions = role.permissions.toArray();
    const permissionList = permissions.length > 0 
        ? permissions.slice(0, 10).map(perm => `• ${formatPermission(perm)}`).join('\n') + 
          (permissions.length > 10 ? `\n... and ${permissions.length - 10} more` : '')
        : 'No special permissions';
    
    // Get member count
    const memberCount = role.members.size;
    
    const embed = new EmbedBuilder()
        .setColor(role.hexColor || 0x0099ff)
        .setTitle(`🎭 Role Information: ${role.name}`)
        .addFields(
            { name: 'Role ID', value: role.id, inline: true },
            { name: 'Color', value: role.hexColor || 'Default', inline: true },
            { name: 'Position', value: role.position.toString(), inline: true },
            { name: 'Members', value: memberCount.toString(), inline: true },
            { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
            { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
            { name: 'Created', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:F>`, inline: false },
            { name: 'Permissions', value: permissionList, inline: false }
        )
        .setTimestamp();
    
    if (role.icon) {
        embed.setThumbnail(role.iconURL());
    }
    
    await interaction.reply({ embeds: [embed] });
}

async function handleListRoles(interaction) {
    const showPermissions = interaction.options.getBoolean('show_permissions') || false;
    
    const roles = interaction.guild.roles.cache
        .filter(role => role.id !== interaction.guild.id) // Exclude @everyone
        .sort((a, b) => b.position - a.position)
        .first(20); // Limit to 20 roles
    
    if (roles.length === 0) {
        return interaction.reply({
            content: '❌ No roles found in this server.',
            ephemeral: true
        });
    }
    
    const roleList = roles.map(role => {
        let roleInfo = `**${role.name}** (${role.members.size} members)`;
        if (showPermissions) {
            const keyPerms = role.permissions.toArray().slice(0, 3);
            if (keyPerms.length > 0) {
                roleInfo += `\n*${keyPerms.map(formatPermission).join(', ')}*`;
            }
        }
        return roleInfo;
    }).join('\n\n');
    
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`🎭 Server Roles (${interaction.guild.roles.cache.size - 1})`)
        .setDescription(roleList)
        .setFooter({ text: 'Showing top 20 roles by position' })
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}

async function handleRoleMembers(interaction) {
    const role = interaction.options.getRole('role');
    const members = role.members;
    
    if (members.size === 0) {
        return interaction.reply({
            content: `❌ No members have the **${role.name}** role.`,
            ephemeral: true
        });
    }
    
    const memberList = members
        .first(20)
        .map(member => `• ${member.user.tag}`)
        .join('\n');
    
    const embed = new EmbedBuilder()
        .setColor(role.hexColor || 0x0099ff)
        .setTitle(`👥 Members with ${role.name} (${members.size})`)
        .setDescription(memberList + (members.size > 20 ? `\n... and ${members.size - 20} more` : ''))
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}

function formatPermission(permission) {
    return permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}

async function logRoleAction(interaction, action, user, role, reason) {
    try {
        const { db } = require('../../utils/database');
        
        const settings = await db.get(
            'SELECT mod_log_channel FROM guild_settings WHERE guild_id = ?',
            [interaction.guild.id]
        );
        
        if (!settings || !settings.mod_log_channel) return;
        
        const modLogChannel = interaction.guild.channels.cache.get(settings.mod_log_channel);
        if (!modLogChannel) return;
        
        const color = action === 'ROLE_ADDED' ? 0x00ff00 : 0xff9900;
        const emoji = action === 'ROLE_ADDED' ? '✅' : '🗑️';
        
        const logEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} ${action.replace('_', ' ')}`)
            .addFields(
                { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
                { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await modLogChannel.send({ embeds: [logEmbed] });
        
    } catch (error) {
        logger.error('Error logging role action:', error);
    }
}
