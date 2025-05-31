const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { logger } = require('../utils/logger');
const { db } = require('../utils/database');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            const { guild, user } = member;
            
            // Skip if user is a bot
            if (user.bot) return;
            
            logger.info(`New member joined: ${user.tag} in ${guild.name}`);
            
            // Get guild settings for welcome configuration
            const settings = await db.get('SELECT * FROM guild_settings WHERE guild_id = ?', [guild.id]);
            
            // Auto-assign New Member role if it exists
            await assignNewMemberRole(member);
            
            // Send welcome message if welcome channel is configured
            if (settings && settings.welcome_channel_id) {
                await sendWelcomeMessage(member, settings.welcome_channel_id);
            }
            
            // Log member join for analytics
            await logMemberJoin(member);
            
        } catch (error) {
            logger.error('Error in guildMemberAdd event:', error);
        }
    },
};

/**
 * Assign New Member role to new joiners
 */
async function assignNewMemberRole(member) {
    try {
        const { guild } = member;
        
        // Find the New Member role
        const newMemberRole = guild.roles.cache.find(role => 
            role.name.toLowerCase().includes('new member') || 
            role.name.includes('👶') ||
            role.name.toLowerCase().includes('unverified')
        );
        
        if (newMemberRole) {
            await member.roles.add(newMemberRole, 'Auto-assigned to new member');
            logger.info(`✅ Assigned New Member role to ${member.user.tag} in ${guild.name}`);
        } else {
            logger.info(`No New Member role found in ${guild.name}`);
        }
        
    } catch (error) {
        logger.warn(`Could not assign New Member role to ${member.user.tag}:`, error);
    }
}

/**
 * Send welcome message with user avatar and server info
 */
async function sendWelcomeMessage(member, welcomeChannelId) {
    try {
        const { guild, user } = member;
        const welcomeChannel = guild.channels.cache.get(welcomeChannelId);
        
        if (!welcomeChannel) {
            logger.warn(`Welcome channel ${welcomeChannelId} not found in ${guild.name}`);
            return;
        }
        
        // Find important channels for the welcome message
        const rulesChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes('rules') || ch.name.includes('📜')
        );
        const verificationChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes('verification') || ch.name.includes('🚪')
        );
        const generalChannel = guild.channels.cache.find(ch => 
            ch.name.toLowerCase().includes('general') || ch.name.includes('💬')
        );
        
        // Create welcome embed
        const welcomeEmbed = new EmbedBuilder()
            .setColor(0x00ff7f)
            .setTitle(`🎉 Welcome to ${guild.name}!`)
            .setDescription(`Hey ${user}, welcome to our amazing community!`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { 
                    name: '👋 Getting Started', 
                    value: `${verificationChannel ? `• Verify yourself in ${verificationChannel}` : '• Complete verification to access the server'}\n${rulesChannel ? `• Read our rules in ${rulesChannel}` : '• Make sure to read our server rules'}\n• Introduce yourself when you're ready!`, 
                    inline: false 
                },
                { 
                    name: '🎯 What\'s Next?', 
                    value: `${generalChannel ? `• Join the conversation in ${generalChannel}` : '• Join the conversation in our chat channels'}\n• Explore different channels and find your interests\n• Use \`/help\` to see available bot commands\n• Have fun and make new friends!`, 
                    inline: false 
                },
                { 
                    name: '📊 Server Stats', 
                    value: `👥 **Members:** ${guild.memberCount}\n🎭 **You are member #${guild.memberCount}**`, 
                    inline: true 
                },
                { 
                    name: '🆘 Need Help?', 
                    value: `• Create a support ticket with \`/ticket\`\n• Ask questions in general chat\n• Contact staff if you need assistance`, 
                    inline: true 
                }
            )
            .setFooter({ 
                text: `Welcome to ${guild.name} • ${new Date().toLocaleDateString()}`, 
                iconURL: guild.iconURL({ dynamic: true }) 
            })
            .setTimestamp();
        
        // Send welcome message
        await welcomeChannel.send({ 
            content: `🎊 **${user} just joined the server!** 🎊`, 
            embeds: [welcomeEmbed] 
        });
        
        logger.info(`✅ Sent welcome message for ${user.tag} in ${guild.name}`);
        
    } catch (error) {
        logger.error(`Error sending welcome message for ${member.user.tag}:`, error);
    }
}

/**
 * Log member join for analytics
 */
async function logMemberJoin(member) {
    try {
        await db.run(
            `INSERT INTO member_logs (user_id, guild_id, action, timestamp) 
             VALUES (?, ?, 'join', CURRENT_TIMESTAMP)`,
            [member.user.id, member.guild.id]
        );
    } catch (error) {
        // Don't fail the welcome process if logging fails
        logger.warn('Error logging member join:', error);
    }
}
