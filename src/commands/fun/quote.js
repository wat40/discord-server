const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quote')
        .setDescription('Get an inspirational quote')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Quote category')
                .setRequired(false)
                .addChoices(
                    { name: '💪 Motivational', value: 'motivational' },
                    { name: '💡 Inspirational', value: 'inspirational' },
                    { name: '😄 Funny', value: 'funny' },
                    { name: '💖 Love', value: 'love' },
                    { name: '🧠 Wisdom', value: 'wisdom' },
                    { name: '💼 Success', value: 'success' },
                    { name: '🌟 Life', value: 'life' },
                    { name: '🎲 Random', value: 'random' }
                )),
    
    cooldown: 5,
    
    async execute(interaction) {
        const category = interaction.options.getString('category') || 'random';
        
        try {
            const quote = getQuote(category);
            
            const embed = new EmbedBuilder()
                .setColor(getCategoryColor(category))
                .setTitle(`${getCategoryEmoji(category)} ${getCategoryName(category)} Quote`)
                .setDescription(`*"${quote.text}"*`)
                .addFields(
                    { name: 'Author', value: quote.author, inline: true },
                    { name: 'Category', value: getCategoryName(category), inline: true }
                )
                .setFooter({ text: 'Click the button below for another quote!' })
                .setTimestamp();
            
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`quote_new_${category}`)
                        .setLabel('New Quote')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🔄'),
                    new ButtonBuilder()
                        .setCustomId('quote_random')
                        .setLabel('Random Category')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('🎲'),
                    new ButtonBuilder()
                        .setCustomId(`quote_share_${encodeURIComponent(quote.text)}_${encodeURIComponent(quote.author)}`)
                        .setLabel('Share Quote')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('📤')
                );
            
            await interaction.reply({ embeds: [embed], components: [row] });
            
        } catch (error) {
            console.error('Error in quote command:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching a quote.',
                ephemeral: true
            });
        }
    },
};

function getQuote(category) {
    const quotes = {
        motivational: [
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
            { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
            { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
            { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
            { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
            { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
            { text: "You learn more from failure than from success.", author: "Unknown" },
            { text: "If you are working on something exciting that you really care about, you don't have to be pushed.", author: "Steve Jobs" }
        ],
        inspirational: [
            { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
            { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
            { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
            { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
            { text: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau" },
            { text: "When you have a dream, you've got to grab it and never let go.", author: "Carol Burnett" },
            { text: "Nothing is impossible. The word itself says 'I'm possible!'", author: "Audrey Hepburn" },
            { text: "There is nothing impossible to they who will try.", author: "Alexander the Great" },
            { text: "The bad news is time flies. The good news is you're the pilot.", author: "Michael Altshuler" },
            { text: "Life has got all those twists and turns. You've got to hold on tight and off you go.", author: "Nicole Kidman" }
        ],
        funny: [
            { text: "I'm not superstitious, but I am a little stitious.", author: "Michael Scott" },
            { text: "The trouble with having an open mind is that people keep coming along and sticking things into it.", author: "Terry Pratchett" },
            { text: "I haven't failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
            { text: "The only way to stay sane is to go a little crazy.", author: "Susanna Kaysen" },
            { text: "I'm not arguing, I'm just explaining why I'm right.", author: "Unknown" },
            { text: "Common sense is like deodorant. The people who need it most never use it.", author: "Unknown" },
            { text: "I told my wife she was drawing her eyebrows too high. She looked surprised.", author: "Unknown" },
            { text: "Why don't scientists trust atoms? Because they make up everything!", author: "Unknown" },
            { text: "I'm reading a book about anti-gravity. It's impossible to put down!", author: "Unknown" },
            { text: "The early bird might get the worm, but the second mouse gets the cheese.", author: "Unknown" }
        ],
        love: [
            { text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", author: "Lao Tzu" },
            { text: "The best thing to hold onto in life is each other.", author: "Audrey Hepburn" },
            { text: "Love is composed of a single soul inhabiting two bodies.", author: "Aristotle" },
            { text: "Where there is love there is life.", author: "Mahatma Gandhi" },
            { text: "You know you're in love when you can't fall asleep because reality is finally better than your dreams.", author: "Dr. Seuss" },
            { text: "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.", author: "Unknown" },
            { text: "The greatest happiness of life is the conviction that we are loved.", author: "Victor Hugo" },
            { text: "Love recognizes no barriers. It jumps hurdles, leaps fences, penetrates walls to arrive at its destination full of hope.", author: "Maya Angelou" },
            { text: "To love and be loved is to feel the sun from both sides.", author: "David Viscott" },
            { text: "Love is when the other person's happiness is more important than your own.", author: "H. Jackson Brown Jr." }
        ],
        wisdom: [
            { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
            { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
            { text: "Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.", author: "Bill Keane" },
            { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
            { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein" },
            { text: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
            { text: "Be who you are and say what you feel, because those who mind don't matter, and those who matter don't mind.", author: "Bernard M. Baruch" },
            { text: "You've gotta dance like there's nobody watching, love like you'll never be hurt, sing like there's nobody listening, and live like it's heaven on earth.", author: "William W. Purkey" },
            { text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost" },
            { text: "If you want to know what a man's like, take a good look at how he treats his inferiors, not his equals.", author: "J.K. Rowling" }
        ],
        success: [
            { text: "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.", author: "Albert Schweitzer" },
            { text: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
            { text: "The way to achieve your own success is to be willing to help somebody else get it first.", author: "Iyanla Vanzant" },
            { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
            { text: "The difference between successful people and really successful people is that really successful people say no to almost everything.", author: "Warren Buffett" },
            { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
            { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
            { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
            { text: "Success is going from failure to failure without losing your enthusiasm.", author: "Winston Churchill" },
            { text: "The road to success and the road to failure are almost exactly the same.", author: "Colin R. Davis" }
        ],
        life: [
            { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
            { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
            { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
            { text: "The biggest adventure you can take is to live the life of your dreams.", author: "Oprah Winfrey" },
            { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
            { text: "In the end, we will remember not the words of our enemies, but the silence of our friends.", author: "Martin Luther King Jr." },
            { text: "Life is a succession of lessons which must be lived to be understood.", author: "Helen Keller" },
            { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
            { text: "Life isn't about finding yourself. Life is about creating yourself.", author: "George Bernard Shaw" },
            { text: "The good life is one inspired by love and guided by knowledge.", author: "Bertrand Russell" }
        ]
    };
    
    let selectedCategory = category;
    if (category === 'random') {
        const categories = Object.keys(quotes);
        selectedCategory = categories[Math.floor(Math.random() * categories.length)];
    }
    
    const categoryQuotes = quotes[selectedCategory] || quotes.motivational;
    return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
}

function getCategoryColor(category) {
    const colors = {
        motivational: 0xff6b6b,
        inspirational: 0x4ecdc4,
        funny: 0xffe66d,
        love: 0xff8a80,
        wisdom: 0x9c88ff,
        success: 0x69f0ae,
        life: 0x64b5f6,
        random: 0x81c784
    };
    return colors[category] || colors.random;
}

function getCategoryEmoji(category) {
    const emojis = {
        motivational: '💪',
        inspirational: '💡',
        funny: '😄',
        love: '💖',
        wisdom: '🧠',
        success: '💼',
        life: '🌟',
        random: '🎲'
    };
    return emojis[category] || emojis.random;
}

function getCategoryName(category) {
    const names = {
        motivational: 'Motivational',
        inspirational: 'Inspirational',
        funny: 'Funny',
        love: 'Love',
        wisdom: 'Wisdom',
        success: 'Success',
        life: 'Life',
        random: 'Random'
    };
    return names[category] || names.random;
}
