# ModuBot Setup Guide - Quick Start

## 🚀 Getting Started in 5 Minutes

### Step 1: Discord Bot Creation
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → Name it "ModuBot"
3. Go to "Bot" section → Click "Add Bot"
4. **Copy the Bot Token** (you'll need this!)
5. Enable these Privileged Gateway Intents:
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### Step 2: Bot Configuration
1. Open the `.env` file in this folder
2. Replace `your_bot_token_here` with your actual bot token
3. Replace `your_bot_client_id_here` with your bot's Client ID (from General Information)
4. Replace `your_server_id_h` with your Discord server ID

**How to get Server ID:**
- Right-click your server name → Copy Server ID
- (Enable Developer Mode in Discord settings if needed)

### Step 3: Install and Start
```bash
# Install dependencies (already done)
npm install

# Deploy commands to Discord
npm run deploy

# Start the bot
npm start
```

### Step 4: Invite Bot to Server
1. In Developer Portal → OAuth2 → URL Generator
2. Select Scopes: ✅ `bot` ✅ `applications.commands`
3. Select Bot Permissions:
   - ✅ Manage Channels
   - ✅ Manage Roles  
   - ✅ Kick Members
   - ✅ Ban Members
   - ✅ Moderate Members
   - ✅ Manage Messages
   - ✅ Send Messages
   - ✅ Use Slash Commands
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Add Reactions
4. Copy the generated URL and open it to invite the bot

### Step 5: Initial Setup
In your Discord server, run:
```
/setup
```

## ✅ Quick Test Checklist

After setup, test these commands:
- [ ] `/help` - Shows help menu
- [ ] `/userinfo` - Shows your user info
- [ ] `/poll question:"Test poll?" option1:"Yes" option2:"No"` - Creates a poll
- [ ] `/ticket category:general description:"Test ticket"` - Creates support ticket
- [ ] `/8ball question:"Is ModuBot working?"` - Magic 8-ball
- [ ] `/level` - Shows your level (will be 1 initially)

## 🎯 Essential Configuration

### Set Up Moderation Logging
```
/config modlog #your-mod-log-channel
```

### Configure Support System
The `/setup` command creates a support category automatically, but you can customize:
```
/config support-category [Category ID]
```

### Customize Settings
```
/config max-warnings 5          # Change warning limit
/config xp-enabled true          # Enable/disable XP system
/config welcome-channel #welcome # Set welcome channel
```

## 🛠️ Troubleshooting

### Bot Not Responding?
1. ✅ Check bot is online (green status)
2. ✅ Verify bot has permissions in the channel
3. ✅ Make sure you deployed commands (`npm run deploy`)
4. ✅ Check console for error messages

### Commands Not Showing?
1. ✅ Run `npm run deploy` again
2. ✅ Wait a few minutes for Discord to update
3. ✅ Check bot has "Use Slash Commands" permission

### Permission Errors?
1. ✅ Move ModuBot role higher in role hierarchy
2. ✅ Check channel-specific permissions
3. ✅ Verify bot has required permissions

## 📚 Next Steps

1. **Read the full documentation** in `context.md`
2. **Set up your server structure** (channels, roles)
3. **Configure moderation settings**
4. **Add complementary bots** (Carl-bot, Dyno, etc.)
5. **Customize server branding**
6. **Train your staff** on bot commands

## 🆘 Need Help?

- 📖 Check `context.md` for comprehensive setup guide
- 🤖 Use `/help` command in Discord
- 🐛 Check console logs for error messages
- 💬 Join our support server (if available)

---

**🎉 Congratulations!** Your ModuBot is now ready to help manage your Discord community!

Remember: A well-configured bot is the foundation of a successful Discord server. Take time to properly set up permissions, channels, and roles for the best experience.
