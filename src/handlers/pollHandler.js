const { EmbedBuilder } = require('discord.js');
const { logger } = require('../utils/logger');

class PollHandler {
    static async handleButtonInteraction(interaction) {
        const customId = interaction.customId;
        
        if (customId.startsWith('poll_vote_')) {
            await this.handleVote(interaction);
        } else if (customId === 'poll_end') {
            await this.handleEndPoll(interaction);
        }
    }
    
    static async handleVote(interaction) {
        try {
            const voteIndex = parseInt(interaction.customId.split('_')[2]);
            const messageId = interaction.message.id;
            
            // Get poll data
            const pollData = interaction.client.polls?.get(messageId);
            if (!pollData) {
                return interaction.reply({
                    content: '❌ Poll data not found. This poll may have expired.',
                    ephemeral: true
                });
            }
            
            // Check if poll has ended
            if (Date.now() > pollData.endTime) {
                return interaction.reply({
                    content: '❌ This poll has already ended.',
                    ephemeral: true
                });
            }
            
            const userId = interaction.user.id;
            
            // Check if user has already voted
            let hasVoted = false;
            let previousVoteIndex = -1;
            
            for (let i = 0; i < pollData.votes.length; i++) {
                if (pollData.votes[i].includes(userId)) {
                    hasVoted = true;
                    previousVoteIndex = i;
                    break;
                }
            }
            
            // Remove previous vote if exists
            if (hasVoted) {
                pollData.votes[previousVoteIndex] = pollData.votes[previousVoteIndex].filter(id => id !== userId);
            }
            
            // Add new vote (or re-vote for same option)
            if (previousVoteIndex !== voteIndex) {
                pollData.votes[voteIndex].push(userId);
                
                await interaction.reply({
                    content: `✅ You voted for: **${pollData.options[voteIndex]}**`,
                    ephemeral: true
                });
            } else {
                // User clicked the same option they already voted for (remove vote)
                await interaction.reply({
                    content: `🗳️ You removed your vote for: **${pollData.options[voteIndex]}**`,
                    ephemeral: true
                });
            }
            
            // Update poll display
            await this.updatePollDisplay(interaction.message, pollData);
            
        } catch (error) {
            logger.error('Error handling poll vote:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing your vote.',
                ephemeral: true
            });
        }
    }
    
    static async handleEndPoll(interaction) {
        try {
            const messageId = interaction.message.id;
            const pollData = interaction.client.polls?.get(messageId);
            
            if (!pollData) {
                return interaction.reply({
                    content: '❌ Poll data not found.',
                    ephemeral: true
                });
            }
            
            // Check if user is poll creator or has manage messages permission
            if (pollData.creator !== interaction.user.id && !interaction.member.permissions.has('ManageMessages')) {
                return interaction.reply({
                    content: '❌ Only the poll creator or moderators can end this poll.',
                    ephemeral: true
                });
            }
            
            // End the poll
            const { endPoll } = require('../commands/fun/poll');
            await endPoll(interaction.client, messageId);
            
            await interaction.reply({
                content: '✅ Poll ended successfully!',
                ephemeral: true
            });
            
        } catch (error) {
            logger.error('Error ending poll:', error);
            await interaction.reply({
                content: '❌ An error occurred while ending the poll.',
                ephemeral: true
            });
        }
    }
    
    static async updatePollDisplay(message, pollData) {
        try {
            const totalVotes = pollData.votes.reduce((sum, votes) => sum + votes.length, 0);
            
            // Create updated embed
            const updatedEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('📊 Poll')
                .setDescription(`**${pollData.question}**`)
                .setFooter({ text: `Total votes: ${totalVotes} • Click buttons to vote!` })
                .setTimestamp();
            
            // Add option fields with vote counts
            pollData.options.forEach((option, index) => {
                const voteCount = pollData.votes[index].length;
                const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
                
                // Create visual bar
                const barLength = 10;
                const filledBars = Math.round((voteCount / Math.max(totalVotes, 1)) * barLength);
                const emptyBars = barLength - filledBars;
                const bar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
                
                updatedEmbed.addFields({
                    name: `${['🇦', '🇧', '🇨', '🇩'][index]} ${option}`,
                    value: `\`${bar}\` ${voteCount} vote(s) (${percentage}%)`,
                    inline: false
                });
            });
            
            // Add time remaining
            const timeLeft = pollData.endTime - Date.now();
            if (timeLeft > 0) {
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                updatedEmbed.addFields({
                    name: '⏰ Time Remaining',
                    value: `${minutes}m ${seconds}s`,
                    inline: true
                });
            }
            
            await message.edit({ embeds: [updatedEmbed] });
            
        } catch (error) {
            logger.error('Error updating poll display:', error);
        }
    }
}

module.exports = PollHandler;
