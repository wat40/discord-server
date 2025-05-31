# ModuBot - Discord Community & Support Bot

A comprehensive Discord bot designed for large community and support servers, featuring moderation tools, ticket system, XP/leveling, and extensive customization options.

## 🌟 Features

### 🛡️ Moderation
- **User Management**: Kick, ban, timeout, and warn members
- **Message Management**: Bulk delete, slowmode, channel lockdown
- **Warning System**: Progressive punishment with configurable limits
- **Moderation Logging**: Comprehensive action logging

### 🎫 Support System
- **Ticket Creation**: Multi-category support tickets
- **Ticket Management**: Claim, close, and transcript generation
- **Staff Tools**: Add/remove users, ticket categories
- **Auto-cleanup**: Automatic ticket archival

### 🏆 Engagement
- **XP/Level System**: Reward active participation
- **Polls**: Interactive community polls
- **Custom Commands**: Server-specific responses
- **Activity Tracking**: Member engagement metrics

### 🔧 Utility
- **User Information**: Detailed user and server info
- **Reminders**: Personal reminder system
- **Weather**: Weather information lookup
- **Translation**: Multi-language support

### ⚙️ Administration
- **Easy Setup**: One-command server configuration
- **Permission Management**: Role-based access control
- **Database Integration**: Persistent data storage
- **Backup Systems**: Data protection and recovery

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0.0 or higher
- Discord Bot Token
- Basic command line knowledge

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd modubot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your bot token and settings
   ```

4. **Deploy commands**
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

### Discord Setup

1. **Create Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create new application named "ModuBot"
   - Navigate to Bot section and create bot
   - Copy token to `.env` file

2. **Bot Permissions**
   Required permissions:
   - Manage Channels
   - Manage Roles
   - Kick Members
   - Ban Members
   - Moderate Members
   - Manage Messages
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Attach Files

3. **Invite Bot**
   - Use OAuth2 URL Generator in Developer Portal
   - Select bot scope and required permissions
   - Invite to your server

4. **Initial Configuration**
   ```
   /setup
   ```

## 📖 Commands

### Moderation Commands
- `/kick` - Kick a member from the server
- `/ban` - Ban a member from the server
- `/warn` - Warn a member
- `/timeout` - Timeout a member
- `/purge` - Bulk delete messages

### Support Commands
- `/ticket` - Create a support ticket
- `/close-ticket` - Close a support ticket
- `/add-user` - Add user to ticket
- `/remove-user` - Remove user from ticket

### Utility Commands
- `/userinfo` - Get user information
- `/serverinfo` - Get server information
- `/help` - Show help information
- `/poll` - Create a poll
- `/remind` - Set a reminder

### Settings Commands
- `/setup` - Initial bot setup
- `/config` - Configure bot settings

## 🗂️ Project Structure

```
modubot/
├── src/
│   ├── commands/           # Slash commands
│   │   ├── moderation/     # Moderation commands
│   │   ├── support/        # Support system commands
│   │   ├── utility/        # Utility commands
│   │   ├── fun/           # Entertainment commands
│   │   └── settings/      # Configuration commands
│   ├── events/            # Discord.js event handlers
│   ├── handlers/          # Custom interaction handlers
│   ├── utils/             # Utility functions
│   │   ├── database.js    # Database operations
│   │   └── logger.js      # Logging system
│   └── index.js           # Main bot file
├── data/                  # Database files
├── logs/                  # Log files
├── .env.example          # Environment template
├── package.json          # Dependencies
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
GUILD_ID=your_server_id
DATABASE_PATH=./data/modubot.db
PREFIX=!
MAX_WARNINGS=3
XP_PER_MESSAGE=5
```

### Database
ModuBot uses SQLite for data storage:
- User levels and XP
- Warnings and moderation history
- Support tickets
- Server settings
- Custom tags and responses

## 🛠️ Development

### Adding Commands
1. Create command file in appropriate category folder
2. Follow the command template structure
3. Export data and execute properties
4. Redeploy commands with `npm run deploy`

### Custom Handlers
- Button interactions: `src/handlers/`
- Select menu interactions: Event handlers
- Modal submissions: Custom handlers

### Database Operations
Use the database helper functions:
```javascript
const { db } = require('../utils/database');

// Insert data
await db.run('INSERT INTO table (column) VALUES (?)', [value]);

// Get single row
const row = await db.get('SELECT * FROM table WHERE id = ?', [id]);

// Get multiple rows
const rows = await db.all('SELECT * FROM table');
```

## 📊 Monitoring

### Logging
- Console output with color coding
- File logging with rotation
- Error tracking and reporting
- Performance monitoring

### Database Maintenance
- Regular backups recommended
- Monitor database size
- Clean up old data periodically

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Submit pull request with description

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in `context.md`
- Use `/help` command in Discord
- Create an issue on GitHub
- Join our support server

## 🙏 Acknowledgments

- Discord.js community for excellent documentation
- SQLite for reliable database functionality
- Node.js ecosystem for powerful tools

---

**ModuBot** - Empowering Discord communities with professional moderation and support tools.
