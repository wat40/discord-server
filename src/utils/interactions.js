const { InteractionResponseFlags } = require('discord.js');

/**
 * Utility functions for handling Discord interactions with proper flags
 */

/**
 * Reply to an interaction with proper flags
 * @param {CommandInteraction} interaction - The interaction to reply to
 * @param {Object} options - Reply options
 * @param {boolean} options.ephemeral - Whether the reply should be ephemeral
 * @param {string} options.content - The content of the reply
 * @param {Array} options.embeds - Embeds to include
 * @param {Array} options.components - Components to include
 * @param {Array} options.files - Files to include
 * @returns {Promise} The reply promise
 */
async function replyToInteraction(interaction, options = {}) {
    const replyOptions = {
        content: options.content,
        embeds: options.embeds,
        components: options.components,
        files: options.files
    };
    
    // Add ephemeral flag if specified
    if (options.ephemeral) {
        replyOptions.flags = InteractionResponseFlags.Ephemeral;
    }
    
    return interaction.reply(replyOptions);
}

/**
 * Follow up to an interaction with proper flags
 * @param {CommandInteraction} interaction - The interaction to follow up to
 * @param {Object} options - Follow up options
 * @returns {Promise} The follow up promise
 */
async function followUpInteraction(interaction, options = {}) {
    const followUpOptions = {
        content: options.content,
        embeds: options.embeds,
        components: options.components,
        files: options.files
    };
    
    // Add ephemeral flag if specified
    if (options.ephemeral) {
        followUpOptions.flags = InteractionResponseFlags.Ephemeral;
    }
    
    return interaction.followUp(followUpOptions);
}

/**
 * Edit an interaction reply with proper flags
 * @param {CommandInteraction} interaction - The interaction to edit
 * @param {Object} options - Edit options
 * @returns {Promise} The edit promise
 */
async function editInteractionReply(interaction, options = {}) {
    const editOptions = {
        content: options.content,
        embeds: options.embeds,
        components: options.components,
        files: options.files
    };
    
    return interaction.editReply(editOptions);
}

/**
 * Send an ephemeral error message
 * @param {CommandInteraction} interaction - The interaction
 * @param {string} message - Error message
 * @returns {Promise} The reply promise
 */
async function sendErrorMessage(interaction, message) {
    return replyToInteraction(interaction, {
        content: `❌ ${message}`,
        ephemeral: true
    });
}

/**
 * Send an ephemeral success message
 * @param {CommandInteraction} interaction - The interaction
 * @param {string} message - Success message
 * @returns {Promise} The reply promise
 */
async function sendSuccessMessage(interaction, message) {
    return replyToInteraction(interaction, {
        content: `✅ ${message}`,
        ephemeral: true
    });
}

/**
 * Send an ephemeral warning message
 * @param {CommandInteraction} interaction - The interaction
 * @param {string} message - Warning message
 * @returns {Promise} The reply promise
 */
async function sendWarningMessage(interaction, message) {
    return replyToInteraction(interaction, {
        content: `⚠️ ${message}`,
        ephemeral: true
    });
}

/**
 * Send an ephemeral info message
 * @param {CommandInteraction} interaction - The interaction
 * @param {string} message - Info message
 * @returns {Promise} The reply promise
 */
async function sendInfoMessage(interaction, message) {
    return replyToInteraction(interaction, {
        content: `ℹ️ ${message}`,
        ephemeral: true
    });
}

/**
 * Check if interaction has been replied to or deferred
 * @param {CommandInteraction} interaction - The interaction
 * @returns {boolean} Whether the interaction has been handled
 */
function isInteractionHandled(interaction) {
    return interaction.replied || interaction.deferred;
}

/**
 * Safely respond to an interaction (handles already replied/deferred cases)
 * @param {CommandInteraction} interaction - The interaction
 * @param {Object} options - Response options
 * @returns {Promise} The response promise
 */
async function safeReply(interaction, options = {}) {
    if (interaction.replied) {
        return followUpInteraction(interaction, options);
    } else if (interaction.deferred) {
        return editInteractionReply(interaction, options);
    } else {
        return replyToInteraction(interaction, options);
    }
}

/**
 * Safely send an error message (handles already replied/deferred cases)
 * @param {CommandInteraction} interaction - The interaction
 * @param {string} message - Error message
 * @returns {Promise} The response promise
 */
async function safeErrorReply(interaction, message) {
    return safeReply(interaction, {
        content: `❌ ${message}`,
        ephemeral: true
    });
}

/**
 * Defer an interaction reply
 * @param {CommandInteraction} interaction - The interaction
 * @param {boolean} ephemeral - Whether the defer should be ephemeral
 * @returns {Promise} The defer promise
 */
async function deferReply(interaction, ephemeral = false) {
    const options = {};
    if (ephemeral) {
        options.flags = InteractionResponseFlags.Ephemeral;
    }
    return interaction.deferReply(options);
}

module.exports = {
    replyToInteraction,
    followUpInteraction,
    editInteractionReply,
    sendErrorMessage,
    sendSuccessMessage,
    sendWarningMessage,
    sendInfoMessage,
    isInteractionHandled,
    safeReply,
    safeErrorReply,
    deferReply
};
