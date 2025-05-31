const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get a user\'s avatar')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to get avatar for')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('size')
                .setDescription('Avatar size')
                .setRequired(false)
                .addChoices(
                    { name: '64x64', value: '64' },
                    { name: '128x128', value: '128' },
                    { name: '256x256', value: '256' },
                    { name: '512x512', value: '512' },
                    { name: '1024x1024', value: '1024' },
                    { name: '2048x2048', value: '2048' },
                    { name: '4096x4096', value: '4096' }
                )),
    
    cooldown: 3,
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const size = parseInt(interaction.options.getString('size')) || 1024;
        const member = interaction.guild.members.cache.get(targetUser.id);
        
        try {
            // Get different avatar URLs
            const globalAvatar = targetUser.displayAvatarURL({ 
                dynamic: true, 
                size: size,
                format: 'png'
            });
            
            const globalAvatarWebp = targetUser.displayAvatarURL({ 
                dynamic: true, 
                size: size,
                format: 'webp'
            });
            
            const globalAvatarJpg = targetUser.displayAvatarURL({ 
                dynamic: true, 
                size: size,
                format: 'jpg'
            });
            
            // Server-specific avatar (if different)
            let serverAvatar = null;
            if (member && member.avatar) {
                serverAvatar = member.displayAvatarURL({ 
                    dynamic: true, 
                    size: size,
                    format: 'png'
                });
            }
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor(member?.displayHexColor || 0x0099ff)
                .setTitle(`🖼️ ${targetUser.tag}'s Avatar`)
                .setImage(serverAvatar || globalAvatar)
                .addFields(
                    { name: 'User', value: `${targetUser}`, inline: true },
                    { name: 'Size', value: `${size}x${size}`, inline: true },
                    { name: 'Type', value: serverAvatar ? 'Server Avatar' : 'Global Avatar', inline: true }
                )
                .setTimestamp();
            
            // Add user ID
            embed.addFields({ name: 'User ID', value: targetUser.id, inline: true });
            
            // Add avatar hash info
            const avatarHash = targetUser.avatar;
            if (avatarHash) {
                const isAnimated = avatarHash.startsWith('a_');
                embed.addFields({ 
                    name: 'Animated', 
                    value: isAnimated ? 'Yes' : 'No', 
                    inline: true 
                });
            }
            
            // Create download buttons
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('PNG')
                        .setStyle(ButtonStyle.Link)
                        .setURL(globalAvatar)
                        .setEmoji('🖼️'),
                    new ButtonBuilder()
                        .setLabel('WebP')
                        .setStyle(ButtonStyle.Link)
                        .setURL(globalAvatarWebp)
                        .setEmoji('🌐'),
                    new ButtonBuilder()
                        .setLabel('JPG')
                        .setStyle(ButtonStyle.Link)
                        .setURL(globalAvatarJpg)
                        .setEmoji('📷')
                );
            
            const components = [row1];
            
            // Add server avatar button if different
            if (serverAvatar && serverAvatar !== globalAvatar) {
                const row2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`avatar_switch_${targetUser.id}`)
                            .setLabel('Switch to Global Avatar')
                            .setStyle(ButtonStyle.Secondary)
                            .setEmoji('🔄'),
                        new ButtonBuilder()
                            .setLabel('Server Avatar')
                            .setStyle(ButtonStyle.Link)
                            .setURL(serverAvatar)
                            .setEmoji('🏠')
                    );
                components.push(row2);
                
                embed.setFooter({ 
                    text: 'This user has a different avatar in this server. Click the button to switch views.' 
                });
            }
            
            // Add banner if user has one
            if (targetUser.bannerURL()) {
                embed.addFields({
                    name: '🎨 User Banner',
                    value: `[View Banner](${targetUser.bannerURL({ dynamic: true, size: 1024 })})`,
                    inline: true
                });
            }
            
            await interaction.reply({ 
                embeds: [embed], 
                components: components 
            });
            
        } catch (error) {
            console.error('Error in avatar command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching the avatar.',
                ephemeral: true
            });
        }
    },
};
