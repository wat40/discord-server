const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Get information about a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to get information about')
                .setRequired(false)),
    
    cooldown: 3,
    
    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const member = interaction.guild.members.cache.get(target.id);
        
        if (!member) {
            return interaction.reply({
                content: '❌ User not found in this server.',
                ephemeral: true
            });
        }
        
        try {
            // Get user level data
            const levelData = await db.get(
                'SELECT xp, level FROM user_levels WHERE user_id = ? AND guild_id = ?',
                [target.id, interaction.guild.id]
            );
            
            // Get warning count
            const warningData = await db.get(
                'SELECT COUNT(*) as count FROM warnings WHERE user_id = ? AND guild_id = ?',
                [target.id, interaction.guild.id]
            );
            
            // Calculate account age
            const accountCreated = Math.floor(target.createdTimestamp / 1000);
            const joinedServer = Math.floor(member.joinedTimestamp / 1000);
            
            // Get roles (excluding @everyone)
            const roles = member.roles.cache
                .filter(role => role.name !== '@everyone')
                .sort((a, b) => b.position - a.position)
                .map(role => role.toString())
                .slice(0, 10); // Limit to 10 roles to avoid embed limits
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor(member.displayHexColor || 0x0099ff)
                .setTitle(`👤 User Information`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    {
                        name: '📋 General Info',
                        value: [
                            `**Username:** ${target.tag}`,
                            `**Display Name:** ${member.displayName}`,
                            `**ID:** ${target.id}`,
                            `**Bot:** ${target.bot ? 'Yes' : 'No'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📅 Dates',
                        value: [
                            `**Account Created:** <t:${accountCreated}:F>`,
                            `**Joined Server:** <t:${joinedServer}:F>`,
                            `**Days in Server:** ${Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24))}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📊 Server Stats',
                        value: [
                            `**Level:** ${levelData?.level || 1}`,
                            `**XP:** ${levelData?.xp || 0}`,
                            `**Warnings:** ${warningData?.count || 0}`
                        ].join('\n'),
                        inline: true
                    }
                )
                .setTimestamp();
            
            // Add roles field if user has roles
            if (roles.length > 0) {
                embed.addFields({
                    name: `🎭 Roles (${member.roles.cache.size - 1})`,
                    value: roles.join(', ') + (member.roles.cache.size > 11 ? '...' : ''),
                    inline: false
                });
            }
            
            // Add permissions field for high-level roles
            const keyPermissions = [];
            if (member.permissions.has('Administrator')) keyPermissions.push('Administrator');
            if (member.permissions.has('ManageGuild')) keyPermissions.push('Manage Server');
            if (member.permissions.has('ManageChannels')) keyPermissions.push('Manage Channels');
            if (member.permissions.has('ManageRoles')) keyPermissions.push('Manage Roles');
            if (member.permissions.has('BanMembers')) keyPermissions.push('Ban Members');
            if (member.permissions.has('KickMembers')) keyPermissions.push('Kick Members');
            if (member.permissions.has('ModerateMembers')) keyPermissions.push('Moderate Members');
            
            if (keyPermissions.length > 0) {
                embed.addFields({
                    name: '🔑 Key Permissions',
                    value: keyPermissions.join(', '),
                    inline: false
                });
            }
            
            // Add status and activity if available
            const presence = member.presence;
            if (presence) {
                const statusEmojis = {
                    online: '🟢',
                    idle: '🟡',
                    dnd: '🔴',
                    offline: '⚫'
                };
                
                let statusText = `${statusEmojis[presence.status] || '⚫'} ${presence.status.charAt(0).toUpperCase() + presence.status.slice(1)}`;
                
                if (presence.activities.length > 0) {
                    const activity = presence.activities[0];
                    statusText += `\n**Activity:** ${activity.name}`;
                    if (activity.details) statusText += `\n**Details:** ${activity.details}`;
                }
                
                embed.addFields({
                    name: '💫 Status',
                    value: statusText,
                    inline: true
                });
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in userinfo command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching user information.',
                ephemeral: true
            });
        }
    },
};
