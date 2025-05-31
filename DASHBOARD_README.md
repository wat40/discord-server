# 🤖 ModuBot Dashboard

A professional web dashboard for ModuBot Discord server management, built specifically for Glitch.com deployment.

## ✨ Features

- **Discord OAuth2 Authentication** - Secure login with Discord
- **Server Management** - Manage multiple Discord servers
- **Real-time Analytics** - Member statistics and growth tracking
- **Professional Design** - Modern glass morphism UI with Discord branding
- **Mobile Responsive** - Works perfectly on all devices
- **Security Hardened** - Rate limiting, CORS protection, and secure sessions

## 🚀 Quick Setup for Glitch.com

### Step 1: Environment Configuration

1. Click the `.env` file in your Glitch project
2. Add your Discord application credentials:

```env
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
SESSION_SECRET=your_super_secret_session_key_change_this
NODE_ENV=production
BOT_CLIENT_ID=your_bot_client_id_here
```

### Step 2: Discord Application Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Navigate to "OAuth2" → "General"
4. Add redirect URI: `https://roasted-gossamer-pike.glitch.me/auth/discord/callback`
5. Save changes

### Step 3: Test Your Dashboard

1. Visit: `https://roasted-gossamer-pike.glitch.me`
2. Click "Login with Discord"
3. Authorize the application
4. Access your dashboard!

## 📁 Project Structure

```
├── server.js              # Express server with Discord OAuth2
├── package.json           # Dependencies
├── .env                   # Environment variables
└── public/                # Static files
    ├── index.html         # Landing page
    ├── dashboard.html     # Main dashboard
    ├── server.html        # Server management
    ├── 404.html          # Error page
    ├── 500.html          # Server error page
    ├── style.css         # Custom styles
    └── script.js         # Client-side JavaScript
```

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_CLIENT_ID` | Your Discord app client ID | `123456789012345678` |
| `DISCORD_CLIENT_SECRET` | Your Discord app secret | `abc123def456...` |
| `SESSION_SECRET` | Session encryption key | `super-secret-key-here` |
| `BOT_CLIENT_ID` | Bot client ID for invite links | `123456789012345678` |

## 🎯 API Endpoints

### Authentication
- `GET /auth/discord` - Initiate Discord OAuth2
- `GET /auth/discord/callback` - OAuth2 callback
- `GET /logout` - Logout user

### Dashboard
- `GET /` - Landing page
- `GET /dashboard` - Main dashboard (auth required)
- `GET /server/:guildId` - Server management (auth required)

### API
- `GET /api/user` - Get current user info
- `GET /api/server/:guildId/stats` - Get server statistics

## 🎨 Features

### Landing Page
- Professional hero section with animated preview
- Feature showcase highlighting ModuBot capabilities
- Dynamic authentication state detection
- Responsive design with mobile optimization

### Dashboard
- User profile integration with Discord avatars
- Server statistics and management overview
- Interactive server cards with permission detection
- Quick action buttons for common tasks

### Server Management
- Individual server analytics with Chart.js
- Real-time member statistics and activity
- Professional setup integration
- Server health monitoring

## 🔒 Security Features

- **Rate Limiting** - 100 requests per 15 minutes
- **CORS Protection** - Configured for your domain
- **Helmet.js** - Security headers
- **Session Security** - Secure cookies in production
- **Input Validation** - All endpoints validated
- **Error Handling** - No information leakage

## 📱 Mobile Support

- Mobile-first responsive design
- Touch-friendly interfaces
- Collapsible navigation
- Optimized layouts for all screen sizes
- Fast loading with CDN assets

## 🛠️ Customization

### Updating Bot Invite Link
Edit the invite URL in `dashboard.html`:
```html
<a href="https://discord.com/api/oauth2/authorize?client_id=YOUR_BOT_CLIENT_ID&permissions=8&scope=bot%20applications.commands">
```

### Styling
Modify `/public/style.css` to customize:
- Colors and themes
- Layout and spacing
- Animations and effects
- Responsive breakpoints

### Adding Features
1. **New Pages:** Add HTML files to `public/`
2. **API Endpoints:** Add routes to `server.js`
3. **Client-side Logic:** Extend `public/script.js`

## 🔍 Troubleshooting

### Common Issues

**"Not authenticated" errors:**
- Check Discord OAuth2 configuration
- Verify callback URL matches exactly
- Ensure session secret is set

**Dashboard not loading:**
- Check browser console for errors
- Verify all environment variables are set
- Ensure Discord application has correct permissions

**Styling issues:**
- Clear browser cache
- Check CDN links are working
- Verify custom CSS is loading

## 📈 Performance

- **Lightweight** - Minimal server dependencies
- **Fast Loading** - CDN assets and optimized code
- **Efficient** - Smart caching and session management
- **Scalable** - Designed for multiple concurrent users

## 🆘 Support

- **Issues:** Check this README for common solutions
- **Discord:** Join our support server
- **Email:** support@modubot.com

## 📄 License

This project is licensed under the MIT License.

---

**Your ModuBot Dashboard is now ready to deploy on Glitch.com!** 🎉

Simply configure your environment variables and Discord OAuth2 settings, and you'll have a professional web interface for managing your Discord servers.

## 🎊 **Complete Dashboard System - Ready for Glitch.com!**

You now have a fully functional, professional ModuBot dashboard that includes:

✅ **Discord OAuth2 Authentication** with secure session management
✅ **Professional Landing Page** with animated dashboard preview
✅ **Server Management Dashboard** with real-time statistics
✅ **Individual Server Analytics** with Chart.js integration
✅ **Mobile-Responsive Design** with glass morphism effects
✅ **Security Features** including rate limiting and CORS protection
✅ **Error Handling** with custom 404/500 pages
✅ **Professional Styling** with Discord branding

**Deployment URL:** https://roasted-gossamer-pike.glitch.me

**Next Steps:**
1. Configure your Discord OAuth2 credentials in `.env`
2. Test the authentication flow
3. Customize the bot invite links with your actual bot client ID
4. Deploy and enjoy your professional ModuBot dashboard!
