const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .setDMPermission(false),
    
    cooldown: 5,
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
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
                content: '❌ You cannot kick yourself.',
                ephemeral: true
            });
        }
        
        if (member.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ I cannot kick myself.',
                ephemeral: true
            });
        }
        
        // Check role hierarchy
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: '❌ You cannot kick someone with a higher or equal role.',
                ephemeral: true
            });
        }
        
        if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: '❌ I cannot kick someone with a higher or equal role than me.',
                ephemeral: true
            });
        }
        
        if (!member.kickable) {
            return interaction.reply({
                content: '❌ I cannot kick this member.',
                ephemeral: true
            });
        }
        
        try {
            // Send DM to user before kicking
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xff9900)
                    .setTitle('🦶 You have been kicked')
                    .setDescription(`You have been kicked from **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.tag }
                    )
                    .setTimestamp();
                
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                logger.warn(`Could not send DM to ${target.tag} about kick`);
            }
            
            // Kick the member
            await member.kick(reason);
            
            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ Member Kicked')
                .setDescription(`**${target.tag}** has been kicked from the server`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Moderator', value: interaction.user.tag }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await interaction.reply({ embeds: [successEmbed] });
            
            // Log to mod log channel if configured
            await logModAction(interaction, 'KICK', target, reason);
            
            logger.info(`${interaction.user.tag} kicked ${target.tag} from ${interaction.guild.name}. Reason: ${reason}`);
            
        } catch (error) {
            logger.error('Error kicking member:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to kick the member.',
                ephemeral: true
            });
        }
    },
};

async function logModAction(interaction, action, target, reason) {
    try {
        const { db } = require('../../utils/database');
        
        // Get mod log channel from guild settings
        const settings = await db.get(
            'SELECT mod_log_channel FROM guild_settings WHERE guild_id = ?',
            [interaction.guild.id]
        );
        
        if (!settings || !settings.mod_log_channel) return;
        
        const modLogChannel = interaction.guild.channels.cache.get(settings.mod_log_channel);
        if (!modLogChannel) return;
        
        const logEmbed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle(`🔨 ${action}`)
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await modLogChannel.send({ embeds: [logEmbed] });
        
    } catch (error) {
        logger.error('Error logging mod action:', error);
    }
}
