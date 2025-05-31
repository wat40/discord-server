const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../../utils/database');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tag')
        .setDescription('Manage server tags/responses')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new tag')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Tag name')
                        .setRequired(true)
                        .setMaxLength(50))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('Tag content')
                        .setRequired(true)
                        .setMaxLength(2000)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit an existing tag')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Tag name to edit')
                        .setRequired(true)
                        .setAutocomplete(true))
                .addStringOption(option =>
                    option.setName('content')
                        .setDescription('New tag content')
                        .setRequired(true)
                        .setMaxLength(2000)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a tag')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Tag name to delete')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Get information about a tag')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Tag name')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all tags in the server')
                .addUserOption(option =>
                    option.setName('author')
                        .setDescription('Filter by tag author')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('use')
                .setDescription('Use a tag')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Tag name to use')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        .setDMPermission(false),
    
    cooldown: 3,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        try {
            // Initialize tags table if it doesn't exist
            await initializeTagsTable();
            
            switch (subcommand) {
                case 'create':
                    await handleCreateTag(interaction);
                    break;
                case 'edit':
                    await handleEditTag(interaction);
                    break;
                case 'delete':
                    await handleDeleteTag(interaction);
                    break;
                case 'info':
                    await handleTagInfo(interaction);
                    break;
                case 'list':
                    await handleListTags(interaction);
                    break;
                case 'use':
                    await handleUseTag(interaction);
                    break;
            }
        } catch (error) {
            logger.error('Error in tag command:', error);
            
            const errorMessage = {
                content: '❌ An error occurred while processing the tag command.',
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },
    
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const guildId = interaction.guild.id;
        
        try {
            const tags = await db.all(
                'SELECT name FROM tags WHERE guild_id = ? AND name LIKE ? LIMIT 25',
                [guildId, `%${focusedValue}%`]
            );
            
            const choices = tags.map(tag => ({
                name: tag.name,
                value: tag.name
            }));
            
            await interaction.respond(choices);
        } catch (error) {
            logger.error('Error in tag autocomplete:', error);
            await interaction.respond([]);
        }
    },
};

async function initializeTagsTable() {
    await db.run(`
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            uses INTEGER DEFAULT 0,
            UNIQUE(guild_id, name)
        )
    `);
}

async function handleCreateTag(interaction) {
    const name = interaction.options.getString('name').toLowerCase();
    const content = interaction.options.getString('content');
    
    // Check if tag already exists
    const existingTag = await db.get(
        'SELECT name FROM tags WHERE guild_id = ? AND name = ?',
        [interaction.guild.id, name]
    );
    
    if (existingTag) {
        return interaction.reply({
            content: `❌ A tag with the name "${name}" already exists.`,
            ephemeral: true
        });
    }
    
    // Create the tag
    await db.run(
        'INSERT INTO tags (guild_id, name, content, author_id) VALUES (?, ?, ?, ?)',
        [interaction.guild.id, name, content, interaction.user.id]
    );
    
    const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('✅ Tag Created')
        .setDescription(`Successfully created tag **${name}**`)
        .addFields(
            { name: 'Name', value: name, inline: true },
            { name: 'Author', value: interaction.user.tag, inline: true },
            { name: 'Content Preview', value: content.length > 100 ? content.substring(0, 100) + '...' : content, inline: false }
        )
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    logger.info(`${interaction.user.tag} created tag "${name}" in ${interaction.guild.name}`);
}

async function handleEditTag(interaction) {
    const name = interaction.options.getString('name').toLowerCase();
    const newContent = interaction.options.getString('content');
    
    // Check if tag exists and user owns it or has manage messages permission
    const tag = await db.get(
        'SELECT * FROM tags WHERE guild_id = ? AND name = ?',
        [interaction.guild.id, name]
    );
    
    if (!tag) {
        return interaction.reply({
            content: `❌ Tag "${name}" not found.`,
            ephemeral: true
        });
    }
    
    const canEdit = tag.author_id === interaction.user.id || 
                   interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
    
    if (!canEdit) {
        return interaction.reply({
            content: '❌ You can only edit tags you created, or you need Manage Messages permission.',
            ephemeral: true
        });
    }
    
    // Update the tag
    await db.run(
        'UPDATE tags SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ? AND name = ?',
        [newContent, interaction.guild.id, name]
    );
    
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('✏️ Tag Updated')
        .setDescription(`Successfully updated tag **${name}**`)
        .addFields(
            { name: 'Name', value: name, inline: true },
            { name: 'Editor', value: interaction.user.tag, inline: true },
            { name: 'New Content Preview', value: newContent.length > 100 ? newContent.substring(0, 100) + '...' : newContent, inline: false }
        )
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    logger.info(`${interaction.user.tag} edited tag "${name}" in ${interaction.guild.name}`);
}

async function handleDeleteTag(interaction) {
    const name = interaction.options.getString('name').toLowerCase();
    
    // Check if tag exists and user owns it or has manage messages permission
    const tag = await db.get(
        'SELECT * FROM tags WHERE guild_id = ? AND name = ?',
        [interaction.guild.id, name]
    );
    
    if (!tag) {
        return interaction.reply({
            content: `❌ Tag "${name}" not found.`,
            ephemeral: true
        });
    }
    
    const canDelete = tag.author_id === interaction.user.id || 
                     interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
    
    if (!canDelete) {
        return interaction.reply({
            content: '❌ You can only delete tags you created, or you need Manage Messages permission.',
            ephemeral: true
        });
    }
    
    // Delete the tag
    await db.run(
        'DELETE FROM tags WHERE guild_id = ? AND name = ?',
        [interaction.guild.id, name]
    );
    
    const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🗑️ Tag Deleted')
        .setDescription(`Successfully deleted tag **${name}**`)
        .addFields(
            { name: 'Name', value: name, inline: true },
            { name: 'Deleted by', value: interaction.user.tag, inline: true },
            { name: 'Uses', value: tag.uses.toString(), inline: true }
        )
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    logger.info(`${interaction.user.tag} deleted tag "${name}" in ${interaction.guild.name}`);
}

async function handleTagInfo(interaction) {
    const name = interaction.options.getString('name').toLowerCase();
    
    const tag = await db.get(
        'SELECT * FROM tags WHERE guild_id = ? AND name = ?',
        [interaction.guild.id, name]
    );
    
    if (!tag) {
        return interaction.reply({
            content: `❌ Tag "${name}" not found.`,
            ephemeral: true
        });
    }
    
    const author = await interaction.client.users.fetch(tag.author_id).catch(() => null);
    const createdDate = new Date(tag.created_at);
    const updatedDate = new Date(tag.updated_at);
    
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`📋 Tag Information: ${tag.name}`)
        .addFields(
            { name: 'Author', value: author ? author.tag : 'Unknown User', inline: true },
            { name: 'Uses', value: tag.uses.toString(), inline: true },
            { name: 'Created', value: `<t:${Math.floor(createdDate.getTime() / 1000)}:R>`, inline: true },
            { name: 'Last Updated', value: `<t:${Math.floor(updatedDate.getTime() / 1000)}:R>`, inline: true },
            { name: 'Content Length', value: `${tag.content.length} characters`, inline: true },
            { name: 'Content Preview', value: tag.content.length > 500 ? tag.content.substring(0, 500) + '...' : tag.content, inline: false }
        )
        .setTimestamp();
    
    if (author) {
        embed.setThumbnail(author.displayAvatarURL({ dynamic: true }));
    }
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`tag_use_${name}`)
                .setLabel('Use Tag')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📤')
        );
    
    await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleListTags(interaction) {
    const authorFilter = interaction.options.getUser('author');
    
    let query = 'SELECT name, author_id, uses FROM tags WHERE guild_id = ?';
    let params = [interaction.guild.id];
    
    if (authorFilter) {
        query += ' AND author_id = ?';
        params.push(authorFilter.id);
    }
    
    query += ' ORDER BY uses DESC LIMIT 25';
    
    const tags = await db.all(query, params);
    
    if (tags.length === 0) {
        const message = authorFilter 
            ? `❌ No tags found by ${authorFilter.tag}.`
            : '❌ No tags found in this server.';
        
        return interaction.reply({
            content: message,
            ephemeral: true
        });
    }
    
    const tagList = await Promise.all(
        tags.map(async (tag, index) => {
            const author = await interaction.client.users.fetch(tag.author_id).catch(() => null);
            return `**${index + 1}.** ${tag.name} (${tag.uses} uses) - *by ${author ? author.tag : 'Unknown'}*`;
        })
    );
    
    const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`📋 Server Tags${authorFilter ? ` by ${authorFilter.tag}` : ''} (${tags.length})`)
        .setDescription(tagList.join('\n'))
        .setFooter({ text: 'Use /tag use <name> to use a tag' })
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}

async function handleUseTag(interaction) {
    const name = interaction.options.getString('name').toLowerCase();
    
    const tag = await db.get(
        'SELECT * FROM tags WHERE guild_id = ? AND name = ?',
        [interaction.guild.id, name]
    );
    
    if (!tag) {
        return interaction.reply({
            content: `❌ Tag "${name}" not found.`,
            ephemeral: true
        });
    }
    
    // Increment usage count
    await db.run(
        'UPDATE tags SET uses = uses + 1 WHERE guild_id = ? AND name = ?',
        [interaction.guild.id, name]
    );
    
    // Process content for variables
    let content = tag.content;
    content = content.replace(/\{user\}/g, interaction.user.toString());
    content = content.replace(/\{server\}/g, interaction.guild.name);
    content = content.replace(/\{channel\}/g, interaction.channel.toString());
    content = content.replace(/\{author\}/g, interaction.user.tag);
    
    await interaction.reply({ content: content });
}
