# 9kDev — Implementation Guide

This guide explains how to **install, configure, and run** the bot (prefix `!9k` + slash `/`) in your server.

## Requirements

- Node.js (recommended: **v18+**)
- A Discord application with a bot created (token)
- Access to a **MySQL** database

## 1) Install

1. Clone/download the project.
2. Install dependencies:

```bash
npm install
```

## 2) Bot configuration

The project uses `config.js` (do not publish it).

1. Copy the example config:

2. Edit `config.js` and fill at least:

- `token` (bot token)
- `clientId` (Application ID)
- `guildId` (the server ID where you deploy slash commands)
- `Admin.SQL` (MySQL credentials)
- Optional: music/webhooks/etc depending on your setup


## 3) Bot permissions & intents

In the Discord Developer Portal (Bot → Privileged Gateway Intents), enable if you need them:

- **Server Members Intent** (roles/members features)
- **Message Content Intent** (required for prefix commands `!9k ...`)

In your server, the bot typically needs permissions like:

- View Channels
- Send Messages
- Embed Links
- Read Message History
- Add Reactions (for `emote`)
- Manage Roles (for `roles`, `colors`, `updateroles`, etc.)

## 5) Deploy slash commands (/)

Slash commands are deployed per guild using `deploy-commands.js`.

Run:

```bash
npm run deployC
```

If you don’t see the commands, wait a few seconds and restart Discord.

## 6) Run the bot

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

On startup you should see logs like `Loaded command: ...` and `Ready! Logged in as ...`.

## 7) Usage (Prefix + Slash)

The bot supports **dual mode**:

- Prefix: `!9k ...`
- Slash: `/...`

Examples:

- `!9k Servers` / `/servers`
- `!9k Invite` / `/invite`
- `!9k Emote` / `/emote` (sends a message in channel to react to)

### Slash subcommands

Some slash commands use subcommands:

- `/colors list`
- `/colors assign role:@ColorRole`
- `/roles list`
- `/roles toggle role:@ChannelRole`

## 8) Project structure

- `index.js`: bot bootstrap + message/interaction handlers.
- `deploy-commands.js`: deploy slash commands to the guild.
- `commands/`: commands grouped by category.
- `utils/functions.js`: helpers (embeds, cooldowns, DB, permissions).

## 9) Quick troubleshooting

### “No command matching X was found.”

- Restart the bot.
- Ensure the command exists under `commands/**` and `export default { name: '...' }` matches the slash name.

### Slash commands show “The application did not respond”

- The command took too long without `deferReply()`.
- For slow commands use `await interaction.deferReply()` then `editReply()`.

### Prefix commands don’t work

- Enable **Message Content Intent**.
- Check the bot has permission to read messages.

## 10) Deployment checklist

- [ ] `npm install`
- [ ] `config.js` with token/clientId/guildId
- [ ] Intents enabled (Message Content, Members if needed)
- [ ] `npm run deployC`
- [ ] `npm run dev` / `npm start`
