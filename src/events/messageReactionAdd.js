const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const { db } = require('../utils/database');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Ignore bot reactions
        if (user.bot) return;

        try {
            // Handle partial reactions (fetch if needed)
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    logger.error('Error fetching reaction:', error);
                    return;
                }
            }

            // Handle verification reactions
            await handleVerificationReaction(reaction, user);
            
            // Handle other reaction roles here if needed
            // await handleOtherReactionRoles(reaction, user);
            
        } catch (error) {
            logger.error('Error in messageReactionAdd event:', error);
        }
    },
};

/**
 * Handle verification reaction roles
 */
async function handleVerificationReaction(reaction, user) {
    try {
        const { message, emoji } = reaction;
        const { guild } = message;

        // Only handle ✅ reactions
        if (emoji.name !== '✅') return;

        // Check if this is a registered verification message
        const isVerificationMessage = await isRegisteredVerificationMessage(message);
        if (!isVerificationMessage) {
            // Fallback: check if it's in a verification channel
            const isVerificationChannel = await isVerificationChannelMessage(message);
            if (!isVerificationChannel) return;
        }

        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            logger.warn(`Could not fetch member ${user.id} in guild ${guild.id}`);
            return;
        }

        // Find the roles we need with more comprehensive search
        const newMemberRole = guild.roles.cache.find(role =>
            role.name.toLowerCase().includes('new member') ||
            role.name.includes('👶') ||
            role.name.toLowerCase().includes('unverified')
        );

        const verifiedRole = guild.roles.cache.find(role =>
            role.name.toLowerCase().includes('verified member') ||
            role.name.includes('✅') ||
            role.name.toLowerCase().includes('verified')
        );

        if (!verifiedRole) {
            logger.warn(`No verified member role found in guild ${guild.id} (${guild.name})`);

            // Try to send helpful message to user
            try {
                await user.send(`❌ **Verification Error in ${guild.name}**\n\nThe server doesn't have a "Verified Member" role set up. Please contact a staff member to complete your verification manually.`);
            } catch (dmError) {
                logger.warn(`Could not send verification error DM to ${user.tag}`);
            }
            return;
        }

        // Check if user already has verified role
        if (member.roles.cache.has(verifiedRole.id)) {
            logger.info(`User ${user.tag} already has verified role in ${guild.name}`);
            return;
        }

        // Perform role assignment with comprehensive error handling
        try {
            // Add verified role
            await member.roles.add(verifiedRole, 'User verified through reaction role system');
            logger.info(`✅ Added verified role to ${user.tag} in ${guild.name}`);

            // Remove new member role if they have it
            if (newMemberRole && member.roles.cache.has(newMemberRole.id)) {
                try {
                    await member.roles.remove(newMemberRole, 'User verified - removing new member role');
                    logger.info(`🔄 Removed new member role from ${user.tag} in ${guild.name}`);
                } catch (removeError) {
                    logger.warn(`Could not remove new member role from ${user.tag}: ${removeError.message}`);
                    // Don't fail verification if we can't remove the old role
                }
            }

            // Log verification to database
            try {
                await logVerification(user.id, guild.id, verifiedRole.id);
            } catch (logError) {
                logger.warn(`Could not log verification for ${user.tag}: ${logError.message}`);
                // Don't fail verification if logging fails
            }

            // Send welcome DM
            try {
                await sendVerificationWelcome(member, guild);
            } catch (dmError) {
                logger.warn(`Could not send welcome DM to ${user.tag}: ${dmError.message}`);
                // Don't fail verification if DM fails
            }

        } catch (error) {
            logger.error(`❌ Error assigning verified role to ${user.tag} in ${guild.name}:`, error);

            // Try to send error message to user with specific error info
            try {
                let errorMessage = `❌ **Verification Error in ${guild.name}**\n\n`;

                if (error.code === 50013) {
                    errorMessage += `The bot doesn't have permission to assign roles. Please contact a staff member to:\n• Give the bot "Manage Roles" permission\n• Move the bot's role above the "Verified Member" role\n• Complete your verification manually`;
                } else if (error.code === 50001) {
                    errorMessage += `The bot doesn't have access to assign this role. Please contact a staff member to complete your verification manually.`;
                } else {
                    errorMessage += `An unexpected error occurred during verification. Please contact a staff member for assistance.\n\nError: ${error.message}`;
                }

                await user.send(errorMessage);
            } catch (dmError) {
                logger.warn(`Could not send error DM to ${user.tag}: ${dmError.message}`);
            }
        }

    } catch (error) {
        logger.error('❌ Critical error in handleVerificationReaction:', error);
    }
}

/**
 * Check if a message is registered as a verification message in the database
 */
async function isRegisteredVerificationMessage(message) {
    try {
        const reactionRole = await db.get(
            'SELECT * FROM reaction_roles WHERE message_id = ? AND emoji = ?',
            [message.id, '✅']
        );

        return !!reactionRole;
    } catch (error) {
        logger.warn('Error checking registered verification message:', error);
        return false;
    }
}

/**
 * Check if a message is in a verification channel (fallback method)
 */
async function isVerificationChannelMessage(message) {
    try {
        const { channel } = message;

        // Check if channel name contains verification keywords
        const verificationKeywords = ['verification', 'verify', 'welcome', '🚪'];
        const channelName = channel.name.toLowerCase();

        if (verificationKeywords.some(keyword => channelName.includes(keyword))) {
            // Additional check: see if the message contains verification content
            const messageContent = message.content.toLowerCase();
            if (messageContent.includes('verify') ||
                messageContent.includes('react') ||
                messageContent.includes('✅') ||
                messageContent.includes('welcome to')) {
                return true;
            }
        }

        return false;
    } catch (error) {
        logger.error('Error checking verification channel:', error);
        return false;
    }
}

/**
 * Log verification to database
 */
async function logVerification(userId, guildId, roleId) {
    try {
        await db.run(
            `INSERT INTO verification_logs (user_id, guild_id, role_id, verified_at) 
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [userId, guildId, roleId]
        );
    } catch (error) {
        // Don't fail verification if logging fails
        logger.warn('Error logging verification:', error);
    }
}

/**
 * Send welcome DM to newly verified member
 */
async function sendVerificationWelcome(member, guild) {
    try {
        const welcomeMessage = `🎉 **Welcome to ${guild.name}!**

You've been successfully verified and now have access to all public channels.

🚀 **Next Steps:**
• Introduce yourself in the introductions channel
• Check out the server guide for navigation help
• Join the conversation in general chat
• Use \`/help\` to see available bot commands

If you need any help, feel free to ask in the general chat or create a support ticket!

Welcome to the community! 🎊`;

        await member.send(welcomeMessage);
        logger.info(`Sent welcome DM to ${member.user.tag} in ${guild.name}`);
    } catch (error) {
        // Don't fail verification if DM fails
        logger.warn(`Could not send welcome DM to ${member.user.tag}:`, error);
    }
}
