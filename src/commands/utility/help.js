const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get help with ModuBot commands')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Get detailed help for a specific command')
                .setRequired(false)
                .setAutocomplete(true)),

    cooldown: 5,
    
    async execute(interaction) {
        const commandName = interaction.options.getString('command');
        
        if (commandName) {
            // Show specific command help
            const command = interaction.client.commands.get(commandName);
            
            if (!command) {
                return interaction.reply({
                    content: `❌ Command \`${commandName}\` not found.`,
                    ephemeral: true
                });
            }
            
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`📖 Help: /${command.data.name}`)
                .setDescription(command.data.description)
                .addFields(
                    {
                        name: 'Usage',
                        value: `\`/${command.data.name}\``,
                        inline: true
                    },
                    {
                        name: 'Cooldown',
                        value: `${command.cooldown || 3} seconds`,
                        inline: true
                    }
                );
            
            // Add options if they exist
            if (command.data.options && command.data.options.length > 0) {
                const options = command.data.options.map(option => {
                    const required = option.required ? '**Required**' : 'Optional';
                    return `**${option.name}** (${option.type}) - ${required}\n${option.description}`;
                }).join('\n\n');
                
                embed.addFields({
                    name: 'Options',
                    value: options,
                    inline: false
                });
            }
            
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
        
        // Show general help with category selection
        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle('🤖 ModuBot Help')
            .setDescription('Welcome to ModuBot! Select a category below to see available commands.')
            .addFields(
                {
                    name: '🛡️ Moderation',
                    value: 'Commands for server moderation and management',
                    inline: true
                },
                {
                    name: '🎫 Support',
                    value: 'Ticket system and support tools',
                    inline: true
                },
                {
                    name: '🔧 Utility',
                    value: 'Useful utility and information commands',
                    inline: true
                },
                {
                    name: '🎉 Fun',
                    value: 'Entertainment and engagement commands',
                    inline: true
                },
                {
                    name: '🏆 Levels',
                    value: 'XP and leveling system commands',
                    inline: true
                },
                {
                    name: '⚙️ Settings',
                    value: 'Server configuration and setup',
                    inline: true
                }
            )
            .setFooter({
                text: 'Use /help <command> for detailed information about a specific command'
            })
            .setTimestamp();
        
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('Select a command category')
            .addOptions([
                {
                    label: 'Moderation',
                    description: 'Server moderation commands',
                    value: 'moderation',
                    emoji: '🛡️'
                },
                {
                    label: 'Support',
                    description: 'Ticket and support system',
                    value: 'support',
                    emoji: '🎫'
                },
                {
                    label: 'Utility',
                    description: 'Utility and information commands',
                    value: 'utility',
                    emoji: '🔧'
                },
                {
                    label: 'Fun',
                    description: 'Fun and entertainment commands',
                    value: 'fun',
                    emoji: '🎉'
                },
                {
                    label: 'Levels',
                    description: 'XP and leveling commands',
                    value: 'levels',
                    emoji: '🏆'
                },
                {
                    label: 'Settings',
                    description: 'Server configuration commands',
                    value: 'settings',
                    emoji: '⚙️'
                }
            ]);
        
        const row = new ActionRowBuilder().addComponents(selectMenu);
        
        // Add quick action buttons
        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_getting_started')
                    .setLabel('Getting Started')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🚀'),
                new ButtonBuilder()
                    .setCustomId('help_permissions')
                    .setLabel('Permissions Guide')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔐'),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/modubot')
                    .setEmoji('💬')
            );

        await interaction.reply({
            embeds: [embed],
            components: [row, buttonRow],
            ephemeral: true
        });
    },

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused().toLowerCase();

        // Get all available commands
        const allCommands = [];
        Object.values(commandCategories).forEach(category => {
            category.commands.forEach(cmd => {
                allCommands.push(cmd.name);
            });
        });

        // Add new commands that might not be in categories yet
        const additionalCommands = [
            'timeout', 'unban', 'purge', 'warnings', 'leaderboard',
            'serverinfo', 'avatar', 'role', 'tag', 'quote', 'config'
        ];

        allCommands.push(...additionalCommands);

        // Remove duplicates and filter
        const uniqueCommands = [...new Set(allCommands)];
        const filtered = uniqueCommands
            .filter(cmd => cmd.includes(focusedValue))
            .slice(0, 25)
            .map(cmd => ({ name: cmd, value: cmd }));

        await interaction.respond(filtered);
    },
};

// Command categories for the help system
const commandCategories = {
    moderation: {
        title: '🛡️ Moderation Commands',
        description: 'Powerful tools to manage your server and maintain order',
        commands: [
            { name: 'warn', description: 'Issue a warning to a member with automatic escalation' },
            { name: 'warnings', description: 'View, clear, or manage user warnings' },
            { name: 'kick', description: 'Remove a member from the server (they can rejoin)' },
            { name: 'ban', description: 'Permanently ban a member from the server' },
            { name: 'unban', description: 'Remove a ban and allow user to rejoin' },
            { name: 'timeout', description: 'Temporarily mute a member for a specified duration' },
            { name: 'purge', description: 'Bulk delete messages with advanced filtering options' }
        ]
    },
    support: {
        title: '🎫 Support System',
        description: 'Comprehensive ticket system for user support and assistance',
        commands: [
            { name: 'ticket', description: 'Create a private support ticket with categories' }
        ]
    },
    utility: {
        title: '🔧 Utility Commands',
        description: 'Essential tools for server management and information',
        commands: [
            { name: 'help', description: 'Get help with ModuBot commands and features' },
            { name: 'userinfo', description: 'Get detailed information about a user' },
            { name: 'serverinfo', description: 'Get comprehensive server statistics and info' },
            { name: 'avatar', description: 'View and download user avatars in various formats' },
            { name: 'role', description: 'Manage user roles with advanced permissions checking' },
            { name: 'tag', description: 'Create and manage custom server responses and commands' }
        ]
    },
    fun: {
        title: '🎉 Fun & Entertainment',
        description: 'Engaging commands to keep your community entertained',
        commands: [
            { name: '8ball', description: 'Ask the magic 8-ball a question and get a mystical answer' },
            { name: 'poll', description: 'Create interactive polls with multiple options' },
            { name: 'quote', description: 'Get inspirational quotes from various categories' }
        ]
    },
    levels: {
        title: '🏆 Levels & XP System',
        description: 'Gamification features to encourage user engagement',
        commands: [
            { name: 'level', description: 'Check your or another user\'s level and XP progress' },
            { name: 'leaderboard', description: 'View the server XP leaderboard with pagination' }
        ]
    },
    settings: {
        title: '⚙️ Configuration',
        description: 'Setup and configure ModuBot for your server\'s needs',
        commands: [
            { name: 'setup', description: 'Interactive setup wizard with quick and advanced modes' },
            { name: 'config', description: 'Configure all bot settings with detailed options' }
        ]
    }
};

module.exports.commandCategories = commandCategories;
