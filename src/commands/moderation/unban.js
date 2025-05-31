const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('User ID to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .setDMPermission(false),
    
    cooldown: 5,
    
    async execute(interaction) {
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Validate user ID format
        if (!/^\d{17,19}$/.test(userId)) {
            return interaction.reply({
                content: '❌ Invalid user ID format. Please provide a valid Discord user ID.',
                ephemeral: true
            });
        }
        
        try {
            // Check if user is actually banned
            const banList = await interaction.guild.bans.fetch();
            const bannedUser = banList.get(userId);
            
            if (!bannedUser) {
                return interaction.reply({
                    content: '❌ This user is not banned from the server.',
                    ephemeral: true
                });
            }
            
            // Get user info
            const user = bannedUser.user;
            
            // Unban the user
            await interaction.guild.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);
            
            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✅ User Unbanned')
                .setDescription(`**${user.tag}** has been unbanned from the server`)
                .addFields(
                    { name: 'User ID', value: userId, inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Original Ban Reason', value: bannedUser.reason || 'No reason provided', inline: false }
                )
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await interaction.reply({ embeds: [successEmbed] });
            
            // Send DM to unbanned user if possible
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('✅ You have been unbanned')
                    .setDescription(`You have been unbanned from **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reason', value: reason },
                        { name: 'Moderator', value: interaction.user.tag },
                        { name: 'Server Invite', value: 'You can now rejoin the server if you have an invite link.' }
                    )
                    .setTimestamp();
                
                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                logger.warn(`Could not send DM to ${user.tag} about unban`);
            }
            
            // Log to mod log channel if configured
            await logModAction(interaction, 'UNBAN', user, reason, bannedUser.reason);
            
            logger.info(`${interaction.user.tag} unbanned ${user.tag} (${userId}) from ${interaction.guild.name}. Reason: ${reason}`);
            
        } catch (error) {
            logger.error('Error unbanning user:', error);
            
            if (error.code === 10026) {
                await interaction.reply({
                    content: '❌ Unknown ban. This user may not be banned or the ban may have already been removed.',
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: '❌ An error occurred while trying to unban the user.',
                    ephemeral: true
                });
            }
        }
    },
};

async function logModAction(interaction, action, target, reason, originalReason) {
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
            .setColor(0x00ff00)
            .setTitle(`✅ ${action}`)
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Unban Reason', value: reason, inline: false }
            )
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        if (originalReason) {
            logEmbed.addFields({ name: 'Original Ban Reason', value: originalReason, inline: false });
        }
        
        await modLogChannel.send({ embeds: [logEmbed] });
        
    } catch (error) {
        logger.error('Error logging mod action:', error);
    }
}
