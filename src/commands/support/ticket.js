const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../utils/database');
const { logger } = require('../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Create a support ticket')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Type of support needed')
                .setRequired(true)
                .addChoices(
                    { name: '🐛 Bug Report', value: 'bug' },
                    { name: '❓ General Support', value: 'general' },
                    { name: '💡 Feature Request', value: 'feature' },
                    { name: '⚠️ Report User', value: 'report' },
                    { name: '🔧 Technical Issue', value: 'technical' },
                    { name: '💰 Billing/Payment', value: 'billing' }
                ))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Brief description of your issue')
                .setRequired(true)
                .setMaxLength(500)),
    
    cooldown: 30, // 30 second cooldown to prevent spam
    
    async execute(interaction) {
        const category = interaction.options.getString('category');
        const description = interaction.options.getString('description');
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        
        try {
            // Check if user already has open tickets
            const existingTickets = await db.all(
                'SELECT * FROM tickets WHERE user_id = ? AND guild_id = ? AND status = "open"',
                [userId, guildId]
            );
            
            const ticketLimit = parseInt(process.env.TICKET_LIMIT_PER_USER) || 3;
            
            if (existingTickets.length >= ticketLimit) {
                return interaction.reply({
                    content: `❌ You already have ${existingTickets.length} open ticket(s). Please close existing tickets before creating new ones.`,
                    ephemeral: true
                });
            }
            
            // Get support category from guild settings
            const guildSettings = await db.get(
                'SELECT support_category FROM guild_settings WHERE guild_id = ?',
                [guildId]
            );
            
            if (!guildSettings || !guildSettings.support_category) {
                return interaction.reply({
                    content: '❌ Support system is not configured. Please ask an administrator to run `/setup` first.',
                    ephemeral: true
                });
            }
            
            const supportCategory = interaction.guild.channels.cache.get(guildSettings.support_category);
            
            if (!supportCategory) {
                return interaction.reply({
                    content: '❌ Support category not found. Please ask an administrator to reconfigure the support system.',
                    ephemeral: true
                });
            }
            
            await interaction.deferReply({ ephemeral: true });
            
            // Create ticket channel
            const ticketNumber = Date.now().toString().slice(-6); // Last 6 digits of timestamp
            const channelName = `ticket-${category}-${ticketNumber}`;
            
            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: supportCategory.id,
                topic: `Support ticket for ${interaction.user.tag} | Category: ${category}`,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles
                        ]
                    },
                    {
                        id: interaction.client.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageMessages
                        ]
                    }
                ]
            });
            
            // Add staff roles to ticket if they exist
            const staffRoles = ['Support', 'Staff', 'Moderator', 'Admin', 'Administrator'];
            for (const roleName of staffRoles) {
                const role = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase()));
                if (role) {
                    await ticketChannel.permissionOverwrites.create(role, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                        ManageMessages: true
                    });
                }
            }
            
            // Save ticket to database
            await db.run(
                'INSERT INTO tickets (channel_id, user_id, guild_id, category, status) VALUES (?, ?, ?, ?, ?)',
                [ticketChannel.id, userId, guildId, category, 'open']
            );
            
            // Create ticket embed
            const categoryEmojis = {
                bug: '🐛',
                general: '❓',
                feature: '💡',
                report: '⚠️',
                technical: '🔧',
                billing: '💰'
            };
            
            const ticketEmbed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle(`${categoryEmojis[category]} Support Ticket #${ticketNumber}`)
                .setDescription(`**Category:** ${category.charAt(0).toUpperCase() + category.slice(1)}\n**Description:** ${description}`)
                .addFields(
                    { name: 'Created by', value: `${interaction.user}`, inline: true },
                    { name: 'Created at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Support staff will be with you shortly!' })
                .setTimestamp();
            
            // Create control buttons
            const controlRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('ticket_close')
                        .setLabel('Close Ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒'),
                    new ButtonBuilder()
                        .setCustomId('ticket_claim')
                        .setLabel('Claim Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('✋'),
                    new ButtonBuilder()
                        .setCustomId('ticket_transcript')
                        .setLabel('Generate Transcript')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📄')
                );
            
            // Send initial message in ticket channel
            await ticketChannel.send({
                content: `${interaction.user} Welcome to your support ticket!\n\nPlease provide as much detail as possible about your issue. A staff member will assist you shortly.`,
                embeds: [ticketEmbed],
                components: [controlRow]
            });
            
            // Send confirmation to user
            await interaction.editReply({
                content: `✅ Ticket created successfully! Please check ${ticketChannel} for your support ticket.`
            });
            
            logger.info(`${interaction.user.tag} created a ${category} ticket in ${interaction.guild.name}`);
            
        } catch (error) {
            logger.error('Error creating ticket:', error);
            
            const errorMessage = '❌ An error occurred while creating your ticket. Please try again or contact an administrator.';
            
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};
