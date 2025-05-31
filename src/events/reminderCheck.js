const { EmbedBuilder } = require('discord.js');
const { db } = require('../utils/database');
const { logger } = require('../utils/logger');

/**
 * Reminder system that checks for due reminders every minute
 */
class ReminderSystem {
    constructor(client) {
        this.client = client;
        this.interval = null;
        this.isRunning = false;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        logger.info('Reminder system started');
        
        // Check immediately, then every minute
        this.checkReminders();
        this.interval = setInterval(() => {
            this.checkReminders();
        }, 60000); // Check every minute
    }
    
    stop() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        logger.info('Reminder system stopped');
    }
    
    async checkReminders() {
        try {
            // Get all due reminders
            const dueReminders = await db.all(
                'SELECT * FROM reminders WHERE remind_at <= datetime("now") ORDER BY remind_at ASC'
            );
            
            if (dueReminders.length === 0) return;
            
            logger.info(`Processing ${dueReminders.length} due reminder(s)`);
            
            for (const reminder of dueReminders) {
                await this.sendReminder(reminder);
                
                // Delete the reminder after sending
                await db.run('DELETE FROM reminders WHERE id = ?', [reminder.id]);
            }
            
        } catch (error) {
            logger.error('Error checking reminders:', error);
        }
    }
    
    async sendReminder(reminder) {
        try {
            // Try to get the user
            const user = await this.client.users.fetch(reminder.user_id).catch(() => null);
            if (!user) {
                logger.warn(`Could not find user ${reminder.user_id} for reminder ${reminder.id}`);
                return;
            }
            
            // Create reminder embed
            const embed = new EmbedBuilder()
                .setColor(0xffaa00)
                .setTitle('⏰ Reminder')
                .setDescription(`**${reminder.message}**`)
                .addFields(
                    { 
                        name: 'Set on', 
                        value: `<t:${Math.floor(new Date(reminder.created_at).getTime() / 1000)}:F>`, 
                        inline: true 
                    },
                    { 
                        name: 'Reminder ID', 
                        value: reminder.id.toString(), 
                        inline: true 
                    }
                )
                .setFooter({ text: 'This reminder has been automatically deleted' })
                .setTimestamp();
            
            // Try to send in the original channel first
            let sent = false;
            
            if (reminder.channel_id) {
                try {
                    const channel = await this.client.channels.fetch(reminder.channel_id).catch(() => null);
                    if (channel) {
                        await channel.send({
                            content: `${user}, here's your reminder:`,
                            embeds: [embed]
                        });
                        sent = true;
                        logger.info(`Sent reminder ${reminder.id} to channel ${channel.name}`);
                    }
                } catch (error) {
                    logger.warn(`Could not send reminder ${reminder.id} to channel ${reminder.channel_id}:`, error.message);
                }
            }
            
            // If channel send failed, try DM
            if (!sent) {
                try {
                    await user.send({ embeds: [embed] });
                    logger.info(`Sent reminder ${reminder.id} via DM to ${user.tag}`);
                } catch (error) {
                    logger.warn(`Could not send reminder ${reminder.id} via DM to ${user.tag}:`, error.message);
                }
            }
            
        } catch (error) {
            logger.error(`Error sending reminder ${reminder.id}:`, error);
        }
    }
}

module.exports = { ReminderSystem };
