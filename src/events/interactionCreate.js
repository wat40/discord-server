const { Events, Collection } = require('discord.js');
const { logger } = require('../utils/logger');
const { sendErrorMessage } = require('../utils/interactions');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                logger.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            // Cooldown handling
            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1000);
                    return await sendErrorMessage(interaction,
                        `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`
                    );
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            // Execute command
            try {
                logger.info(`${interaction.user.tag} used /${interaction.commandName} in ${interaction.guild?.name || 'DM'}`);
                await command.execute(interaction);
            } catch (error) {
                logger.error(`Error executing ${interaction.commandName}:`, error);
                
                const errorMessage = {
                    content: '❌ There was an error while executing this command!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        
        // Handle button interactions
        else if (interaction.isButton()) {
            const buttonId = interaction.customId;
            
            try {
                // Handle ticket system buttons
                if (buttonId.startsWith('ticket_')) {
                    const ticketHandler = require('../handlers/ticketHandler');
                    await ticketHandler.handleButtonInteraction(interaction);
                }
                
                // Handle role menu buttons
                else if (buttonId.startsWith('role_')) {
                    const roleHandler = require('../handlers/roleHandler');
                    await roleHandler.handleButtonInteraction(interaction);
                }
                
                // Handle poll buttons
                else if (buttonId.startsWith('poll_')) {
                    const pollHandler = require('../handlers/pollHandler');
                    await pollHandler.handleButtonInteraction(interaction);
                }

                // Handle setup buttons
                else if (buttonId.startsWith('setup_')) {
                    const setupHandler = require('../handlers/setupButtons');
                    await setupHandler.handleSetupButtons(interaction);
                }
                
            } catch (error) {
                logger.error(`Error handling button interaction ${buttonId}:`, error);
                
                const errorMessage = {
                    content: '❌ There was an error processing your request!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        
        // Handle select menu interactions
        else if (interaction.isStringSelectMenu()) {
            const selectId = interaction.customId;
            
            try {
                // Handle role selection menus
                if (selectId.startsWith('role_select_')) {
                    const roleHandler = require('../handlers/roleHandler');
                    await roleHandler.handleSelectInteraction(interaction);
                }
                
                // Handle ticket category selection
                else if (selectId.startsWith('ticket_category_')) {
                    const ticketHandler = require('../handlers/ticketHandler');
                    await ticketHandler.handleSelectInteraction(interaction);
                }
                
            } catch (error) {
                logger.error(`Error handling select menu interaction ${selectId}:`, error);
                
                const errorMessage = {
                    content: '❌ There was an error processing your selection!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
    },
};
