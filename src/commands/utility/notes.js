const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { db } = require('../../utils/database');
const { logger } = require('../../utils/logger');
const { sendErrorMessage, replyToInteraction } = require('../../utils/interactions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('notes')
        .setDescription('Manage user notes (staff only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a note to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add note to')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('note')
                        .setDescription('Note content')
                        .setRequired(true)
                        .setMaxLength(1000)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View notes for a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to view notes for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a note')
                .addIntegerOption(option =>
                    option.setName('note_id')
                        .setDescription('ID of the note to delete')
                        .setRequired(true)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Search notes by content')
                .addStringOption(option =>
                    option.setName('query')
                        .setDescription('Search query')
                        .setRequired(true)
                        .setMinLength(3)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    
    cooldown: 3,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            // Initialize notes table if it doesn't exist
            await initializeNotesTable();
            
            switch (subcommand) {
                case 'add':
                    await handleAddNote(interaction);
                    break;
                case 'view':
                    await handleViewNotes(interaction);
                    break;
                case 'delete':
                    await handleDeleteNote(interaction);
                    break;
                case 'search':
                    await handleSearchNotes(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Error in notes command:', error);
            await sendErrorMessage(interaction, 'An error occurred while processing the notes command.');
        }
    },
};

async function initializeNotesTable() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS user_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            moderator_id TEXT NOT NULL,
            note TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

async function handleAddNote(interaction) {
    const targetUser = interaction.options.getUser('user');
    const noteContent = interaction.options.getString('note');
    
    try {
        // Add the note to database
        const result = await db.run(
            `INSERT INTO user_notes (user_id, guild_id, moderator_id, note) 
             VALUES (?, ?, ?, ?)`,
            [targetUser.id, interaction.guild.id, interaction.user.id, noteContent]
        );
        
        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('📝 Note Added')
            .setDescription(`Note added for ${targetUser}`)
            .addFields(
                { name: 'User', value: targetUser.tag, inline: true },
                { name: 'Note ID', value: result.id.toString(), inline: true },
                { name: 'Moderator', value: interaction.user.tag, inline: true },
                { name: 'Note Content', value: noteContent, inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
        
        await replyToInteraction(interaction, { embeds: [embed] });
        
        logger.info(`${interaction.user.tag} added note #${result.id} for ${targetUser.tag} in ${interaction.guild.name}`);
        
    } catch (error) {
        logger.error('Error adding note:', error);
        await sendErrorMessage(interaction, 'Failed to add the note. Please try again.');
    }
}

async function handleViewNotes(interaction) {
    const targetUser = interaction.options.getUser('user');
    
    try {
        // Get all notes for the user
        const notes = await db.all(
            'SELECT * FROM user_notes WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC',
            [targetUser.id, interaction.guild.id]
        );
        
        if (notes.length === 0) {
            return await replyToInteraction(interaction, {
                content: `📝 No notes found for ${targetUser.tag}.`,
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`📝 Notes for ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .addFields({ name: 'Total Notes', value: notes.length.toString(), inline: true })
            .setTimestamp();
        
        // Show recent notes (up to 10)
        const recentNotes = notes.slice(0, 10);
        const noteList = await Promise.all(recentNotes.map(async (note, index) => {
            const moderator = await interaction.client.users.fetch(note.moderator_id).catch(() => null);
            const date = new Date(note.created_at).toLocaleDateString();
            const notePreview = note.note.length > 100 ? note.note.substring(0, 100) + '...' : note.note;
            
            return `**${note.id}.** ${notePreview}\n*${date} by ${moderator ? moderator.tag : 'Unknown'}*`;
        }));
        
        embed.addFields({
            name: `Recent Notes (${Math.min(notes.length, 10)}/${notes.length})`,
            value: noteList.join('\n\n'),
            inline: false
        });
        
        if (notes.length > 10) {
            embed.setFooter({ text: `Showing 10 of ${notes.length} notes` });
        }
        
        await replyToInteraction(interaction, { embeds: [embed], ephemeral: true });
        
    } catch (error) {
        logger.error('Error viewing notes:', error);
        await sendErrorMessage(interaction, 'Failed to retrieve notes.');
    }
}

async function handleDeleteNote(interaction) {
    const noteId = interaction.options.getInteger('note_id');
    
    try {
        // Get the note to verify it exists and get details
        const note = await db.get(
            'SELECT * FROM user_notes WHERE id = ? AND guild_id = ?',
            [noteId, interaction.guild.id]
        );
        
        if (!note) {
            return await sendErrorMessage(interaction, 'Note not found or not in this server.');
        }
        
        // Check if user can delete this note (author or higher permissions)
        const canDelete = note.moderator_id === interaction.user.id || 
                         interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);
        
        if (!canDelete) {
            return await sendErrorMessage(interaction, 'You can only delete notes you created, or you need Manage Server permission.');
        }
        
        // Delete the note
        await db.run('DELETE FROM user_notes WHERE id = ?', [noteId]);
        
        const targetUser = await interaction.client.users.fetch(note.user_id).catch(() => null);
        
        const embed = new EmbedBuilder()
            .setColor(0xff9900)
            .setTitle('🗑️ Note Deleted')
            .setDescription(`Note #${noteId} has been deleted`)
            .addFields(
                { name: 'User', value: targetUser ? targetUser.tag : `<@${note.user_id}>`, inline: true },
                { name: 'Deleted by', value: interaction.user.tag, inline: true },
                { name: 'Original Note', value: note.note.length > 500 ? note.note.substring(0, 500) + '...' : note.note, inline: false }
            )
            .setTimestamp();
        
        if (targetUser) {
            embed.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
        }
        
        await replyToInteraction(interaction, { embeds: [embed], ephemeral: true });
        
        logger.info(`${interaction.user.tag} deleted note #${noteId} in ${interaction.guild.name}`);
        
    } catch (error) {
        logger.error('Error deleting note:', error);
        await sendErrorMessage(interaction, 'Failed to delete the note.');
    }
}

async function handleSearchNotes(interaction) {
    const query = interaction.options.getString('query');
    
    try {
        // Search notes by content
        const notes = await db.all(
            'SELECT * FROM user_notes WHERE guild_id = ? AND note LIKE ? ORDER BY created_at DESC LIMIT 20',
            [interaction.guild.id, `%${query}%`]
        );
        
        if (notes.length === 0) {
            return await replyToInteraction(interaction, {
                content: `🔍 No notes found matching "${query}".`,
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(0x9932cc)
            .setTitle(`🔍 Search Results for "${query}"`)
            .setDescription(`Found ${notes.length} note(s) matching your search`)
            .setTimestamp();
        
        const searchResults = await Promise.all(notes.map(async (note) => {
            const user = await interaction.client.users.fetch(note.user_id).catch(() => null);
            const moderator = await interaction.client.users.fetch(note.moderator_id).catch(() => null);
            const date = new Date(note.created_at).toLocaleDateString();
            
            // Highlight the search term in the note
            const highlightedNote = note.note.replace(
                new RegExp(query, 'gi'), 
                `**${query}**`
            );
            const notePreview = highlightedNote.length > 150 ? highlightedNote.substring(0, 150) + '...' : highlightedNote;
            
            return `**${note.id}.** ${user ? user.tag : 'Unknown User'}\n${notePreview}\n*${date} by ${moderator ? moderator.tag : 'Unknown'}*`;
        }));
        
        const resultText = searchResults.join('\n\n');
        
        if (resultText.length > 4096) {
            embed.setDescription(`Found ${notes.length} note(s) matching your search (showing first few results)`);
            embed.addFields({
                name: 'Results',
                value: resultText.substring(0, 4000) + '...',
                inline: false
            });
        } else {
            embed.addFields({
                name: 'Results',
                value: resultText,
                inline: false
            });
        }
        
        await replyToInteraction(interaction, { embeds: [embed], ephemeral: true });
        
    } catch (error) {
        logger.error('Error searching notes:', error);
        await sendErrorMessage(interaction, 'Failed to search notes.');
    }
}
