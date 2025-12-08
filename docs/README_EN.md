# 📚 Project Documentation - 9k Discord Bot



## 📁 Project Structure

```
9k/
├── commands/           # Commands organized by category
│   ├── economy/       # Virtual economy commands
│   ├── fun/           # Games and entertainment
│   ├── moderation/    # Moderation tools
│   ├── music/         # Music playback
│   └── utility/       # Utility commands
├── utils/             # Reusable helper functions
├── docs/              # Project documentation
├── config.js          # Bot configuration
├── config.example.js  # Configuration template
├── index.js           # Main entry point
├── deploy-commands.js # Deploys slash commands to Discord
└── package.json       # Dependencies and metadata
```

---

## 📄 File Explanations

### **Core Files**

#### `index.js`
**Purpose:** Main entry point of the bot.

**Features:**
- Initializes Discord client with necessary intents
- Dynamically loads all commands from category folders
- Handles bot events (messages, interactions, new members)
- Manages both text commands and slash commands (/)
- Implements cooldown system to prevent spam
- Connects to MySQL database for data persistence
- Manages user system and virtual economy

**Why it's important:** It's the brain of the bot that coordinates all functionalities.

---

#### `deploy-commands.js`
**Purpose:** Registers slash commands with Discord's API.

**Features:**
- Scans all command folders
- Extracts commands with slash command definitions
- Registers them globally with Discord via REST API
- Provides detailed feedback about the deployment process

**Why it's important:** Without running this script, slash commands (/) won't be available in Discord.

**When to run:** Every time you add, modify, or remove a slash command.

---

#### `config.js`
**Purpose:** Stores all sensitive and customizable bot configuration.

**Contains:**
- Discord bot token
- Application client ID
- MySQL database credentials
- Webhook configurations
- Economy system settings (bank, shop items)
- Redeemable codes
- Music system configuration
- Bot URLs and icons

**⚠️ IMPORTANT:** This file contains sensitive information and should NOT be shared publicly.

---

#### `config.example.js`
**Purpose:** Configuration template for new developers.

**Usage:**
1. Copy this file as `config.js`
2. Fill in with your own credentials and settings
3. Keep this file in the repository as reference

**Why it's important:** Allows other developers to know what configurations are needed without exposing sensitive data.

---

### **`commands/` Folder**

This folder contains all bot commands organized by category. Each command is an independent module.

#### `commands/economy/`
Commands related to the virtual economy system.

- **`robux.js`** - Manages buying/selling virtual Robux
- **`shop.js`** - Displays shop items and roles
- **`transfer.js`** - Allows transferring money between users

---

#### `commands/fun/`
Entertainment and game commands.

- **`blackjack.js`** - Blackjack game with betting
- **`coinflip.js`** - Coin flip with betting
- **`guess.js`** - Number guessing game
- **`redeem.js`** - Redeem codes for rewards
- **`slots.js`** - Slot machine
- **`work.js`** - Earn virtual money by working

---

#### `commands/moderation/`
Tools for server moderators.

- **`messages.js`** - View message statistics
- **`save.js`** - Manually save user data
- **`updateRoles.js`** - Update user roles

---

#### `commands/music/`
Music playback system.

- **`play.js`** - Play YouTube music in voice channels

---

#### `commands/utility/`
General utility commands.

- **`9ktube.js`** - Search YouTube videos
- **`colors.js`** - Manage color roles
- **`emote.js`** - Manage custom emotes
- **`help.js`** - Display command help
- **`invite.js`** - Generate invitation links
- **`roles.js`** - Manage server roles
- **`servers.js`** - Display server information
- **`userinfo.js`** - Display user information

---

### **`utils/` Folder**

#### `functions.js`
**Purpose:** Library of reusable helper functions.

**Main functions:**
- **Cooldown management:** `SetCoolDown()`, `CheckCoolDown()`, `AlertCoolDown()`
- **User management:** `GetUser()`, `AddUser()`, `SaveUser()`
- **Database:** `ConnectDB()`, `ReturnDB()`, `AddServerMessageSQL()`
- **Utilities:** `CreateEmbed()`, `SearchString()`, `CompareDates()`
- **Permissions:** `CheckAdmin()`

**Why it's important:** Prevents code duplication and centralizes common logic.

---

### **`docs/` Folder**

- **`README_ES.md`** - Complete documentation in Spanish
- **`README_EN.md`** - Complete documentation in English (this file)

**Purpose:** Provide clear and accessible documentation in multiple languages.

---

## ✅ Benefits of This Organization

### **1. Modularity**
Each command is an independent file. This allows:
- Adding new commands without modifying existing code
- Removing commands by simply deleting the file
- Testing commands in isolation

### **2. Scalability**
The category-based structure facilitates:
- Finding commands quickly
- Adding new categories as needed
- Keeping the project organized as it grows

### **3. Maintainability**
- **Separation of concerns:** Each file has a clear purpose
- **Reusable code:** Common functions are in `utils/`
- **Centralized configuration:** All configuration is in one place

### **4. Collaboration**
- **Easy onboarding:** New developers can understand the structure quickly
- **Parallel work:** Multiple developers can work on different commands without conflicts
- **Simpler code reviews:** Changes are isolated to specific files

### **5. Security**
- **Credential separation:** `config.example.js` allows sharing structure without exposing sensitive data
- **Access control:** Easy to implement permissions per command category

---

##  Disadvantages of Having Everything in One File

If all code were in a single file (e.g., `bot.js`):

### **Maintenance Issues**
-  Thousands of lines file difficult to navigate
-  Hard to find and fix bugs
-  High risk of Git conflicts with multiple developers

### **Scalability Issues**
-  Adding features requires modifying a giant file
-  Higher probability of breaking existing code
-  Difficult to disable specific features

### **Performance Issues**
-  Loads all code even if you only use one function
-  Difficult to implement lazy loading
-  Higher memory consumption

### **Collaboration Issues**
-  Multiple people can't work simultaneously
-  Constant conflicts in version control
-  Extremely complex code reviews

---

## 🚀 Getting Started

### **Installation**
```bash
# Install dependencies
npm install

# Configure the bot
cp config.example.js config.js
# Edit config.js with your credentials

# Deploy slash commands
node deploy-commands.js

# Start the bot
node index.js
```

### **Adding a New Command**
1. Create file in appropriate category folder: `commands/[category]/mycommand.js`
2. Use this template:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    name: 'mycommand',
    aliases: ['!mycommand', '!mc'],
    data: new SlashCommandBuilder()
        .setName('mycommand')
        .setDescription('Command description'),
    async execute(interaction, User, Bot) {
        // Your code here
        await interaction.reply('Hello!');
    },
};
```

3. Run `node deploy-commands.js` if it's a slash command
4. Restart the bot

---

## 📦 Main Dependencies

- **discord.js** - Main library for interacting with Discord
- **mysql2** - MySQL database connection
- **canvas** - Dynamic image generation
- **ytdl-core / discord-ytdl-core** - YouTube music playback
- **chartjs-node-canvas** - Chart generation
- **date-fns** - Date manipulation

---

## 🔧 Maintenance

### **Update Dependencies**
```bash
npm update
```

### **Database Backup**
Make sure to regularly backup the MySQL database containing:
- User data (`BotUsers`)
- Message history (`Messages`)

### **Logs and Debugging**
The bot logs errors to the console. Consider implementing a more robust logging system for production.

---