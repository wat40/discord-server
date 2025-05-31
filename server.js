const express = require('express');
const session = require('express-session');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://cdn.discordapp.com", "https://images.unsplash.com"]
        }
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: 'https://roasted-gossamer-pike.glitch.me',
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'watispro1',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Discord OAuth2 Strategy
passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: 'https://roasted-gossamer-pike.glitch.me/auth/discord/callback',
    scope: ['identify', 'guilds']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const user = {
            id: profile.id,
            username: profile.username,
            discriminator: profile.discriminator,
            avatar: profile.avatar,
            guilds: profile.guilds || []
        };
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Static files
app.use(express.static('public'));

// Authentication middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/discord');
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/dashboard.html');
    }
);

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
});

// Dashboard routes
app.get('/dashboard', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/dashboard.html', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/server/:guildId', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'server.html'));
});

app.get('/server.html', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'server.html'));
});

// API routes
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.get('/api/server/:guildId/stats', ensureAuthenticated, async (req, res) => {
    try {
        const guildId = req.params.guildId;
        
        // Mock server statistics for demonstration
        const stats = {
            memberJoins: [
                { date: '2024-01-01', joins: 5 },
                { date: '2024-01-02', joins: 8 },
                { date: '2024-01-03', joins: 3 },
                { date: '2024-01-04', joins: 12 },
                { date: '2024-01-05', joins: 7 },
                { date: '2024-01-06', joins: 9 },
                { date: '2024-01-07', joins: 6 }
            ],
            verifications: [
                { date: '2024-01-01', verifications: 4 },
                { date: '2024-01-02', verifications: 6 },
                { date: '2024-01-03', verifications: 2 },
                { date: '2024-01-04', verifications: 10 },
                { date: '2024-01-05', verifications: 5 },
                { date: '2024-01-06', verifications: 7 },
                { date: '2024-01-07', verifications: 4 }
            ],
            totalMembers: Math.floor(Math.random() * 1000) + 100,
            onlineMembers: Math.floor(Math.random() * 100) + 10,
            verifiedToday: Math.floor(Math.random() * 20) + 1,
            moderationActions: Math.floor(Math.random() * 10)
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Stats API error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Error handling
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 ModuBot Dashboard running on port ${PORT}`);
    console.log(`📊 Dashboard URL: https://roasted-gossamer-pike.glitch.me`);
});

module.exports = app;
