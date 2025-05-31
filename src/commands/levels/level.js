const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Check your or someone else\'s level and XP')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check (leave empty for yourself)')
                .setRequired(false)),
    
    cooldown: 5,
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const member = interaction.guild.members.cache.get(targetUser.id);
        
        if (!member) {
            return interaction.reply({
                content: '❌ User not found in this server.',
                ephemeral: true
            });
        }
        
        try {
            // Get user's level data
            const levelData = await db.get(
                'SELECT xp, level FROM user_levels WHERE user_id = ? AND guild_id = ?',
                [targetUser.id, interaction.guild.id]
            );
            
            const currentXP = levelData?.xp || 0;
            const currentLevel = levelData?.level || 1;
            
            // Calculate XP needed for next level
            const nextLevelXP = Math.pow(currentLevel + 1, 2) * 100;
            const currentLevelXP = Math.pow(currentLevel, 2) * 100;
            const xpNeeded = nextLevelXP - currentXP;
            const xpProgress = currentXP - currentLevelXP;
            const xpForThisLevel = nextLevelXP - currentLevelXP;
            
            // Calculate progress percentage
            const progressPercentage = Math.max(0, Math.min(100, (xpProgress / xpForThisLevel) * 100));
            
            // Create progress bar
            const progressBarLength = 20;
            const filledBars = Math.round((progressPercentage / 100) * progressBarLength);
            const emptyBars = progressBarLength - filledBars;
            const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
            
            // Get user's rank in the server
            const rankData = await db.all(
                'SELECT user_id, xp FROM user_levels WHERE guild_id = ? ORDER BY xp DESC',
                [interaction.guild.id]
            );
            
            const userRank = rankData.findIndex(user => user.user_id === targetUser.id) + 1;
            
            // Create level embed
            const levelEmbed = new EmbedBuilder()
                .setColor(member.displayHexColor || 0x0099ff)
                .setTitle(`📊 ${targetUser.id === interaction.user.id ? 'Your' : `${targetUser.username}'s`} Level Stats`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    {
                        name: '📈 Current Stats',
                        value: [
                            `**Level:** ${currentLevel}`,
                            `**Total XP:** ${currentXP.toLocaleString()}`,
                            `**Server Rank:** #${userRank}/${rankData.length}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🎯 Next Level Progress',
                        value: [
                            `**XP Needed:** ${xpNeeded.toLocaleString()}`,
                            `**Progress:** ${xpProgress.toLocaleString()}/${xpForThisLevel.toLocaleString()}`,
                            `**Percentage:** ${progressPercentage.toFixed(1)}%`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📊 Progress Bar',
                        value: `\`${progressBar}\` ${progressPercentage.toFixed(1)}%`,
                        inline: false
                    }
                )
                .setFooter({ 
                    text: `${interaction.guild.name} • XP gained from chatting`,
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setTimestamp();
            
            // Add level milestone information
            if (currentLevel >= 10) {
                levelEmbed.addFields({
                    name: '🏆 Achievements',
                    value: getLevelAchievements(currentLevel),
                    inline: false
                });
            }
            
            await interaction.reply({ embeds: [levelEmbed] });
            
        } catch (error) {
            console.error('Error in level command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching level information.',
                ephemeral: true
            });
        }
    },
};

function getLevelAchievements(level) {
    const achievements = [];
    
    if (level >= 10) achievements.push('🥉 Reached Level 10');
    if (level >= 25) achievements.push('🥈 Reached Level 25');
    if (level >= 50) achievements.push('🥇 Reached Level 50');
    if (level >= 75) achievements.push('💎 Reached Level 75');
    if (level >= 100) achievements.push('👑 Reached Level 100');
    
    return achievements.length > 0 ? achievements.join('\n') : 'Keep chatting to unlock achievements!';
}
