# 9k Discord Bot

A feature-rich Discord bot with economy, games, moderation, and utility commands.

##  Features

- **Economy System**: Virtual currency, shop, transfers, and Robux trading
- **Fun Games**: Blackjack, slots, coinflip, number guessing, work system
- **Moderation Tools**: Message tracking, role management, force save
- **Utility Commands**: Server info, user profiles, color roles, emotes
- **Music System**: YouTube integration (limited servers)

##  Prerequisites

- Node.js v16 or higher
- MySQL database
- Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd 9k
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the bot**
   ```bash
   cp config.example.js config.js
   ```
   
   Edit `config.js` and add your:
   - Discord bot token
   - Client ID
   - Database credentials
   - Webhook tokens
   - Server invites

4. **Set up the database**
   
   Create a MySQL database and tables for:
   - `BotUsers` - User data (userid, messages, exp, cash, websiteuser)
   - `Messages` - Message tracking (serverid, userid, messageid, channelid, senton)

5. **Deploy slash commands**
   ```bash
   npm run deploy-commands
   ```

6. **Start the bot**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
9k/
├── commands/          # Command modules
│   ├── economy/      # Economy commands (shop, transfer, robux)
│   ├── fun/          # Game commands (blackjack, slots, work, etc.)
│   ├── moderation/   # Moderation tools
│   ├── music/        # Music playback
│   └── utility/      # Utility commands
├── utils/            # Helper functions
├── config.js         # Bot configuration (gitignored)
├── index.js          # Main bot file
└── deploy-commands.js # Slash command deployment
```

## 🎮 Commands

### Economy
- `/shop` - View shop items
- `/transfer` - Send money to other users
- `/robux` - Trade bot cash for Robux

### Fun
- `!9k work` - Random work events for cash
- `!9k bj` - Play blackjack
- `!9k slots` - Slot machine game
- `!9k coin flip` - Flip a coin
- `!9k guess` - Number guessing game

### Utility
- `!9k help` - Command list
- `!9k user` - User statistics
- `!9k invite` - Bot invite link
- `!9k color @role` - Get color role
- `!9k role @role` - Get channel role

### Moderation
- `!9k messages` - Server message statistics
- `!9k forcesave` - Force save user data (admin only)

## ⚙️ Configuration

Key configuration options in `config.js`:

```javascript
export default {
    token: 'YOUR_BOT_TOKEN',
    clientId: 'YOUR_CLIENT_ID',
    database: {
        host: '127.0.0.1',
        user: 'username',
        password: 'password',
        database: 'database_name'
    },
    shop: {
        bank: {
            botCash: 0,
            robux: 300,
            robuxTradeRate: 0.02
        },
        items: [/* shop items */]
    }
}
```

##  ES6 Migration (Latest Update)

The project has been fully migrated to ES6 modules:

- Uses `import`/`export` instead of `require`/`module.exports`
- Uses `const`/`let` instead of `var`
- Configured with `"type": "module"` in package.json
- All 25 files converted to modern JavaScript

### Important Notes for ES6:
- All imports must include `.js` file extensions
- `config.js` must use `export default {}`
- Some packages require namespace imports: `import * as package from 'package'`
