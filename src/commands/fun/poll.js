const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true)
                .setMaxLength(256))
        .addStringOption(option =>
            option.setName('option1')
                .setDescription('First poll option')
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('option2')
                .setDescription('Second poll option')
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('option3')
                .setDescription('Third poll option')
                .setRequired(false)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('option4')
                .setDescription('Fourth poll option')
                .setRequired(false)
                .setMaxLength(100))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Poll duration in minutes (default: 60)')
                .setMinValue(1)
                .setMaxValue(10080) // 1 week
                .setRequired(false)),
    
    cooldown: 10,
    
    async execute(interaction) {
        const question = interaction.options.getString('question');
        const option1 = interaction.options.getString('option1');
        const option2 = interaction.options.getString('option2');
        const option3 = interaction.options.getString('option3');
        const option4 = interaction.options.getString('option4');
        const duration = interaction.options.getInteger('duration') || 60;
        
        // Build options array
        const options = [option1, option2];
        if (option3) options.push(option3);
        if (option4) options.push(option4);
        
        // Create poll embed
        const pollEmbed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('📊 Poll')
            .setDescription(`**${question}**`)
            .addFields(
                options.map((option, index) => ({
                    name: `${['🇦', '🇧', '🇨', '🇩'][index]} Option ${index + 1}`,
                    value: option,
                    inline: true
                }))
            )
            .addFields(
                { name: 'Duration', value: `${duration} minute(s)`, inline: true },
                { name: 'Created by', value: interaction.user.toString(), inline: true }
            )
            .setFooter({ text: 'Click the buttons below to vote!' })
            .setTimestamp();
        
        // Create voting buttons
        const buttons = options.map((option, index) => 
            new ButtonBuilder()
                .setCustomId(`poll_vote_${index}`)
                .setLabel(`${option.substring(0, 20)}${option.length > 20 ? '...' : ''}`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji(['🇦', '🇧', '🇨', '🇩'][index])
        );
        
        // Add end poll button for poll creator
        buttons.push(
            new ButtonBuilder()
                .setCustomId('poll_end')
                .setLabel('End Poll')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🛑')
        );
        
        // Create action rows (max 5 buttons per row)
        const rows = [];
        for (let i = 0; i < buttons.length; i += 5) {
            rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
        }
        
        // Send poll
        const pollMessage = await interaction.reply({
            embeds: [pollEmbed],
            components: rows,
            fetchReply: true
        });
        
        // Store poll data in message for later reference
        const pollData = {
            question,
            options,
            votes: options.map(() => []), // Array of arrays to store voter IDs
            creator: interaction.user.id,
            endTime: Date.now() + (duration * 60 * 1000),
            messageId: pollMessage.id,
            channelId: interaction.channel.id
        };
        
        // Store poll data in a Map (in a real bot, you'd use a database)
        if (!interaction.client.polls) {
            interaction.client.polls = new Map();
        }
        interaction.client.polls.set(pollMessage.id, pollData);
        
        // Set timeout to automatically end poll
        setTimeout(async () => {
            try {
                await endPoll(interaction.client, pollMessage.id);
            } catch (error) {
                console.error('Error auto-ending poll:', error);
            }
        }, duration * 60 * 1000);
    },
};

async function endPoll(client, messageId) {
    const pollData = client.polls?.get(messageId);
    if (!pollData) return;
    
    try {
        const channel = await client.channels.fetch(pollData.channelId);
        const message = await channel.messages.fetch(messageId);
        
        // Calculate results
        const totalVotes = pollData.votes.reduce((sum, votes) => sum + votes.length, 0);
        const results = pollData.options.map((option, index) => {
            const voteCount = pollData.votes[index].length;
            const percentage = totalVotes > 0 ? ((voteCount / totalVotes) * 100).toFixed(1) : 0;
            return {
                option,
                votes: voteCount,
                percentage
            };
        });
        
        // Sort by vote count
        results.sort((a, b) => b.votes - a.votes);
        
        // Create results embed
        const resultsEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('📊 Poll Results')
            .setDescription(`**${pollData.question}**\n\n**Total Votes:** ${totalVotes}`)
            .addFields(
                results.map((result, index) => ({
                    name: `${index === 0 ? '🏆' : '📊'} ${result.option}`,
                    value: `${result.votes} vote(s) (${result.percentage}%)`,
                    inline: true
                }))
            )
            .setFooter({ text: 'Poll ended' })
            .setTimestamp();
        
        // Update message with results
        await message.edit({
            embeds: [resultsEmbed],
            components: [] // Remove buttons
        });
        
        // Remove poll data
        client.polls.delete(messageId);
        
    } catch (error) {
        console.error('Error ending poll:', error);
    }
}

module.exports.endPoll = endPoll;
