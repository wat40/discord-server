const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { replyToInteraction, sendErrorMessage } = require('../../utils/interactions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Roll dice with various options')
        .addSubcommand(subcommand =>
            subcommand
                .setName('roll')
                .setDescription('Roll dice')
                .addStringOption(option =>
                    option.setName('dice')
                        .setDescription('Dice notation (e.g., 2d6, 1d20+5, 3d8-2)')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('sides')
                        .setDescription('Number of sides (if not using dice notation)')
                        .setMinValue(2)
                        .setMaxValue(1000)
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of dice to roll')
                        .setMinValue(1)
                        .setMaxValue(20)
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Roll stats for D&D character (4d6 drop lowest, 6 times)')
                .addStringOption(option =>
                    option.setName('method')
                        .setDescription('Rolling method')
                        .addChoices(
                            { name: 'Standard (4d6 drop lowest)', value: 'standard' },
                            { name: 'Heroic (4d6 drop lowest, reroll 1s)', value: 'heroic' },
                            { name: 'Point Buy Simulation', value: 'pointbuy' }
                        )
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('coin')
                .setDescription('Flip a coin')
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Number of coins to flip')
                        .setMinValue(1)
                        .setMaxValue(10)
                        .setRequired(false))),
    
    cooldown: 2,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            switch (subcommand) {
                case 'roll':
                    await handleDiceRoll(interaction);
                    break;
                case 'stats':
                    await handleStatsRoll(interaction);
                    break;
                case 'coin':
                    await handleCoinFlip(interaction);
                    break;
            }
        } catch (error) {
            console.error('Error in dice command:', error);
            await sendErrorMessage(interaction, 'An error occurred while rolling dice.');
        }
    },
};

async function handleDiceRoll(interaction) {
    const diceNotation = interaction.options.getString('dice');
    const sides = interaction.options.getInteger('sides') || 6;
    const count = interaction.options.getInteger('count') || 1;
    
    let rollResult;
    
    if (diceNotation) {
        // Parse dice notation (e.g., 2d6+3, 1d20-1)
        rollResult = parseDiceNotation(diceNotation);
        if (!rollResult) {
            return await sendErrorMessage(interaction, 'Invalid dice notation. Use format like: 2d6, 1d20+5, 3d8-2');
        }
    } else {
        // Simple dice roll
        rollResult = rollDice(count, sides);
    }
    
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🎲 Dice Roll')
        .addFields(
            { name: 'Roll', value: rollResult.notation, inline: true },
            { name: 'Result', value: `**${rollResult.total}**`, inline: true }
        )
        .setTimestamp();
    
    if (rollResult.rolls.length > 1) {
        const rollsText = rollResult.rolls.length <= 20 
            ? rollResult.rolls.join(', ')
            : rollResult.rolls.slice(0, 20).join(', ') + '...';
        embed.addFields({ name: 'Individual Rolls', value: rollsText, inline: false });
    }
    
    if (rollResult.modifier !== 0) {
        embed.addFields({ 
            name: 'Calculation', 
            value: `${rollResult.rollTotal} ${rollResult.modifier >= 0 ? '+' : ''}${rollResult.modifier} = **${rollResult.total}**`, 
            inline: false 
        });
    }
    
    // Add roll again button
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`dice_reroll_${rollResult.notation}`)
                .setLabel('Roll Again')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎲')
        );
    
    await replyToInteraction(interaction, { embeds: [embed], components: [row] });
}

async function handleStatsRoll(interaction) {
    const method = interaction.options.getString('method') || 'standard';
    
    let stats = [];
    let methodDescription = '';
    
    switch (method) {
        case 'standard':
            methodDescription = '4d6 drop lowest';
            for (let i = 0; i < 6; i++) {
                const rolls = [rollDie(6), rollDie(6), rollDie(6), rollDie(6)];
                rolls.sort((a, b) => b - a);
                const total = rolls[0] + rolls[1] + rolls[2]; // Drop lowest
                stats.push({ total, rolls: rolls.slice(0, 3) });
            }
            break;
            
        case 'heroic':
            methodDescription = '4d6 drop lowest, reroll 1s';
            for (let i = 0; i < 6; i++) {
                let rolls = [];
                for (let j = 0; j < 4; j++) {
                    let roll = rollDie(6);
                    if (roll === 1) roll = rollDie(6); // Reroll 1s
                    rolls.push(roll);
                }
                rolls.sort((a, b) => b - a);
                const total = rolls[0] + rolls[1] + rolls[2]; // Drop lowest
                stats.push({ total, rolls: rolls.slice(0, 3) });
            }
            break;
            
        case 'pointbuy':
            methodDescription = 'Point buy simulation (15, 14, 13, 12, 10, 8)';
            const pointBuyArray = [15, 14, 13, 12, 10, 8];
            // Shuffle the array
            for (let i = pointBuyArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pointBuyArray[i], pointBuyArray[j]] = [pointBuyArray[j], pointBuyArray[i]];
            }
            stats = pointBuyArray.map(total => ({ total, rolls: [total] }));
            break;
    }
    
    const statNames = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
    const total = stats.reduce((sum, stat) => sum + stat.total, 0);
    const average = (total / 6).toFixed(1);
    
    const embed = new EmbedBuilder()
        .setColor(0x9932cc)
        .setTitle('📊 D&D Ability Scores')
        .setDescription(`**Method:** ${methodDescription}`)
        .addFields(
            { name: 'Total', value: total.toString(), inline: true },
            { name: 'Average', value: average, inline: true },
            { name: 'Modifier Total', value: calculateModifierTotal(stats).toString(), inline: true }
        )
        .setTimestamp();
    
    const statsText = stats.map((stat, index) => {
        const modifier = Math.floor((stat.total - 10) / 2);
        const modifierText = modifier >= 0 ? `+${modifier}` : modifier.toString();
        return `**${statNames[index]}:** ${stat.total} (${modifierText})`;
    }).join('\n');
    
    embed.addFields({ name: 'Ability Scores', value: statsText, inline: false });
    
    // Add reroll button
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`dice_stats_${method}`)
                .setLabel('Reroll Stats')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🎲')
        );
    
    await replyToInteraction(interaction, { embeds: [embed], components: [row] });
}

async function handleCoinFlip(interaction) {
    const count = interaction.options.getInteger('count') || 1;
    
    const flips = [];
    let heads = 0;
    let tails = 0;
    
    for (let i = 0; i < count; i++) {
        const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
        flips.push(result);
        if (result === 'Heads') heads++;
        else tails++;
    }
    
    const embed = new EmbedBuilder()
        .setColor(0xffd700)
        .setTitle('🪙 Coin Flip')
        .setTimestamp();
    
    if (count === 1) {
        embed.setDescription(`**${flips[0]}!**`);
        embed.setThumbnail(flips[0] === 'Heads' 
            ? 'https://upload.wikimedia.org/wikipedia/commons/a/a0/2006_Quarter_Proof.png'
            : 'https://upload.wikimedia.org/wikipedia/commons/2/2e/2006_Quarter_Proof_back.png'
        );
    } else {
        embed.addFields(
            { name: 'Results', value: flips.join(', '), inline: false },
            { name: 'Heads', value: heads.toString(), inline: true },
            { name: 'Tails', value: tails.toString(), inline: true },
            { name: 'Total Flips', value: count.toString(), inline: true }
        );
    }
    
    // Add flip again button
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`dice_coin_${count}`)
                .setLabel('Flip Again')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🪙')
        );
    
    await replyToInteraction(interaction, { embeds: [embed], components: [row] });
}

function rollDie(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

function rollDice(count, sides, modifier = 0) {
    const rolls = [];
    for (let i = 0; i < count; i++) {
        rolls.push(rollDie(sides));
    }
    
    const rollTotal = rolls.reduce((sum, roll) => sum + roll, 0);
    const total = rollTotal + modifier;
    
    return {
        notation: `${count}d${sides}${modifier !== 0 ? (modifier >= 0 ? '+' : '') + modifier : ''}`,
        rolls,
        rollTotal,
        modifier,
        total
    };
}

function parseDiceNotation(notation) {
    // Parse dice notation like 2d6+3, 1d20-1, etc.
    const regex = /^(\d+)d(\d+)([+-]\d+)?$/i;
    const match = notation.match(regex);
    
    if (!match) return null;
    
    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    const modifier = match[3] ? parseInt(match[3]) : 0;
    
    if (count > 20 || sides > 1000 || count < 1 || sides < 2) return null;
    
    return rollDice(count, sides, modifier);
}

function calculateModifierTotal(stats) {
    return stats.reduce((total, stat) => {
        const modifier = Math.floor((stat.total - 10) / 2);
        return total + modifier;
    }, 0);
}
