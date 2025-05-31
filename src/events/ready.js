const { Events, ActivityType } = require('discord.js');
const { logger } = require('../utils/logger');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logger.success(`ModuBot is ready! Logged in as ${client.user.tag}`);
        logger.info(`Serving ${client.guilds.cache.size} servers with ${client.users.cache.size} users`);
        
        // Set bot activity status
        const activities = [
            { name: 'your community', type: ActivityType.Watching },
            { name: 'support tickets', type: ActivityType.Listening },
            { name: 'server moderation', type: ActivityType.Playing },
            { name: '/help for commands', type: ActivityType.Playing }
        ];
        
        let activityIndex = 0;
        
        // Set initial activity
        client.user.setActivity(activities[activityIndex].name, { 
            type: activities[activityIndex].type 
        });
        
        // Rotate activities every 30 seconds
        setInterval(() => {
            activityIndex = (activityIndex + 1) % activities.length;
            client.user.setActivity(activities[activityIndex].name, { 
                type: activities[activityIndex].type 
            });
        }, 30000);
        
        // Log guild information
        client.guilds.cache.forEach(guild => {
            logger.info(`Connected to guild: ${guild.name} (${guild.id}) - ${guild.memberCount} members`);
        });
    },
};
