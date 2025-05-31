const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../utils/database');
const { logger } = require('../../utils/logger');
const { sendErrorMessage, replyToInteraction } = require('../../utils/interactions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder')
        .addSubcommand(subcommand =>
            subcommand
                .setName('me')
                .setDescription('Set a personal reminder')
                .addStringOption(option =>
                    option.setName('time')
                        .setDescription('When to remind you (e.g., 1h, 30m, 2d)')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('What to remind you about')
                        .setRequired(true)
                        .setMaxLength(500)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List your active reminders'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a reminder')
                .addIntegerOption(option =>
                    option.setName('id')
                        .setDescription('Reminder ID to delete')
                        .setRequired(true)
                        .setMinValue(1)))
        .setDMPermission(true),
    
    cooldown: 5,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            switch (subcommand) {
                case 'me':
                    await handleSetReminder(interaction);
                    break;
                case 'list':
                    await handleListReminders(interaction);
                    break;
                case 'delete':
                    await handleDeleteReminder(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Error in remind command:', error);
            await sendErrorMessage(interaction, 'An error occurred while processing your reminder.');
        }
    },
};

async function handleSetReminder(interaction) {
    const timeString = interaction.options.getString('time');
    const message = interaction.options.getString('message');
    
    // Parse the time
    const duration = parseTimeString(timeString);
    if (!duration) {
        return await sendErrorMessage(interaction, 'Invalid time format. Use formats like: 1h, 30m, 2d, 1w');
    }
    
    // Check if duration is reasonable (max 1 year)
    const maxDuration = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    if (duration > maxDuration) {
        return await sendErrorMessage(interaction, 'Reminder duration cannot exceed 1 year.');
    }
    
    // Check minimum duration (1 minute)
    if (duration < 60000) {
        return await sendErrorMessage(interaction, 'Reminder duration must be at least 1 minute.');
    }
    
    const remindAt = new Date(Date.now() + duration);
    
    try {
        // Check user's reminder count (limit to 10 per user)
        const existingCount = await db.get(
            'SELECT COUNT(*) as count FROM reminders WHERE user_id = ?',
            [interaction.user.id]
        );
        
        if (existingCount.count >= 10) {
            return await sendErrorMessage(interaction, 'You can only have up to 10 active reminders. Delete some old ones first.');
        }
        
        // Save reminder to database
        const result = await db.run(
            `INSERT INTO reminders (user_id, channel_id, guild_id, message, remind_at) 
             VALUES (?, ?, ?, ?, ?)`,
            [
                interaction.user.id,
                interaction.channel.id,
                interaction.guild?.id || null,
                message,
                remindAt.toISOString()
            ]
        );
        
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('⏰ Reminder Set')
            .setDescription(`I'll remind you about: **${message}**`)
            .addFields(
                { name: 'Reminder Time', value: `<t:${Math.floor(remindAt.getTime() / 1000)}:F>`, inline: true },
                { name: 'In', value: formatDuration(duration), inline: true },
                { name: 'Reminder ID', value: result.id.toString(), inline: true }
            )
            .setFooter({ text: 'Use /remind list to see all your reminders' })
            .setTimestamp();
        
        await replyToInteraction(interaction, { embeds: [embed] });
        
        logger.info(`${interaction.user.tag} set reminder #${result.id} for ${remindAt.toISOString()}`);
        
    } catch (error) {
        logger.error('Error saving reminder:', error);
        await sendErrorMessage(interaction, 'Failed to save your reminder. Please try again.');
    }
}

async function handleListReminders(interaction) {
    try {
        const reminders = await db.all(
            'SELECT * FROM reminders WHERE user_id = ? ORDER BY remind_at ASC',
            [interaction.user.id]
        );
        
        if (reminders.length === 0) {
            return await replyToInteraction(interaction, {
                content: '📝 You have no active reminders.',
                ephemeral: true
            });
        }
        
        const reminderList = reminders.map(reminder => {
            const remindTime = new Date(reminder.remind_at);
            const timeLeft = remindTime.getTime() - Date.now();
            const status = timeLeft > 0 ? '🟢 Active' : '🔴 Overdue';
            
            return `**${reminder.id}.** ${reminder.message}\n` +
                   `${status} • <t:${Math.floor(remindTime.getTime() / 1000)}:R>`;
        }).join('\n\n');
        
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('⏰ Your Reminders')
            .setDescription(reminderList)
            .setFooter({ text: 'Use /remind delete <id> to remove a reminder' })
            .setTimestamp();
        
        await replyToInteraction(interaction, { embeds: [embed], ephemeral: true });
        
    } catch (error) {
        logger.error('Error listing reminders:', error);
        await sendErrorMessage(interaction, 'Failed to retrieve your reminders.');
    }
}

async function handleDeleteReminder(interaction) {
    const reminderId = interaction.options.getInteger('id');
    
    try {
        // Check if reminder exists and belongs to user
        const reminder = await db.get(
            'SELECT * FROM reminders WHERE id = ? AND user_id = ?',
            [reminderId, interaction.user.id]
        );
        
        if (!reminder) {
            return await sendErrorMessage(interaction, 'Reminder not found or you don\'t have permission to delete it.');
        }
        
        // Delete the reminder
        await db.run('DELETE FROM reminders WHERE id = ?', [reminderId]);
        
        const embed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle('🗑️ Reminder Deleted')
            .setDescription(`Deleted reminder: **${reminder.message}**`)
            .addFields({
                name: 'Was scheduled for',
                value: `<t:${Math.floor(new Date(reminder.remind_at).getTime() / 1000)}:F>`,
                inline: true
            })
            .setTimestamp();
        
        await replyToInteraction(interaction, { embeds: [embed], ephemeral: true });
        
        logger.info(`${interaction.user.tag} deleted reminder #${reminderId}`);
        
    } catch (error) {
        logger.error('Error deleting reminder:', error);
        await sendErrorMessage(interaction, 'Failed to delete the reminder.');
    }
}

function parseTimeString(timeStr) {
    const regex = /^(\d+)([smhdw])$/i;
    const match = timeStr.toLowerCase().match(regex);
    
    if (!match) return null;
    
    const amount = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        's': 1000,                    // seconds
        'm': 60 * 1000,              // minutes
        'h': 60 * 60 * 1000,         // hours
        'd': 24 * 60 * 60 * 1000,    // days
        'w': 7 * 24 * 60 * 60 * 1000 // weeks
    };
    
    return amount * multipliers[unit];
}

function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    
    if (weeks > 0) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}
