const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { db } = require('../../utils/database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Get detailed information about the server'),
    
    cooldown: 5,
    
    async execute(interaction) {
        const guild = interaction.guild;
        
        try {
            // Fetch additional guild data
            await guild.fetch();
            
            // Get member counts
            const totalMembers = guild.memberCount;
            const onlineMembers = guild.members.cache.filter(member => 
                member.presence?.status === 'online' || 
                member.presence?.status === 'idle' || 
                member.presence?.status === 'dnd'
            ).size;
            const botCount = guild.members.cache.filter(member => member.user.bot).size;
            const humanCount = totalMembers - botCount;
            
            // Get channel counts
            const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
            const categories = guild.channels.cache.filter(channel => channel.type === 4).size;
            const totalChannels = guild.channels.cache.size;
            
            // Get role count (excluding @everyone)
            const roleCount = guild.roles.cache.size - 1;
            
            // Get emoji count
            const emojiCount = guild.emojis.cache.size;
            const animatedEmojis = guild.emojis.cache.filter(emoji => emoji.animated).size;
            const staticEmojis = emojiCount - animatedEmojis;
            
            // Get boost information
            const boostLevel = guild.premiumTier;
            const boostCount = guild.premiumSubscriptionCount || 0;
            
            // Get verification level
            const verificationLevels = {
                0: 'None',
                1: 'Low',
                2: 'Medium',
                3: 'High',
                4: 'Very High'
            };
            
            // Get explicit content filter
            const contentFilters = {
                0: 'Disabled',
                1: 'Members without roles',
                2: 'All members'
            };
            
            // Get server features
            const features = guild.features.map(feature => {
                return feature.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            });
            
            // Calculate server age
            const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
            
            // Get owner
            const owner = await guild.fetchOwner();
            
            // Get ModuBot statistics
            const totalWarnings = await db.get(
                'SELECT COUNT(*) as count FROM warnings WHERE guild_id = ?',
                [guild.id]
            );
            
            const totalTickets = await db.get(
                'SELECT COUNT(*) as count FROM tickets WHERE guild_id = ?',
                [guild.id]
            );
            
            const activeUsers = await db.get(
                'SELECT COUNT(*) as count FROM user_levels WHERE guild_id = ? AND xp > 0',
                [guild.id]
            );
            
            // Create main embed
            const embed = new EmbedBuilder()
                .setColor(guild.members.me.displayHexColor || 0x0099ff)
                .setTitle(`🏰 ${guild.name}`)
                .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
                .addFields(
                    {
                        name: '📊 General Information',
                        value: [
                            `**Server ID:** ${guild.id}`,
                            `**Owner:** ${owner.user.tag}`,
                            `**Created:** <t:${createdTimestamp}:F>`,
                            `**Region:** ${guild.preferredLocale || 'Unknown'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '👥 Members',
                        value: [
                            `**Total:** ${totalMembers.toLocaleString()}`,
                            `**Humans:** ${humanCount.toLocaleString()}`,
                            `**Bots:** ${botCount.toLocaleString()}`,
                            `**Online:** ${onlineMembers.toLocaleString()}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '📺 Channels',
                        value: [
                            `**Total:** ${totalChannels}`,
                            `**Text:** ${textChannels}`,
                            `**Voice:** ${voiceChannels}`,
                            `**Categories:** ${categories}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🎭 Server Stats',
                        value: [
                            `**Roles:** ${roleCount}`,
                            `**Emojis:** ${emojiCount} (${staticEmojis} static, ${animatedEmojis} animated)`,
                            `**Boost Level:** ${boostLevel}`,
                            `**Boosts:** ${boostCount}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🛡️ Security',
                        value: [
                            `**Verification:** ${verificationLevels[guild.verificationLevel]}`,
                            `**Content Filter:** ${contentFilters[guild.explicitContentFilter]}`,
                            `**2FA Required:** ${guild.mfaLevel === 1 ? 'Yes' : 'No'}`
                        ].join('\n'),
                        inline: true
                    },
                    {
                        name: '🤖 ModuBot Stats',
                        value: [
                            `**Total Warnings:** ${totalWarnings?.count || 0}`,
                            `**Total Tickets:** ${totalTickets?.count || 0}`,
                            `**Active Users:** ${activeUsers?.count || 0}`
                        ].join('\n'),
                        inline: true
                    }
                )
                .setTimestamp();
            
            // Add server banner if available
            if (guild.bannerURL()) {
                embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
            }
            
            // Add features if any
            if (features.length > 0) {
                const featureList = features.slice(0, 10).join(', '); // Limit to 10 features
                embed.addFields({
                    name: '✨ Server Features',
                    value: featureList + (features.length > 10 ? ` and ${features.length - 10} more...` : ''),
                    inline: false
                });
            }
            
            // Add vanity URL if available
            if (guild.vanityURLCode) {
                embed.addFields({
                    name: '🔗 Vanity URL',
                    value: `discord.gg/${guild.vanityURLCode}`,
                    inline: true
                });
            }
            
            // Add description if available
            if (guild.description) {
                embed.setDescription(guild.description);
            }
            
            await interaction.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in serverinfo command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching server information.',
                ephemeral: true
            });
        }
    },
};
