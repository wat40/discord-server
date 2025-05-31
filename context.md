# ModuBot - Complete Discord Server Setup Guide

## Table of Contents
1. [Bot Setup & Installation](#bot-setup--installation)
2. [Discord Server Creation & Optimization](#discord-server-creation--optimization)
3. [Permission System & Role Hierarchy](#permission-system--role-hierarchy)
4. [Channel Structure & Organization](#channel-structure--organization)
5. [ModuBot Configuration](#modubot-configuration)
6. [Complementary Bots & Integrations](#complementary-bots--integrations)
7. [Server Customization & Branding](#server-customization--branding)
8. [Moderation Best Practices](#moderation-best-practices)
9. [Community Engagement Strategies](#community-engagement-strategies)
10. [Troubleshooting & Maintenance](#troubleshooting--maintenance)

---

## Bot Setup & Installation

### Prerequisites
- Node.js 16.0.0 or higher
- A Discord account with Developer Portal access
- Basic command line knowledge

### Step 1: Create Discord Application
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and name it "ModuBot"
3. Navigate to the "Bot" section
4. Click "Add Bot" and confirm
5. Copy the bot token (keep this secure!)
6. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent

### Step 2: Install ModuBot
1. Clone or download the ModuBot files
2. Open terminal in the ModuBot directory
3. Run: `npm install`
4. Copy `.env.example` to `.env`
5. Fill in your bot token and other configuration values

### Step 3: Deploy Commands
1. Add your bot's Client ID to `.env`
2. Add your server's Guild ID to `.env` (for faster development)
3. Run: `npm run deploy`

### Step 4: Invite Bot to Server
1. In Developer Portal, go to OAuth2 > URL Generator
2. Select scopes: `bot` and `applications.commands`
3. Select permissions:
   - Manage Channels
   - Manage Roles
   - Kick Members
   - Ban Members
   - Moderate Members
   - Manage Messages
   - Read Message History
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Attach Files
   - Add Reactions
4. Use generated URL to invite bot

### Step 5: Start the Bot
```bash
npm start
```

---

## Discord Server Creation & Optimization

### Complete Server Setup Process

#### Step 1: Create Your Discord Server
1. **Click "+" in Discord sidebar** → "Create My Own"
2. **Choose "For a club or community"**
3. **Server Name**: Choose from these professional options:
   - **🏢 Business/Professional**: "[Company] Community Hub", "[Brand] Support Center", "[Service] Official Server"
   - **🎮 Gaming Communities**: "[Game] Central", "[Clan] Headquarters", "[Game] Community Hub"
   - **🎓 Educational**: "[Course] Learning Hub", "[School] Student Community", "[Subject] Study Group"
   - **🎨 Creative**: "[Art] Creative Studio", "[Music] Collective", "[Design] Workshop"
   - **💬 General Communities**: "[Topic] Community", "[Interest] Hub", "[Hobby] Central"
   - **🛠️ Tech/Development**: "[Project] Dev Community", "[Tech] Support Hub", "[Code] Collective"
4. **Server Icon**: Upload a 512x512 professional logo (PNG/JPG)
5. **Server Region**: Select closest to your primary audience

#### Step 2: Essential Server Settings

##### Basic Settings
- **Verification Level**: Medium (verified email required)
- **Explicit Content Filter**: Scan messages from members without roles
- **Default Notifications**: Only @mentions
- **2FA Requirement**: Enabled for moderators
- **System Messages Channel**: Set to #general or dedicated channel

##### Community Server Features (REQUIRED for large servers)
1. **Enable Community Server**:
   - Go to Server Settings → Enable Community
   - Accept Discord's Community Guidelines
   - Set Rules Channel and Updates Channel

2. **Welcome Screen Setup**:
   ```
   📋 Server Description: "A thriving community for [your purpose]"
   📜 Rules: #📋rules
   💬 General Chat: #💬general-chat
   🎫 Support: #🎫support-info
   🎉 Events: #📅events
   ```

3. **Discovery Settings** (optional):
   - Add relevant tags for your community
   - Write compelling server description
   - Set primary language

#### Step 3: Server Verification & Safety
- **Enable Phone Verification** for new members
- **Set up AutoMod** (Discord's built-in moderation)
- **Configure Raid Protection**
- **Enable Timeout permissions** for moderators

#### Step 4: Advanced Settings
- **Vanity URL**: Claim custom invite link (if eligible)
- **Server Insights**: Enable for analytics
- **Integrations**: Prepare for bot integrations
- **Audit Log**: Ensure proper access for staff

---

## Permission System & Role Hierarchy

### Complete Role Structure with Emojis & Permissions

#### 👑 **Administrative Roles** (Positions 1-3)

##### 1. 👑 **Server Owner** (Automatic)
- **Color**: Gold (#FFD700)
- **Permissions**: All permissions (automatic)
- **Purpose**: Ultimate server control

##### 2. 🛡️ **Administrator**
- **Color**: Red (#FF0000)
- **Permissions**: ✅ Administrator (grants all permissions)
- **Purpose**: Full server management
- **Who Gets This**: Co-owners, trusted senior staff

##### 3. 🔱 **Head Moderator**
- **Color**: Dark Red (#8B0000)
- **Essential Permissions**:
  ```
  ✅ Manage Channels        ✅ Manage Roles (limited)
  ✅ Kick Members           ✅ Ban Members
  ✅ Moderate Members       ✅ Manage Messages
  ✅ View Audit Log         ✅ Manage Nicknames
  ✅ Move Members           ✅ Mute Members
  ```
- **Purpose**: Lead moderation team, handle escalated issues

#### 🛡️ **Moderation Roles** (Positions 4-6)

##### 4. ⚔️ **Senior Moderator**
- **Color**: Orange (#FF8C00)
- **Essential Permissions**:
  ```
  ✅ Kick Members           ✅ Ban Members
  ✅ Moderate Members       ✅ Manage Messages
  ✅ View Audit Log         ✅ Manage Nicknames
  ✅ Move Members           ✅ Mute Members
  ✅ Use Voice Activity     ✅ Priority Speaker
  ```
- **Purpose**: Handle serious violations, mentor junior mods

##### 5. 🛡️ **Moderator**
- **Color**: Yellow (#FFD700)
- **Essential Permissions**:
  ```
  ✅ Kick Members           ✅ Moderate Members
  ✅ Manage Messages        ✅ Manage Nicknames
  ✅ Move Members           ✅ Mute Members
  ✅ Use Voice Activity
  ```
- **Purpose**: Day-to-day moderation, enforce rules

##### 6. 🔰 **Trial Moderator**
- **Color**: Light Orange (#FFA500)
- **Limited Permissions**:
  ```
  ✅ Moderate Members       ✅ Manage Messages (limited)
  ✅ Manage Nicknames       ✅ Move Members
  ✅ Mute Members
  ```
- **Purpose**: New moderators in training period

#### 🎫 **Support Roles** (Positions 7-8)

##### 7. 🎯 **Support Lead**
- **Color**: Blue (#0066FF)
- **Essential Permissions**:
  ```
  ✅ Manage Channels (support only)  ✅ Manage Messages
  ✅ View Audit Log                  ✅ Manage Nicknames
  ✅ Move Members                    ✅ Mute Members
  ✅ Create Private Threads          ✅ Manage Threads
  ```
- **Purpose**: Oversee support team, handle complex tickets

##### 8. 🎫 **Support Staff**
- **Color**: Light Blue (#87CEEB)
- **Essential Permissions**:
  ```
  ✅ Manage Messages        ✅ Manage Nicknames
  ✅ Move Members           ✅ Mute Members
  ✅ Create Private Threads ✅ Send Messages in Threads
  ```
- **Purpose**: Handle support tickets, assist community

#### 🏆 **Community Roles** (Positions 9-12)

##### 9. 💎 **VIP/Donor**
- **Color**: Purple (#800080)
- **Special Permissions**:
  ```
  ✅ Use External Emojis    ✅ Use External Stickers
  ✅ Embed Links            ✅ Attach Files
  ✅ Add Reactions          ✅ Use Voice Activity
  ✅ Priority Speaker       ✅ Change Nickname
  ```
- **Purpose**: Reward supporters, special privileges

##### 10. 🌟 **Active Member**
- **Color**: Green (#00FF00)
- **Standard Permissions**:
  ```
  ✅ Send Messages          ✅ Embed Links
  ✅ Attach Files           ✅ Add Reactions
  ✅ Use External Emojis    ✅ Read Message History
  ✅ Connect                ✅ Speak
  ✅ Use Voice Activity     ✅ Change Nickname
  ```
- **Purpose**: Earned through engagement, trusted members

##### 11. ✅ **Verified Member**
- **Color**: Light Green (#90EE90)
- **Basic Permissions**:
  ```
  ✅ Send Messages          ✅ Add Reactions
  ✅ Read Message History   ✅ Connect
  ✅ Speak                  ✅ Use Voice Activity
  ✅ Change Nickname
  ```
- **Purpose**: Completed verification, basic access

##### 12. 👶 **New Member**
- **Color**: Gray (#808080)
- **Restricted Permissions**:
  ```
  ✅ Read Message History   ✅ View Channels
  ✅ Connect                ✅ Use Voice Activity
  ❌ Send Messages (limited channels only)
  ❌ Add Reactions (limited)
  ```
- **Purpose**: Default role, limited access until verification

#### 🤖 **Bot Roles** (Positions 13+)

##### 🤖 **ModuBot** (Position 13)
- **Color**: Cyan (#00FFFF)
- **Required Permissions**: [See bot permissions section]

##### 🛡️ **Carl-bot** (Position 14)
- **Color**: Dark Blue (#000080)
- **Required Permissions**: [See bot permissions section]

##### 🎵 **Music Bot** (Position 15)
- **Color**: Pink (#FFC0CB)
- **Required Permissions**: [See bot permissions section]

### 📚 **Discord Permission Explanations**

#### **🔧 General Permissions**
- **✅ View Channels**: See channels and read channel names/topics
- **✅ Manage Channels**: Create, edit, delete channels and categories
- **✅ Manage Roles**: Create, edit, delete roles below their highest role
- **✅ Manage Emojis and Stickers**: Add, edit, delete custom emojis/stickers
- **✅ View Audit Log**: See server audit log (who did what, when)
- **✅ View Server Insights**: Access server analytics and statistics
- **✅ Manage Webhooks**: Create, edit, delete webhooks
- **✅ Manage Server**: Change server name, region, icon, etc.

#### **👥 Membership Permissions**
- **✅ Create Instant Invite**: Generate invite links to the server
- **✅ Change Nickname**: Change their own nickname
- **✅ Manage Nicknames**: Change other members' nicknames
- **✅ Kick Members**: Remove members from server (they can rejoin)
- **✅ Ban Members**: Permanently ban members from server
- **✅ Moderate Members**: Timeout members (temporary mute)

#### **💬 Text Channel Permissions**
- **✅ Send Messages**: Post messages in text channels
- **✅ Send Messages in Threads**: Post in thread conversations
- **✅ Create Public Threads**: Start public thread discussions
- **✅ Create Private Threads**: Start private thread discussions
- **✅ Embed Links**: Post links that show previews
- **✅ Attach Files**: Upload files, images, videos
- **✅ Add Reactions**: React to messages with emojis
- **✅ Use External Emojis**: Use emojis from other servers
- **✅ Use External Stickers**: Use stickers from other servers
- **✅ Mention @everyone, @here, and All Roles**: Ping entire server
- **✅ Manage Messages**: Delete others' messages, pin messages
- **✅ Manage Threads**: Archive, lock, delete threads
- **✅ Read Message History**: See previous messages in channels
- **✅ Send TTS Messages**: Send text-to-speech messages
- **✅ Use Slash Commands**: Use application commands (/)

#### **🔊 Voice Channel Permissions**
- **✅ Connect**: Join voice channels
- **✅ Speak**: Talk in voice channels
- **✅ Video**: Use camera in voice channels
- **✅ Use Voice Activity**: Use voice activation (vs push-to-talk)
- **✅ Priority Speaker**: Speak over others when activated
- **✅ Mute Members**: Mute others in voice channels
- **✅ Deafen Members**: Deafen others in voice channels
- **✅ Move Members**: Move others between voice channels
- **✅ Use Soundboard**: Use server soundboard sounds
- **✅ Use External Sounds**: Use soundboard sounds from other servers

#### **🎭 Stage Channel Permissions**
- **✅ Request to Speak**: Request speaking permission in stage
- **✅ Create Events**: Create scheduled events
- **✅ Manage Events**: Edit, delete scheduled events

#### **⚡ Advanced Permissions**
- **✅ Administrator**: Grants ALL permissions (use sparingly!)
- **✅ View Creator Monetization Analytics**: See server monetization data

### 🎯 **Permission Assignment Strategy**

#### **🔴 High-Risk Permissions** (Admin/Head Mod only)
```
⚠️ Administrator           ⚠️ Manage Server
⚠️ Manage Channels         ⚠️ Manage Roles
⚠️ Ban Members             ⚠️ View Audit Log
⚠️ Manage Webhooks
```

#### **🟡 Medium-Risk Permissions** (Senior Staff)
```
⚠️ Kick Members            ⚠️ Moderate Members
⚠️ Manage Messages         ⚠️ Manage Nicknames
⚠️ Move Members            ⚠️ Mute Members
```

#### **🟢 Low-Risk Permissions** (Trusted Members)
```
✅ Use External Emojis     ✅ Embed Links
✅ Attach Files            ✅ Add Reactions
✅ Change Nickname         ✅ Create Threads
```

#### **⚪ Basic Permissions** (All Members)
```
✅ Send Messages           ✅ Read Message History
✅ Connect                 ✅ Speak
✅ Use Voice Activity      ✅ View Channels
```

### 🛡️ **Permission Best Practices**

#### **Security Guidelines**
1. **Principle of Least Privilege**: Give minimum permissions needed
2. **Role Hierarchy**: Higher roles override lower role permissions
3. **Channel Overrides**: Use sparingly, can create confusion
4. **Regular Audits**: Review permissions monthly
5. **Documentation**: Keep track of who has what permissions

#### **Common Permission Mistakes**
- ❌ Giving "Administrator" to too many people
- ❌ Not understanding role hierarchy
- ❌ Conflicting channel overrides
- ❌ Forgetting to remove permissions when demoting
- ❌ Not testing permission changes

#### **Permission Testing Checklist**
- [ ] Test with lowest role first
- [ ] Verify channel overrides work correctly
- [ ] Check voice channel permissions
- [ ] Test bot permissions in all channels
- [ ] Confirm moderation commands work
- [ ] Validate role hierarchy is correct

---

## Channel Structure & Organization

### 🏗️ **Complete Professional Server Layout**

## 📋 **INFORMATION CATEGORY**

### **Category Permissions (Sync All Channels)**
```
@everyone Role:
✅ View Channel
✅ Read Message History
❌ Send Messages
❌ Add Reactions
❌ Create Public Threads
❌ Create Private Threads
❌ Send Messages in Threads
❌ Use External Emojis
❌ Use External Stickers

Staff Roles (Moderator+):
✅ All Permissions
✅ Manage Messages
✅ Manage Threads
✅ Mention @everyone, @here, All Roles
```

### **Channels & Descriptions**
```
📋 INFORMATION
├── 📜 rules
├── 📢 announcements
├── 👋 welcome
├── ❓ faq
├── 📰 updates
├── 🔗 useful-links
└── 📊 server-stats
```

**📜 rules**
- **Purpose**: Server rules and guidelines for all members
- **Description**: "📜 Server Rules & Guidelines | Read before participating | Violations result in warnings/bans"
- **Settings**: Slowmode disabled, pin comprehensive rules message
- **Content**: Numbered rules, consequences, appeal process

**📢 announcements**
- **Purpose**: Important server-wide announcements from staff
- **Description**: "📢 Official Server Announcements | Important updates and news | Enable notifications 🔔"
- **Settings**: Staff-only posting, @everyone mentions enabled
- **Content**: Server updates, events, policy changes

**👋 welcome**
- **Purpose**: Welcome new members and ModuBot welcome messages
- **Description**: "👋 Welcome to our community! | New member introductions | Check #📜rules first"
- **Settings**: ModuBot auto-welcome enabled, 30s slowmode
- **Content**: Welcome messages, server tour, getting started guide

**❓ faq**
- **Purpose**: Frequently asked questions and common issues
- **Description**: "❓ Frequently Asked Questions | Search before asking | Common solutions here"
- **Settings**: Searchable format, organized with reactions
- **Content**: Common questions, troubleshooting, quick answers

**📰 updates**
- **Purpose**: Bot updates, feature changes, and technical news
- **Description**: "📰 Bot & Server Updates | ModuBot changelog | Technical announcements"
- **Settings**: Staff posting only, update notifications
- **Content**: Bot updates, new features, maintenance schedules

**🔗 useful-links**
- **Purpose**: Important external resources and links
- **Description**: "🔗 Useful Links & Resources | External tools | Official websites | Documentation"
- **Settings**: Curated links only, organized by category
- **Content**: Official links, tools, documentation, social media

**📊 server-stats**
- **Purpose**: Live server statistics and member count
- **Description**: "📊 Live Server Statistics | Member count | Growth metrics | Server insights"
- **Settings**: Bot-managed channel, auto-updating stats
- **Content**: Member count, online count, growth charts

## 💬 **GENERAL CATEGORY**

### **Category Permissions (Sync All Channels)**
```
@everyone Role:
❌ View Channel (will be overridden per channel)

New Member Role:
✅ View Channel
✅ Read Message History
❌ Send Messages (except #🎭introductions)
❌ Add Reactions
❌ Create Threads

Verified Member+ Roles:
✅ View Channel
✅ Send Messages
✅ Read Message History
✅ Add Reactions
✅ Use External Emojis
✅ Attach Files
✅ Embed Links
✅ Create Public Threads
✅ Send Messages in Threads
✅ Use Voice Activity

Staff Roles (Moderator+):
✅ All Permissions
✅ Manage Messages
✅ Manage Threads
```

### **Channels & Descriptions**
```
💬 GENERAL
├── 💬 general-chat
├── 🎭 introductions
├── 🗣️ off-topic
├── 😂 memes-and-fun
├── 🎨 media-sharing
├── 🤖 bot-commands
└── 🎵 music-commands
```

**💬 general-chat**
- **Purpose**: Main community discussion and conversation hub
- **Description**: "💬 Main Community Chat | General discussions | Keep it friendly and on-topic"
- **Settings**: 5-second slowmode, main discussion area
- **Special Rules**: No spam, stay on topic, be respectful
- **Permissions**: Standard verified member permissions

**🎭 introductions**
- **Purpose**: New member introductions and welcomes
- **Description**: "🎭 Introduce Yourself! | New members welcome | Tell us about yourself | One intro per person"
- **Settings**: 30-second slowmode, welcome new members
- **Special Rules**: One introduction per person, be welcoming
- **Permissions**: New members CAN send messages here

**🗣️ off-topic**
- **Purpose**: Casual conversations not related to main server topic
- **Description**: "🗣️ Off-Topic Chat | Casual conversations | Random discussions | Keep it appropriate"
- **Settings**: 3-second slowmode, casual conversations
- **Special Rules**: Still follow server rules, no controversial topics
- **Permissions**: Verified member+ only

**😂 memes-and-fun**
- **Purpose**: Memes, jokes, and entertainment content
- **Description**: "😂 Memes & Fun | Share memes and jokes | Keep it clean | No spam posting"
- **Settings**: Image/video sharing enabled, reaction roles
- **Special Rules**: No offensive content, no spam, original content preferred
- **Permissions**: Attach files enabled, external emojis allowed

**🎨 media-sharing**
- **Purpose**: Art, screenshots, photos, and creative content
- **Description**: "🎨 Media Sharing | Share your art, photos, screenshots | Credit original creators | No NSFW"
- **Settings**: High file upload limit, art showcasing
- **Special Rules**: Credit artists, no NSFW, constructive feedback only
- **Permissions**: Attach files, embed links, external emojis

**🤖 bot-commands**
- **Purpose**: Bot testing and command usage to keep other channels clean
- **Description**: "🤖 Bot Commands | Test bot commands here | Keep other channels clean | All bots allowed"
- **Settings**: No slowmode, bot command testing
- **Special Rules**: Bot commands only, no general chat
- **Permissions**: All bot interaction permissions

**🎵 music-commands**
- **Purpose**: Music bot commands and queue management
- **Description**: "🎵 Music Commands | Music bot controls | Queue requests | Now playing info"
- **Settings**: Music bot integration, queue display
- **Special Rules**: Music commands only, no chat
- **Permissions**: Music bot interaction permissions

## 🎫 **SUPPORT CATEGORY**

### **Category Permissions (Sync All Channels)**
```
@everyone Role:
❌ View Channel (will be overridden per channel)

New Member Role:
✅ View Channel (support-info, bug-reports, feature-requests only)
✅ Read Message History
❌ Send Messages (except bug-reports, feature-requests)
❌ Create Threads

Verified Member+ Roles:
✅ View Channel
✅ Send Messages (public channels only)
✅ Read Message History
✅ Add Reactions
✅ Create Public Threads
✅ Send Messages in Threads
✅ Attach Files (for bug reports)

Support Staff Role:
✅ All Standard Permissions
✅ Manage Messages
✅ Manage Threads
✅ View Channel (all support channels)
✅ Create Private Threads

Staff Roles (Moderator+):
✅ All Permissions
✅ Manage Channels (ticket channels)
✅ View Channel (all channels including ticket-logs)
```

### **Channels & Descriptions**
```
🎫 SUPPORT
├── 🎫 support-info
├── 📋 ticket-logs
├── 🐛 bug-reports
├── 💡 feature-requests
├── 📚 knowledge-base
└── [🎫-ticket-#### - Dynamic ticket channels created by ModuBot]
```

**🎫 support-info**
- **Purpose**: Instructions and information about the support system
- **Description**: "🎫 Support Information | How to get help | Use /ticket to create a private support channel | Check #❓faq first"
- **Settings**: Read-only for members, comprehensive support guide
- **Special Rules**: Pin support instructions and ticket categories
- **Permissions**: All members can view, only staff can post

**📋 ticket-logs**
- **Purpose**: Closed ticket transcripts and support analytics (staff-only)
- **Description**: "📋 Ticket Logs | Closed ticket transcripts | Staff-only channel | Support analytics and history"
- **Settings**: Staff-only access, automatic ticket transcript posting
- **Special Rules**: Confidential support data, regular cleanup
- **Permissions**: Staff and support team only

**🐛 bug-reports**
- **Purpose**: Public bug reporting with structured templates
- **Description**: "🐛 Bug Reports | Report bugs and issues | Use the template | Include screenshots/logs | Staff will investigate"
- **Settings**: Public reporting, reaction-based triage system
- **Special Rules**: Use bug report template, no duplicate reports
- **Permissions**: Verified members can post, attach files enabled

**💡 feature-requests**
- **Purpose**: Community suggestions and feature requests
- **Description**: "💡 Feature Requests | Suggest new features | Community voting with reactions | Detailed descriptions please"
- **Settings**: Community voting system, reaction-based prioritization
- **Special Rules**: One request per post, detailed descriptions required
- **Permissions**: Verified members can post, voting reactions enabled

**📚 knowledge-base**
- **Purpose**: Self-service help articles and common solutions
- **Description**: "📚 Knowledge Base | Self-help articles | Common solutions | Search before asking | Updated regularly"
- **Settings**: Searchable help articles, organized by category
- **Special Rules**: Staff-curated content, regular updates
- **Permissions**: All members can view, staff can post and manage

#### 🏆 COMMUNITY CATEGORY
```
🏆 COMMUNITY
├── 💡 suggestions
├── 📊 polls
├── 📅 events
├── 🎉 giveaways
├── 🏅 achievements
└── 📈 leaderboard
```

**Channel Settings:**
- **💡 suggestions**: Community improvement ideas, voting reactions
- **📊 polls**: ModuBot polls, community decisions
- **📅 events**: Upcoming events, announcements
- **🎉 giveaways**: Contest announcements and participation
- **🏅 achievements**: Member highlights, milestones
- **📈 leaderboard**: XP rankings, top contributors

#### 🎮 ACTIVITIES CATEGORY (Optional for Gaming)
```
🎮 ACTIVITIES
├── 🎮 general-gaming
├── 🔍 looking-for-group
├── 🏆 tournaments
├── 📺 streams-and-videos
└── [Game-specific channels]
```

#### 🔒 STAFF CATEGORY
```
🔒 STAFF
├── 👥 staff-chat
├── 📋 mod-logs
├── 📢 staff-announcements
├── 🎫 ticket-management
├── 🔧 bot-management
└── 📊 analytics
```

**Channel Settings:**
- **👥 staff-chat**: Private staff discussions
- **📋 mod-logs**: ModuBot moderation logging
- **📢 staff-announcements**: Important staff updates
- **🎫 ticket-management**: Ticket oversight and coordination
- **🔧 bot-management**: Bot configuration and testing
- **📊 analytics**: Server statistics and insights

#### 🔊 VOICE CATEGORY
```
🔊 VOICE CHANNELS
├── 🎤 General Voice 1
├── 🎤 General Voice 2
├── 🎮 Gaming Voice 1
├── 🎮 Gaming Voice 2
├── 🔒 Staff Voice
├── 📞 Support Voice
└── 😴 AFK Channel
```

**Voice Settings:**
- **General Voice**: Open to all verified members
- **Gaming Voice**: For gaming activities, game-specific
- **Staff Voice**: Staff-only access
- **Support Voice**: For voice support tickets
- **AFK Channel**: Auto-move after 5 minutes

### Advanced Channel Configuration

#### Permission Templates
```
📋 READ-ONLY CHANNELS (Rules, Announcements)
✅ View Channel
✅ Read Message History
❌ Send Messages
❌ Add Reactions

💬 GENERAL CHAT CHANNELS
✅ View Channel
✅ Send Messages
✅ Read Message History
✅ Add Reactions
✅ Use External Emojis
✅ Attach Files

🔒 STAFF CHANNELS
❌ View Channel (for @everyone)
✅ All permissions (for staff roles)

🎫 SUPPORT CHANNELS
✅ View Channel (for verified members)
✅ Send Messages (limited)
✅ Read Message History
❌ Manage Messages (except staff)
```

#### Channel Topics Examples
- **💬 general-chat**: "Main community discussion | Keep it friendly | Use #🤖bot-commands for bot testing"
- **🎫 support-info**: "Need help? Use /ticket to create a private support channel | Check #❓faq first"
- **📊 polls**: "Community polls and voting | Results help shape our server"
- **🎭 introductions**: "Welcome new members! Tell us about yourself | One intro per person"

### Channel Maintenance Tips
- **Regular Cleanup**: Archive inactive channels monthly
- **Topic Updates**: Keep channel topics current and helpful
- **Permission Audits**: Review channel permissions quarterly
- **Slowmode Adjustment**: Adjust based on activity levels
- **Pin Management**: Keep pinned messages relevant and updated
- **Thread Organization**: Use threads for extended discussions

---

## ModuBot Configuration

### Initial Setup Commands
Run these commands after inviting ModuBot:

1. **Basic Setup**
   ```
   /setup
   ```
   This initializes the database and basic settings.

2. **Configure Moderation Log**
   ```
   /config modlog #mod-logs
   ```

3. **Set Support Category**
   ```
   /config support-category [Support Category ID]
   ```

4. **Configure Welcome System**
   ```
   /config welcome-channel #welcome
   /config welcome-message "Welcome {user} to {server}!"
   ```

### Key Configuration Options

#### Moderation Settings
- **Max Warnings**: Default 3 (configurable)
- **Auto-moderation**: Can be enabled for spam/links
- **Mod Log Channel**: Tracks all moderation actions

#### Support System
- **Ticket Categories**: Bug, General, Feature, Report, Technical, Billing
- **Ticket Limit**: 3 per user (configurable)
- **Auto-close**: Inactive tickets after 7 days

#### XP/Level System
- **XP per Message**: 5 (configurable)
- **XP Cooldown**: 60 seconds
- **Level Announcements**: Enabled by default

### Database Management
ModuBot uses SQLite for data storage:
- User levels and XP
- Warnings and moderation history
- Support tickets
- Server settings
- Custom tags/responses

---

## Complementary Bots & Integrations

### Complete Bot Ecosystem for Large Community/Support Servers

#### 🤖 **ModuBot** (Primary - Community & Support)
**Role**: Main bot for moderation, support, and community features
**Invite Link**: [Your ModuBot invite link]
**Required Permissions**:
```
✅ Manage Channels          ✅ Kick Members
✅ Manage Roles             ✅ Ban Members
✅ Manage Messages          ✅ Moderate Members
✅ Send Messages            ✅ Use Slash Commands
✅ Embed Links              ✅ Attach Files
✅ Add Reactions            ✅ Read Message History
✅ View Channels            ✅ Connect (Voice)
✅ Speak (Voice)
```
**Setup Steps**:
1. Invite with above permissions
2. Move role to top of bot hierarchy
3. Run `/setup` command
4. Configure channels and settings

---

#### 🛡️ **Carl-bot** (Automoderation & Utilities)
**Role**: Advanced automoderation and reaction roles
**Invite Link**: https://carl-bot.io/
**Required Permissions**:
```
✅ Manage Messages          ✅ Moderate Members
✅ Manage Roles             ✅ Kick Members
✅ Ban Members              ✅ View Audit Log
✅ Send Messages            ✅ Embed Links
✅ Add Reactions            ✅ Use External Emojis
✅ Manage Webhooks
```
**Setup Priority**: 🔴 **CRITICAL** - Set up immediately
**Configuration**:
1. **Automod Setup**:
   - Enable spam detection (5 messages/5 seconds)
   - Block Discord invites (except whitelisted)
   - Filter excessive caps (70% threshold)
   - Block mass mentions (5+ mentions)
   - Enable repeated text detection

2. **Reaction Roles**:
   - Create role selection menus
   - Set up color roles, notification roles
   - Configure pronoun roles if needed

3. **Logging**:
   - Message edits/deletes → #📋mod-logs
   - Member joins/leaves → #📋mod-logs
   - Role changes → #📋mod-logs

---

#### 🎵 **Groovy/Hydra** (Music Bot)
**Role**: Music and entertainment
**Invite Link**: https://groovy.bot/ or https://hydra.bot/
**Required Permissions**:
```
✅ Connect                  ✅ Speak
✅ Send Messages            ✅ Embed Links
✅ Add Reactions            ✅ Use External Emojis
✅ Read Message History
```
**Setup Priority**: 🟡 **MEDIUM** - Add after core setup
**Configuration**:
- Set music channel (#🎵music-commands)
- Configure DJ role permissions
- Set volume limits and queue limits

---

#### 📊 **Statbot** (Server Analytics)
**Role**: Server statistics and growth tracking
**Invite Link**: https://statbot.net/
**Required Permissions**:
```
✅ Send Messages            ✅ Embed Links
✅ Read Message History     ✅ View Channels
✅ Add Reactions
```
**Setup Priority**: 🟢 **LOW** - Nice to have
**Configuration**:
- Set stats channel (#📊analytics)
- Configure member count displays
- Enable growth tracking

---

#### 🎮 **Game-Specific Bots** (Optional)

##### **Discord Together** (Activities)
**Role**: Voice channel games and activities
**Built into Discord**: Use slash commands
**Setup**: `/activities` in voice channels

##### **Pokétwo** (If gaming community)
**Role**: Pokémon catching game
**Invite Link**: https://poketwo.net/
**Setup Priority**: 🟢 **LOW** - Only for gaming servers

---

#### 🔧 **Backup & Utility Bots**

##### **Dyno** (Backup Moderation)
**Role**: Backup moderation when ModuBot is down
**Invite Link**: https://dyno.gg/
**Required Permissions**:
```
✅ Kick Members             ✅ Ban Members
✅ Manage Messages          ✅ Moderate Members
✅ Send Messages            ✅ View Audit Log
```
**Setup Priority**: 🟡 **MEDIUM** - Backup system
**Configuration**:
- Keep disabled normally
- Enable during ModuBot maintenance
- Configure basic automod as backup

##### **YAGPDB** (Advanced Automation)
**Role**: Complex automation and custom commands
**Invite Link**: https://yagpdb.xyz/
**Setup Priority**: 🟢 **LOW** - Advanced users only

---

### 📋 **Bot Setup Order & Timeline**

#### **Day 1 - Core Setup**
1. 🤖 **ModuBot** - Primary bot setup
2. 🛡️ **Carl-bot** - Essential automoderation
3. Create basic server structure

#### **Day 2-3 - Enhancement**
4. 🎵 **Music Bot** - Community entertainment
5. 📊 **Statbot** - Analytics setup
6. Fine-tune permissions and settings

#### **Week 1 - Optimization**
7. 🔧 **Backup bots** - Redundancy systems
8. 🎮 **Game bots** - If applicable
9. Test all systems thoroughly

---

### ⚙️ **Bot Management Best Practices**

#### **Permission Hierarchy**
```
🏆 ModuBot (Highest - Position 2)
🛡️ Carl-bot (Position 3)
🔧 Dyno (Position 4)
🎵 Music Bot (Position 5)
📊 Statbot (Position 6)
🎮 Game Bots (Lowest)
```

#### **Channel Assignments**
- **🤖 bot-commands**: All bot testing
- **🎵 music-commands**: Music bot only
- **📊 analytics**: Statbot displays
- **📋 mod-logs**: ModuBot + Carl-bot logging

#### **Conflict Prevention**
- **Different Prefixes**:
  - ModuBot: `/` (slash commands)
  - Carl-bot: `!` or `?`
  - Dyno: `?` or `!`
  - Music: `!` or `-`

- **Feature Separation**:
  - Moderation: ModuBot primary, Carl-bot automod
  - Music: Dedicated music bot only
  - Leveling: ModuBot only (disable MEE6 if using)
  - Tickets: ModuBot only

#### **Monitoring & Maintenance**
- **Weekly Checks**: Bot uptime and functionality
- **Monthly Updates**: Check for bot updates
- **Permission Audits**: Quarterly review
- **Backup Testing**: Test backup bots monthly

---

### 🚨 **Emergency Bot Procedures**

#### **If ModuBot Goes Down**
1. Announce in #📢announcements
2. Enable Dyno backup moderation
3. Increase manual staff monitoring
4. Use Carl-bot for automod only

#### **If Multiple Bots Fail**
1. Enable Discord's built-in AutoMod
2. Activate all backup systems
3. Increase staff presence
4. Consider temporary server lockdown

#### **Bot Conflict Resolution**
1. Identify conflicting features
2. Disable duplicate functions
3. Adjust permission levels
4. Test thoroughly before re-enabling

---

### 📈 **Advanced Integration Ideas**

#### **Webhook Integrations**
- **GitHub**: Development updates
- **Twitter**: Social media posts
- **YouTube**: New video notifications
- **Twitch**: Stream announcements

#### **Custom Dashboards**
- Carl-bot web dashboard for automod
- Dyno dashboard for backup settings
- Custom analytics with Statbot

#### **API Integrations**
- Discord server insights
- Custom bot status monitoring
- Automated backup systems

---

## Server Customization & Branding

### Custom Emojis Strategy
1. **Moderation Emojis**
   - ✅ Approved
   - ❌ Denied
   - ⚠️ Warning
   - 🔒 Locked
   - 🔓 Unlocked

2. **Support Emojis**
   - 🎫 Ticket
   - 🐛 Bug
   - 💡 Feature
   - ❓ Question
   - ⚠️ Report

3. **Reaction Emojis**
   - 👍 Like
   - 👎 Dislike
   - ❤️ Love
   - 😂 Funny
   - 😮 Surprised

4. **Status Emojis**
   - 🟢 Online
   - 🟡 Away
   - 🔴 Busy
   - ⚫ Offline

### Server Icon & Banner
- **Icon**: Clear, recognizable logo (512x512 recommended)
- **Banner**: Professional design matching theme (960x540)
- **Splash**: For partnered servers (1920x1080)

### Color Scheme
Choose a consistent color palette:
- **Primary**: Main brand color
- **Secondary**: Accent color
- **Success**: Green (#00ff00)
- **Warning**: Yellow (#ffff00)
- **Error**: Red (#ff0000)
- **Info**: Blue (#0099ff)

---

## Moderation Best Practices

### Moderation Philosophy
1. **Consistency**: Apply rules equally to all members
2. **Transparency**: Clear rules and consequences
3. **Escalation**: Progressive punishment system
4. **Documentation**: Log all moderation actions
5. **Appeal Process**: Allow appeals for major actions

### Warning System
ModuBot implements a 3-strike system:
1. **First Warning**: Verbal warning + log
2. **Second Warning**: Timeout + log
3. **Third Warning**: Kick/ban consideration

### Common Moderation Scenarios

#### Spam/Flooding
- **First Offense**: Delete messages + warning
- **Repeat Offense**: Timeout (1-24 hours)
- **Persistent**: Kick or ban

#### Inappropriate Content
- **NSFW in SFW channels**: Immediate delete + warning
- **Hate speech**: Immediate timeout/ban
- **Harassment**: Investigate + appropriate action

#### Rule Violations
- **Minor**: Warning + explanation
- **Major**: Timeout + warning
- **Severe**: Kick or ban

### Staff Training
1. **Rule Knowledge**: All staff must know rules thoroughly
2. **Bot Commands**: Training on ModuBot commands
3. **Escalation Procedures**: When to involve higher staff
4. **Documentation**: How to properly log actions

---

## Community Engagement Strategies

### Welcome Process
1. **Automated Welcome**: ModuBot sends welcome message
2. **Role Assignment**: Auto-assign "New Member" role
3. **Verification**: Optional verification process
4. **Introduction**: Encourage #introductions post

### Engagement Features
1. **XP System**: Reward active participation
2. **Events**: Regular community events
3. **Polls**: Use ModuBot's poll system for decisions
4. **Giveaways**: Regular giveaways for engagement
5. **Recognition**: Highlight helpful members

### Content Strategy
1. **Regular Announcements**: Keep community informed
2. **Discussion Topics**: Start conversations
3. **Q&A Sessions**: Regular community Q&As
4. **Feedback Collection**: Regular feedback requests

### Growth Strategies
1. **Invite Rewards**: Reward members for invites
2. **Partner Servers**: Cross-promotion
3. **Social Media**: Promote on other platforms
4. **SEO**: Optimize server for Discord discovery

---

## Troubleshooting & Maintenance

### Common Issues & Solutions

#### Bot Not Responding
1. Check bot status and uptime
2. Verify permissions
3. Check rate limits
4. Restart bot if necessary

#### Commands Not Working
1. Verify slash commands are deployed
2. Check bot permissions
3. Ensure user has required permissions
4. Check for typos in command names

#### Database Issues
1. Check database file permissions
2. Verify database integrity
3. Backup database regularly
4. Monitor database size

#### Permission Problems
1. Review role hierarchy
2. Check channel overrides
3. Verify bot role position
4. Test permissions systematically

### Regular Maintenance Tasks

#### Daily
- Monitor server activity
- Check for spam/rule violations
- Review support tickets
- Update announcements if needed

#### Weekly
- Review moderation logs
- Update server statistics
- Check bot performance
- Backup important data

#### Monthly
- Audit permissions and roles
- Review and update rules
- Analyze server growth
- Update bot and dependencies
- Clean up inactive channels

### Performance Optimization
1. **Database Optimization**: Regular cleanup of old data
2. **Bot Monitoring**: Monitor memory and CPU usage
3. **Rate Limit Management**: Avoid hitting Discord limits
4. **Caching**: Implement proper caching strategies

### Backup Strategy
1. **Database Backups**: Daily automated backups
2. **Configuration Backups**: Save bot settings
3. **Server Template**: Create server template backup
4. **Documentation**: Keep setup documentation updated

---

## Advanced Features & Customization

### Custom Commands
ModuBot supports custom tags/responses:
```
/tag create welcome Welcome to our server! Please read #rules
/tag create support Need help? Create a ticket with /ticket
```

### Automation Ideas
1. **Auto-role Assignment**: Based on reactions or verification
2. **Scheduled Announcements**: Regular community updates
3. **Auto-moderation**: Spam and link filtering
4. **Backup Systems**: Multiple bots for redundancy

### Analytics & Monitoring
1. **Server Statistics**: Track growth and activity
2. **Bot Performance**: Monitor uptime and response times
3. **User Engagement**: Track XP and participation
4. **Moderation Metrics**: Review action frequency

---

## Conclusion

This comprehensive guide provides everything needed to set up and maintain a professional Discord server with ModuBot. Remember that community building is an ongoing process that requires consistent effort, clear communication, and adaptability to your community's needs.

For additional support or questions about ModuBot, refer to the bot's help commands or contact the development team.

**Key Success Factors:**
- Consistent moderation
- Clear communication
- Regular engagement
- Continuous improvement
- Community feedback integration

Good luck building your Discord community! 🚀

---

## Quick Start Checklist

### Pre-Launch (Before Inviting Members)
- [ ] Create Discord application and bot
- [ ] Install and configure ModuBot
- [ ] Set up basic server structure (channels, roles)
- [ ] Configure bot permissions and settings
- [ ] Test all major bot functions
- [ ] Create server rules and guidelines
- [ ] Set up moderation logging
- [ ] Configure welcome system
- [ ] Add essential complementary bots
- [ ] Create server icon and branding

### Launch Day
- [ ] Announce server opening
- [ ] Monitor for issues
- [ ] Welcome first members personally
- [ ] Test support ticket system
- [ ] Ensure moderation tools work
- [ ] Gather initial feedback

### Post-Launch (First Week)
- [ ] Monitor server activity and engagement
- [ ] Adjust bot settings based on usage
- [ ] Address any technical issues
- [ ] Collect member feedback
- [ ] Fine-tune moderation policies
- [ ] Plan first community events

### Ongoing Maintenance
- [ ] Weekly bot performance review
- [ ] Monthly permission audit
- [ ] Regular rule updates
- [ ] Community feedback sessions
- [ ] Bot updates and maintenance
- [ ] Backup important data

---

## Emergency Procedures

### Bot Downtime
1. Announce downtime in server
2. Activate backup moderation bots
3. Increase manual moderation
4. Investigate and fix issues
5. Restore normal operations
6. Post-incident review

### Server Raid/Attack
1. Enable slowmode on all channels
2. Temporarily restrict new member permissions
3. Use ModuBot's lockdown features
4. Ban/kick malicious users
5. Review and strengthen security
6. Communicate with community

### Data Loss
1. Stop bot operations immediately
2. Restore from latest backup
3. Assess data loss extent
4. Communicate with affected users
5. Implement additional backup measures
6. Document incident for future prevention

Remember: A well-prepared server is a successful server! 🛡️
