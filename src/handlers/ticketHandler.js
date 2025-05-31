const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { db } = require('../utils/database');
const { logger } = require('../utils/logger');

class TicketHandler {
    static async handleButtonInteraction(interaction) {
        const customId = interaction.customId;
        
        if (customId === 'ticket_close') {
            await this.closeTicket(interaction);
        } else if (customId === 'ticket_claim') {
            await this.claimTicket(interaction);
        } else if (customId === 'ticket_transcript') {
            await this.generateTranscript(interaction);
        }
    }
    
    static async closeTicket(interaction) {
        try {
            // Check if this is a ticket channel
            const ticket = await db.get(
                'SELECT * FROM tickets WHERE channel_id = ? AND status = "open"',
                [interaction.channel.id]
            );
            
            if (!ticket) {
                return interaction.reply({
                    content: '❌ This is not an active ticket channel.',
                    ephemeral: true
                });
            }
            
            // Check permissions (ticket creator or staff)
            const isTicketCreator = ticket.user_id === interaction.user.id;
            const hasStaffPermissions = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);
            
            if (!isTicketCreator && !hasStaffPermissions) {
                return interaction.reply({
                    content: '❌ You do not have permission to close this ticket.',
                    ephemeral: true
                });
            }
            
            await interaction.deferReply();
            
            // Generate transcript before closing
            const transcript = await this.createTranscript(interaction.channel);
            
            // Update ticket status in database
            await db.run(
                'UPDATE tickets SET status = "closed", closed_at = ? WHERE channel_id = ?',
                [new Date().toISOString(), interaction.channel.id]
            );
            
            // Send closing message
            const closeEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('🔒 Ticket Closed')
                .setDescription('This ticket has been closed and will be deleted in 10 seconds.')
                .addFields(
                    { name: 'Closed by', value: interaction.user.toString(), inline: true },
                    { name: 'Closed at', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [closeEmbed] });
            
            // Send transcript to ticket creator if possible
            try {
                const ticketCreator = await interaction.client.users.fetch(ticket.user_id);
                const transcriptEmbed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('📄 Ticket Transcript')
                    .setDescription(`Your ticket in **${interaction.guild.name}** has been closed.`)
                    .addFields(
                        { name: 'Ticket Category', value: ticket.category, inline: true },
                        { name: 'Closed by', value: interaction.user.tag, inline: true }
                    )
                    .setTimestamp();
                
                await ticketCreator.send({
                    embeds: [transcriptEmbed],
                    files: [{
                        attachment: Buffer.from(transcript, 'utf-8'),
                        name: `ticket-${ticket.id}-transcript.txt`
                    }]
                });
            } catch (error) {
                logger.warn(`Could not send transcript to user ${ticket.user_id}`);
            }
            
            // Delete channel after delay
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (error) {
                    logger.error('Error deleting ticket channel:', error);
                }
            }, 10000);
            
            logger.info(`Ticket ${ticket.id} closed by ${interaction.user.tag} in ${interaction.guild.name}`);
            
        } catch (error) {
            logger.error('Error closing ticket:', error);
            
            const errorMessage = '❌ An error occurred while closing the ticket.';
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
    
    static async claimTicket(interaction) {
        try {
            // Check if user has staff permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({
                    content: '❌ You do not have permission to claim tickets.',
                    ephemeral: true
                });
            }
            
            const claimEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('✋ Ticket Claimed')
                .setDescription(`This ticket has been claimed by ${interaction.user}`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [claimEmbed] });
            
            // Pin the claim message
            const claimMessage = await interaction.fetchReply();
            await claimMessage.pin();
            
            logger.info(`Ticket claimed by ${interaction.user.tag} in ${interaction.guild.name}`);
            
        } catch (error) {
            logger.error('Error claiming ticket:', error);
            await interaction.reply({
                content: '❌ An error occurred while claiming the ticket.',
                ephemeral: true
            });
        }
    }
    
    static async generateTranscript(interaction) {
        try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({
                    content: '❌ You do not have permission to generate transcripts.',
                    ephemeral: true
                });
            }
            
            await interaction.deferReply({ ephemeral: true });
            
            const transcript = await this.createTranscript(interaction.channel);
            
            await interaction.editReply({
                content: '📄 Ticket transcript generated!',
                files: [{
                    attachment: Buffer.from(transcript, 'utf-8'),
                    name: `transcript-${interaction.channel.name}-${Date.now()}.txt`
                }]
            });
            
        } catch (error) {
            logger.error('Error generating transcript:', error);
            
            const errorMessage = '❌ An error occurred while generating the transcript.';
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    }
    
    static async createTranscript(channel) {
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
            
            let transcript = `Ticket Transcript for #${channel.name}\n`;
            transcript += `Generated on: ${new Date().toISOString()}\n`;
            transcript += `Channel ID: ${channel.id}\n`;
            transcript += `Guild: ${channel.guild.name}\n`;
            transcript += '='.repeat(50) + '\n\n';
            
            for (const message of sortedMessages.values()) {
                const timestamp = new Date(message.createdTimestamp).toISOString();
                transcript += `[${timestamp}] ${message.author.tag} (${message.author.id})\n`;
                
                if (message.content) {
                    transcript += `${message.content}\n`;
                }
                
                if (message.attachments.size > 0) {
                    transcript += `Attachments: ${message.attachments.map(a => a.url).join(', ')}\n`;
                }
                
                if (message.embeds.length > 0) {
                    transcript += `Embeds: ${message.embeds.length} embed(s)\n`;
                }
                
                transcript += '\n';
            }
            
            return transcript;
            
        } catch (error) {
            logger.error('Error creating transcript:', error);
            return 'Error generating transcript.';
        }
    }
}

module.exports = TicketHandler;
