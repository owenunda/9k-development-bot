# 📋 Emoji Copy Command Guide

## Overview
The `/copy emoji` command allows anyone on your server to copy emojis from any Discord server and upload them to your own server. It works similar to emoji.gg's functionality with an easy-to-use button interface.

## Features
- 🎨 Copy both static and animated emojis
- 📸 Display emoji preview and information
- ➕ One-click "Add Emoji to Server" button
- ✅ Automatic success confirmation
- 🔐 Requires bot's emoji management permissions

## How to Use

### Step 1: Get the Emoji
First, you need to get an emoji reference. You can:
- React with any emoji in Discord (right-click → Add Reaction)
- Copy an emoji link from emoji.gg or other sources
- Get an emoji from another server

### Step 2: Use the Command
```
/copy emoji <emoji>
```

**Example:**
```
/copy emoji <a:pepecreditcard:1425119298111799506>
/copy emoji <:fire:1234567890123456789>
```

### Step 3: Click the Button
The bot will show you:
- 🖼️ Large preview of the emoji
- 📝 Emoji name and ID
- ⚙️ Whether it's animated or static

Click the **"Add Emoji to Server"** button to upload it to your server.

### Step 4: Confirmation
You'll receive a success message:
```
✅ Emoji Added!
:pepecreditcard: The pepecreditcard emoji was added successfully!
```

## Requirements
- The bot must have **Manage Emoji and Stickers** permission in your server
- You must have permission to use commands in the channel
- The emoji must still be accessible from Discord's servers

## Error Messages

### ❌ Invalid Emoji
**When:** Emoji format is incorrect  
**Fix:** Use the format `<:name:id>` for static or `<a:name:id>` for animated emojis

### ❌ Emoji Not Found
**When:** The emoji no longer exists or can't be accessed  
**Fix:** Try with a different emoji

### ❌ Failed to add emoji
**When:** Bot lacks emoji management permissions or server limit reached  
**Fix:** 
- Check bot permissions (Manage Emojis and Stickers)
- Discord servers have emoji limits based on server boost level

## Getting Emoji IDs

### Method 1: Discord Native
1. Enable Developer Mode in Discord Settings → App Settings → Advanced
2. Right-click on an emoji and select "Copy User ID" (for custom emojis)

### Method 2: In-Bot
1. React to a message with the emoji
2. Use `/emote` command to view emoji details
3. Copy the emoji ID shown

### Method 3: From Links
- emoji.gg provides emoji in the format: `<:name:id>`
- Many Discord bots display emojis in this format

## FAQ

**Q: Can I upload emojis from other servers?**  
A: Yes! As long as the emoji is accessible from Discord's CDN.

**Q: Will the emoji keep the same name?**  
A: Yes, it will have the original emoji name (with special characters removed for Discord compatibility).

**Q: How many emojis can I add?**  
A: It depends on your server's emoji limit based on boost level:
- No boosts: 50 emojis
- Level 1: 100 emojis
- Level 2: 150 emojis
- Level 3: 250 emojis

**Q: Can I undo after adding an emoji?**  
A: Yes, any server admin can delete it from Server Settings → Emoji.

## Technical Details
- Emojis are fetched from Discord's CDN
- File size limits apply (max ~256KB)
- Only emoji names with alphanumeric characters and underscores are supported
- The command works with both static PNG and animated GIF emojis

## Support
If you encounter issues:
1. Verify bot has "Manage Emojis and Stickers" permission
2. Check that the emoji still exists on Discord
3. Ensure your server hasn't reached the emoji limit
4. Try with a different emoji to test functionality
