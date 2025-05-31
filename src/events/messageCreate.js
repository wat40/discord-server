const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const { db } = require('../utils/database');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages and DMs
        if (message.author.bot || !message.guild) return;

        try {
            // XP System - Award XP for messages
            await handleXPSystem(message);
            
            // Auto-moderation features could be added here
            // await handleAutoModeration(message);
            
        } catch (error) {
            logger.error('Error in messageCreate event:', error);
        }
    },
};

async function handleXPSystem(message) {
    try {
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        // Check if XP is enabled for this guild
        const guildSettings = await db.get(
            'SELECT xp_enabled FROM guild_settings WHERE guild_id = ?',
            [guildId]
        );
        
        if (guildSettings && !guildSettings.xp_enabled) return;
        
        // Get user's current XP data
        const userData = await db.get(
            'SELECT * FROM user_levels WHERE user_id = ? AND guild_id = ?',
            [userId, guildId]
        );
        
        const now = new Date();
        const xpCooldown = parseInt(process.env.XP_COOLDOWN) || 60000; // 1 minute default
        const xpPerMessage = parseInt(process.env.XP_PER_MESSAGE) || 5;
        
        // Check cooldown
        if (userData && userData.last_message) {
            const lastMessage = new Date(userData.last_message);
            if (now - lastMessage < xpCooldown) return;
        }
        
        // Calculate new XP and level
        const currentXP = userData ? userData.xp : 0;
        const currentLevel = userData ? userData.level : 1;
        const newXP = currentXP + xpPerMessage;
        const newLevel = Math.floor(0.1 * Math.sqrt(newXP)) + 1;
        
        // Update or insert user data
        if (userData) {
            await db.run(
                'UPDATE user_levels SET xp = ?, level = ?, last_message = ? WHERE user_id = ? AND guild_id = ?',
                [newXP, newLevel, now.toISOString(), userId, guildId]
            );
        } else {
            await db.run(
                'INSERT INTO user_levels (user_id, guild_id, xp, level, last_message) VALUES (?, ?, ?, ?, ?)',
                [userId, guildId, newXP, newLevel, now.toISOString()]
            );
        }
        
        // Check for level up
        if (newLevel > currentLevel) {
            const levelUpEmbed = {
                color: 0x00ff00,
                title: '🎉 Level Up!',
                description: `${message.author} has reached level **${newLevel}**!`,
                thumbnail: {
                    url: message.author.displayAvatarURL({ dynamic: true })
                },
                timestamp: new Date().toISOString()
            };
            
            // Send level up message in the same channel
            await message.channel.send({ embeds: [levelUpEmbed] });
            
            logger.info(`${message.author.tag} leveled up to ${newLevel} in ${message.guild.name}`);
        }
        
    } catch (error) {
        logger.error('Error handling XP system:', error);
    }
}

// Future auto-moderation function
async function handleAutoModeration(message) {
    // This could include:
    // - Spam detection
    // - Link filtering
    // - Profanity filter
    // - Caps lock detection
    // etc.
}
