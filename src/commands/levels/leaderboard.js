const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('View the server XP leaderboard')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('Page number to view')
                .setMinValue(1)
                .setRequired(false)),
    
    cooldown: 10,
    
    async execute(interaction) {
        const page = interaction.options.getInteger('page') || 1;
        const itemsPerPage = 10;
        const offset = (page - 1) * itemsPerPage;
        
        try {
            // Check if XP system is enabled
            const guildSettings = await db.get(
                'SELECT xp_enabled FROM guild_settings WHERE guild_id = ?',
                [interaction.guild.id]
            );
            
            if (!guildSettings?.xp_enabled) {
                return interaction.reply({
                    content: '❌ The XP system is disabled in this server.',
                    ephemeral: true
                });
            }
            
            // Get total count for pagination
            const totalCount = await db.get(
                'SELECT COUNT(*) as count FROM user_levels WHERE guild_id = ? AND xp > 0',
                [interaction.guild.id]
            );
            
            const totalPages = Math.ceil(totalCount.count / itemsPerPage);
            
            if (page > totalPages && totalPages > 0) {
                return interaction.reply({
                    content: `❌ Page ${page} doesn't exist. There are only ${totalPages} pages.`,
                    ephemeral: true
                });
            }
            
            // Get leaderboard data
            const leaderboard = await db.all(
                `SELECT user_id, xp, level, messages_sent 
                 FROM user_levels 
                 WHERE guild_id = ? AND xp > 0 
                 ORDER BY xp DESC 
                 LIMIT ? OFFSET ?`,
                [interaction.guild.id, itemsPerPage, offset]
            );
            
            if (leaderboard.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('🏆 XP Leaderboard')
                    .setDescription('No users have earned XP yet!')
                    .setTimestamp();
                
                return interaction.reply({ embeds: [embed] });
            }
            
            // Get user's rank if they're not on current page
            const userRank = await getUserRank(interaction.user.id, interaction.guild.id);
            
            // Build leaderboard text
            const leaderboardText = await Promise.all(
                leaderboard.map(async (entry, index) => {
                    const rank = offset + index + 1;
                    const user = await interaction.client.users.fetch(entry.user_id).catch(() => null);
                    const username = user ? user.tag : 'Unknown User';
                    
                    // Calculate XP needed for next level
                    const currentLevelXP = entry.level * 100;
                    const nextLevelXP = (entry.level + 1) * 100;
                    const progressXP = entry.xp - currentLevelXP;
                    const neededXP = nextLevelXP - currentLevelXP;
                    
                    // Create rank emoji
                    let rankEmoji = '🔸';
                    if (rank === 1) rankEmoji = '🥇';
                    else if (rank === 2) rankEmoji = '🥈';
                    else if (rank === 3) rankEmoji = '🥉';
                    
                    return `${rankEmoji} **#${rank}** ${username}\n` +
                           `Level ${entry.level} • ${entry.xp.toLocaleString()} XP • ${entry.messages_sent || 0} messages`;
                })
            );
            
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('🏆 XP Leaderboard')
                .setDescription(leaderboardText.join('\n\n'))
                .addFields(
                    { name: 'Page', value: `${page}/${totalPages}`, inline: true },
                    { name: 'Total Users', value: totalCount.count.toString(), inline: true }
                )
                .setTimestamp();
            
            // Add user's rank if they're not on current page
            if (userRank && (userRank.rank < offset + 1 || userRank.rank > offset + itemsPerPage)) {
                embed.addFields({
                    name: 'Your Rank',
                    value: `#${userRank.rank} • Level ${userRank.level} • ${userRank.xp.toLocaleString()} XP`,
                    inline: false
                });
            }
            
            // Create navigation buttons
            const row = new ActionRowBuilder();
            
            // Previous page button
            if (page > 1) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`leaderboard_${page - 1}`)
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⬅️')
                );
            }
            
            // Refresh button
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`leaderboard_${page}`)
                    .setLabel('Refresh')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔄')
            );
            
            // Next page button
            if (page < totalPages) {
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`leaderboard_${page + 1}`)
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('➡️')
                );
            }
            
            // Jump to user's rank button
            if (userRank && userRank.rank > itemsPerPage) {
                const userPage = Math.ceil(userRank.rank / itemsPerPage);
                if (userPage !== page) {
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`leaderboard_${userPage}`)
                            .setLabel('My Rank')
                            .setStyle(ButtonStyle.Success)
                            .setEmoji('👤')
                    );
                }
            }
            
            const components = row.components.length > 0 ? [row] : [];
            
            await interaction.reply({ embeds: [embed], components });
            
        } catch (error) {
            console.error('Error in leaderboard command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching the leaderboard.',
                ephemeral: true
            });
        }
    },
};

async function getUserRank(userId, guildId) {
    try {
        // Get user's XP
        const userLevel = await db.get(
            'SELECT xp, level FROM user_levels WHERE user_id = ? AND guild_id = ?',
            [userId, guildId]
        );
        
        if (!userLevel) return null;
        
        // Get user's rank
        const rankResult = await db.get(
            `SELECT COUNT(*) + 1 as rank 
             FROM user_levels 
             WHERE guild_id = ? AND xp > ? AND xp > 0`,
            [guildId, userLevel.xp]
        );
        
        return {
            rank: rankResult.rank,
            xp: userLevel.xp,
            level: userLevel.level
        };
        
    } catch (error) {
        console.error('Error getting user rank:', error);
        return null;
    }
}
