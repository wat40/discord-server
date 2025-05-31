const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logger } = require('../../utils/logger');
const { db } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    
    cooldown: 3,
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason');
        const member = interaction.guild.members.cache.get(target.id);
        
        // Validation checks
        if (!member) {
            return interaction.reply({
                content: '❌ User not found in this server.',
                ephemeral: true
            });
        }
        
        if (member.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot warn yourself.',
                ephemeral: true
            });
        }
        
        if (member.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ You cannot warn me.',
                ephemeral: true
            });
        }
        
        // Check role hierarchy
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: '❌ You cannot warn someone with a higher or equal role.',
                ephemeral: true
            });
        }
        
        try {
            // Add warning to database
            await db.run(
                'INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)',
                [target.id, interaction.guild.id, interaction.user.id, reason]
            );
            
            // Get total warning count
            const warningCount = await db.get(
                'SELECT COUNT(*) as count FROM warnings WHERE user_id = ? AND guild_id = ?',
                [target.id, interaction.guild.id]
            );
            
            const totalWarnings = warningCount.count;
            
            // Get max warnings from guild settings
            const guildSettings = await db.get(
                'SELECT max_warnings FROM guild_settings WHERE guild_id = ?',
                [interaction.guild.id]
            );
            
            const maxWarnings = guildSettings?.max_warnings || 3;
            
            // Send DM to user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xffff00)
                    .setTitle('⚠️ You have been warned')
                    .setDescription(`You have been warned in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.tag },
                        { name: 'Total Warnings', value: `${totalWarnings}/${maxWarnings}` }
                    )
                    .setTimestamp();
                
                if (totalWarnings >= maxWarnings) {
                    dmEmbed.addFields({
                        name: '🚨 Warning Limit Reached',
                        value: 'You have reached the maximum number of warnings and may face additional consequences.'
                    });
                }
                
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                logger.warn(`Could not send DM to ${target.tag} about warning`);
            }
            
            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0xffff00)
                .setTitle('⚠️ Member Warned')
                .setDescription(`**${target.tag}** has been warned`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: interaction.user.tag },
                    { name: 'Total Warnings', value: `${totalWarnings}/${maxWarnings}` }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            // Check if user has reached warning limit
            if (totalWarnings >= maxWarnings) {
                successEmbed.addFields({
                    name: '🚨 Warning Limit Reached',
                    value: `${target.tag} has reached the maximum number of warnings (${maxWarnings}). Consider taking further action.`
                });
                successEmbed.setColor(0xff0000);
            }
            
            await interaction.reply({ embeds: [successEmbed] });
            
            // Log to mod log channel
            await logModAction(interaction, 'WARN', target, reason, totalWarnings, maxWarnings);
            
            logger.info(`${interaction.user.tag} warned ${target.tag} in ${interaction.guild.name}. Reason: ${reason} (${totalWarnings}/${maxWarnings})`);
            
        } catch (error) {
            logger.error('Error warning member:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to warn the member.',
                ephemeral: true
            });
        }
    },
};

async function logModAction(interaction, action, target, reason, totalWarnings, maxWarnings) {
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
            .setColor(totalWarnings >= maxWarnings ? 0xff0000 : 0xffff00)
            .setTitle(`⚠️ ${action}`)
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Total Warnings', value: `${totalWarnings}/${maxWarnings}`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        if (totalWarnings >= maxWarnings) {
            logEmbed.addFields({
                name: '🚨 Action Required',
                value: 'User has reached the warning limit!'
            });
        }
        
        await modLogChannel.send({ embeds: [logEmbed] });
        
    } catch (error) {
        logger.error('Error logging mod action:', error);
    }
}
