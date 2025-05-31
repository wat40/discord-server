const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Timeout duration')
                .setRequired(true)
                .addChoices(
                    { name: '1 minute', value: '1m' },
                    { name: '5 minutes', value: '5m' },
                    { name: '10 minutes', value: '10m' },
                    { name: '30 minutes', value: '30m' },
                    { name: '1 hour', value: '1h' },
                    { name: '6 hours', value: '6h' },
                    { name: '12 hours', value: '12h' },
                    { name: '1 day', value: '1d' },
                    { name: '1 week', value: '1w' }
                ))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    
    cooldown: 3,
    
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const duration = interaction.options.getString('duration');
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
                content: '❌ You cannot timeout yourself.',
                ephemeral: true
            });
        }
        
        if (member.id === interaction.client.user.id) {
            return interaction.reply({
                content: '❌ I cannot timeout myself.',
                ephemeral: true
            });
        }
        
        // Check role hierarchy
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: '❌ You cannot timeout someone with a higher or equal role.',
                ephemeral: true
            });
        }
        
        if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: '❌ I cannot timeout someone with a higher or equal role than me.',
                ephemeral: true
            });
        }
        
        if (!member.moderatable) {
            return interaction.reply({
                content: '❌ I cannot timeout this member.',
                ephemeral: true
            });
        }
        
        // Check if member is already timed out
        if (member.communicationDisabledUntil && member.communicationDisabledUntil > new Date()) {
            return interaction.reply({
                content: '❌ This member is already timed out.',
                ephemeral: true
            });
        }
        
        try {
            // Parse duration
            const timeoutDuration = parseDuration(duration);
            if (!timeoutDuration) {
                return interaction.reply({
                    content: '❌ Invalid duration format.',
                    ephemeral: true
                });
            }
            
            // Send DM to user before timeout
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(0xffaa00)
                    .setTitle('⏰ You have been timed out')
                    .setDescription(`You have been timed out in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Duration', value: formatDuration(duration), inline: true },
                        { name: 'Reason', value: reason, inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Expires', value: `<t:${Math.floor((Date.now() + timeoutDuration) / 1000)}:F>`, inline: false }
                    )
                    .setTimestamp();
                
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                logger.warn(`Could not send DM to ${target.tag} about timeout`);
            }
            
            // Apply timeout
            await member.timeout(timeoutDuration, reason);
            
            // Create success embed
            const successEmbed = new EmbedBuilder()
                .setColor(0xffaa00)
                .setTitle('⏰ Member Timed Out')
                .setDescription(`**${target.tag}** has been timed out`)
                .addFields(
                    { name: 'Duration', value: formatDuration(duration), inline: true },
                    { name: 'Reason', value: reason, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Expires', value: `<t:${Math.floor((Date.now() + timeoutDuration) / 1000)}:F>`, inline: false }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            await interaction.reply({ embeds: [successEmbed] });
            
            // Log to mod log channel if configured
            await logModAction(interaction, 'TIMEOUT', target, reason, formatDuration(duration));
            
            logger.info(`${interaction.user.tag} timed out ${target.tag} for ${duration} in ${interaction.guild.name}. Reason: ${reason}`);
            
        } catch (error) {
            logger.error('Error timing out member:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to timeout the member.',
                ephemeral: true
            });
        }
    },
};

function parseDuration(duration) {
    const timeMap = {
        'm': 60 * 1000,           // minutes
        'h': 60 * 60 * 1000,      // hours
        'd': 24 * 60 * 60 * 1000, // days
        'w': 7 * 24 * 60 * 60 * 1000 // weeks
    };
    
    const match = duration.match(/^(\d+)([mhdw])$/);
    if (!match) return null;
    
    const [, amount, unit] = match;
    const milliseconds = parseInt(amount) * timeMap[unit];
    
    // Discord timeout limit is 28 days
    const maxTimeout = 28 * 24 * 60 * 60 * 1000;
    return Math.min(milliseconds, maxTimeout);
}

function formatDuration(duration) {
    const durationMap = {
        '1m': '1 minute',
        '5m': '5 minutes',
        '10m': '10 minutes',
        '30m': '30 minutes',
        '1h': '1 hour',
        '6h': '6 hours',
        '12h': '12 hours',
        '1d': '1 day',
        '1w': '1 week'
    };
    
    return durationMap[duration] || duration;
}

async function logModAction(interaction, action, target, reason, duration) {
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
            .setColor(0xffaa00)
            .setTitle(`⏰ ${action}`)
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                { name: 'Duration', value: duration, inline: true },
                { name: 'Reason', value: reason, inline: false }
            )
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await modLogChannel.send({ embeds: [logEmbed] });
        
    } catch (error) {
        logger.error('Error logging mod action:', error);
    }
}
