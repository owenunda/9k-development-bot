/* Discord Requires */
import { Client, Events, GatewayIntentBits, EmbedBuilder, WebhookClient, Collection, GatewayDispatchEvents } from 'discord.js';
import fs from 'fs';
import path from 'path';
import config from './config.js';
import logger from './utils/logger.js';
import { GetUser, AddUser, SearchString, SaveBotUsers, ReturnDB, AlertCoolDown, SetCoolDown, CheckCoolDown, CheckMonthlyReset, GetActiveAntiSpam, ShouldShowAntiSpam, GetRandomQuestion, CreateEmbed, LoadRedeemCodes, CheckRestricted, IncrementSpamScore, ResetSpamScore, SetRestricted, ProcessSpamDecay } from './utils/functions.js';
import { getUserTtsLanguage, isTtsTrack, queueTtsPlayback } from './utils/tts.js';
import * as mysql2 from 'mysql2';
import * as canvas from 'canvas';
import * as ytSearch from 'yt-search';
import * as ytdl from 'discord-ytdl-core';
import * as voice from '@discordjs/voice';
import * as chartjs from 'chartjs-node-canvas';
import { Riffy } from 'riffy';
import giveawayCommand from './commands/giveaway/giveaway.js';

/*
 * UX IMPROVEMENTS IMPLEMENTED:
 * 1. Interactive help system with categorized commands
 * 2. Enhanced command hierarchy with better subcommands
 * 3. Fun/gambling commands tagged as MOVABLE for future 9kFun bot
 * 4. Improved command descriptions and user experience
 * 5. Backward compatibility maintained for all existing functionality
 */

/* Main Variables */
const Bot = {};
Bot.Users = false;
Bot.Servers = false;
Bot.Token = config.token;
Bot.MySql = mysql2;
Bot.Canvas = canvas;
Bot.YTS = ytSearch;
Bot.YTD = ytdl;
Bot.DVC = voice;
Bot.ChartJS = chartjs;
Bot.Invite = config.bot.invite;
Bot.ServerInvite = config.bot.serverInvite;
Bot.Client = new Client({
        intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildMessageReactions
        ],
        partials: ['MESSAGE', 'CHANNEL']
});
Bot.ICON = config.bot.icon;
Bot.Admin = {};
Bot.Admin.SQL = {};
Bot.Admin.SQL.User = config.database.user;
Bot.Admin.SQL.Password = config.database.password;
Bot.Admin.SQL.Host = config.database.host || '127.0.0.1';
Bot.Admin.SQL.Database = config.database.database || 'webdata';
Bot.Admin.SQL.Port = config.database.port || 3306;
Bot.Codes = [];

Bot.WebHooks = {
        Team: new WebhookClient({
                id: config.webhooks.team.id,
                token: config.webhooks.team.token,
        })
};

// Bot.Shop = {};
// Bot.ServerMessages = [];
// Bot.Shop.Bank = {};
// Bot.Shop.Bank.BotCash = config.shop.bank.botCash;
// Bot.Shop.Bank.Robux = config.shop.bank.robux;
// Bot.Shop.Bank.RobuxTradeRate = config.shop.bank.robuxTradeRate;
// Bot.Shop.Items = config.shop.items.map(item => ({
//         Title: item.title,
//         Desc: item.desc,
//         Price: item.price,
//         LimitedStock: item.limitedStock,
//         Role: item.role
// }));

Bot.Embed = {};
Bot.Embed.Color = 5793266;
Bot.Embed.Title = 'Default!';
Bot.Embed.URL = false;//'https://9000inc.com'
Bot.Embed.Author = {};
Bot.Embed.Author.name = '9k Bot Service';
Bot.Embed.Author.iconURL = Bot.ICON;
Bot.Embed.Author.url = 'https://9000inc.com';
Bot.Embed.Thumbnail = false;//Bot.ICON

Bot.SongSys = {};
Bot.SongSys.Servers = [];
Bot.SongSys.AllowedServers = config.music.allowedServers;
Bot.TTS = {
        UserLanguage: new Map(),
        AutoChannels: new Map(),
        LastTrackTypeByGuild: new Map(),
};

const messageCashCooldowns = new Map();
const userCommandHistory = new Map(); // Tracks last 3 commands per user: { userId: [cmd1, cmd2, cmd3] }
const restrictionAlertCooldowns = new Map();

function getMessageCashCooldownMs() {
        return 14000 + Math.floor(Math.random() * 3001);
}

// Initialize Lavalink Manager with Riffy
Bot.Client.riffy = new Riffy(Bot.Client, config.nodes, {
        send: (payload) => {
                const guild = Bot.Client.guilds.cache.get(payload.d.guild_id);
                if (guild) guild.shard.send(payload);
        },
        defaultSearchPlatform: 'ytmsearch',
        restVersion: 'v4'
});

// Load Commands
Bot.Commands = new Collection();
const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
                const command = await import(`./commands/${folder}/${file}`);
                Bot.Commands.set(command.default.name, command.default);
                logger.info(`Loaded command: ${command.default.name}`);
        }
}

/* Init */
ReturnDB('BotUsers', Bot).then(function (value) { Bot.Users = value });
ReturnDB('BotServers', Bot).then(function (value) { Bot.Servers = value });
// Message logging/counting disabled (handled by another bot)
Bot.ServerMessages = [];

// Store AFK timeouts per guild
const afkTimeouts = new Map();
const lastTrackStartByGuild = new Map();

// Lavalink/Riffy Events

Bot.Client.riffy.on('trackStart', async (player, track) => {
        // Clear AFK timeout when a new track starts
        if (afkTimeouts.has(player.guildId)) {
                clearTimeout(afkTimeouts.get(player.guildId));
                afkTimeouts.delete(player.guildId);
        }

        // Some nodes can emit duplicate trackStart rapidly; suppress duplicates.
        const startKey = `${track.info?.identifier || track.info?.title || 'unknown'}:${track.info?.length || 0}`;
        const previousStart = lastTrackStartByGuild.get(player.guildId);
        const now = Date.now();
        if (previousStart && previousStart.key === startKey && (now - previousStart.timestamp) < 5000) {
                return;
        }
        lastTrackStartByGuild.set(player.guildId, { key: startKey, timestamp: now });

        const currentTrackIsTts = isTtsTrack(track);
        Bot.TTS.LastTrackTypeByGuild.set(player.guildId, currentTrackIsTts ? 'tts' : 'music');

        if (currentTrackIsTts) {
                return;
        }

        const channel = Bot.Client.channels.cache.get(player.textChannel);
        if (channel) {
                channel.send(`Now playing: **${track.info.title}** by **${track.info.author}**`);
        }
});

Bot.Client.riffy.on('trackError', async (player, track, payload) => {
        const channel = Bot.Client.channels.cache.get(player.textChannel);
        const reason = payload?.exception?.message || payload?.exception?.cause || 'Unknown Lavalink error';
        logger.error(`[Riffy] Track error in guild ${player.guildId}: ${reason}`);
        if (isTtsTrack(track)) {
                return;
        }
        if (channel) {
                channel.send(`Error playing: **${track.info.title}**\nReason: ${reason}`);
        }
});

Bot.Client.riffy.on('queueEnd', async (player) => {
        lastTrackStartByGuild.delete(player.guildId);
        const lastTrackType = Bot.TTS.LastTrackTypeByGuild.get(player.guildId) || 'music';
        const channel = Bot.Client.channels.cache.get(player.textChannel);
        if (channel && lastTrackType !== 'tts') {
                channel.send('Queue has ended. Disconnecting in 5 minutes if no new songs are added...');
        }
        // Set 5-minute AFK timeout
        const timeout = setTimeout(() => {
                const currentPlayer = Bot.Client.riffy.players.get(player.guildId);
                if (currentPlayer && !currentPlayer.playing) {
                        if (channel && lastTrackType !== 'tts') {
                                channel.send('Disconnected due to inactivity.');
                        }
                        currentPlayer.destroy();
                }
                afkTimeouts.delete(player.guildId);
                Bot.TTS.LastTrackTypeByGuild.delete(player.guildId);
        }, 5 * 60 * 1000); // 5 minutes
        afkTimeouts.set(player.guildId, timeout);
});

// Handle voice state & voice server updates for Riffy
// Forward only voice packets to avoid unexpected duplicate handling.
const forwardVoicePacketToRiffy = (packet, source) => {
        if (!packet?.t || !packet?.d?.guild_id) return;
        if (![GatewayDispatchEvents.VoiceStateUpdate, GatewayDispatchEvents.VoiceServerUpdate].includes(packet.t)) return;

        // Skip forwarding when TTS is using @discordjs/voice for this guild
        if (Bot.TTS?._ttsGuilds?.has(packet.d.guild_id)) return;

        Bot.Client.riffy.updateVoiceState(packet).catch((error) => {
                logger.error(`[Riffy] Failed forwarding ${packet.t} from ${source}: ${error.message}`);
        });
};

Bot.Client.on('raw', (d) => {
        forwardVoicePacketToRiffy(d, 'raw');
});

// Also listen through ws dispatch events for better compatibility across discord.js versions.
Bot.Client.ws.on(GatewayDispatchEvents.VoiceStateUpdate, (data) => {
        forwardVoicePacketToRiffy({ t: GatewayDispatchEvents.VoiceStateUpdate, d: data }, 'ws');
});

Bot.Client.ws.on(GatewayDispatchEvents.VoiceServerUpdate, (data) => {
        forwardVoicePacketToRiffy({ t: GatewayDispatchEvents.VoiceServerUpdate, d: data }, 'ws');
});

Bot.Client.once(Events.ClientReady, readyClient => {
        logger.info(`Ready! Logged in as ${readyClient.user.tag}`);
        Bot.Client.user.setPresence({ activity: { name: 'BotActivity', type: 'WATCHING' }, status: 'online' });
        // Initialize Riffy with bot's user ID
        Bot.Client.riffy.init(readyClient.user.id);
        CheckMonthlyReset(Bot);
        setInterval(function () { SaveBotUsers(Bot); CheckMonthlyReset(Bot); }, 5000000)
        // Restore active giveaways
        giveawayCommand.restoreActiveGiveaways(Bot.Client);

        // Load Redeem Codes dynamically
        LoadRedeemCodes(Bot).then(codes => {
                Bot.Codes = codes.map(c => c.code);
                logger.info(`Loaded ${codes.length} redeem codes from DB.`);
        });
        // Reload every 10 minutes (600000 ms) for hot reloading
        setInterval(() => {
                LoadRedeemCodes(Bot).then(codes => {
                        Bot.Codes = codes.map(c => c.code);
                });
        }, 600000);

        // Initialize Discord-to-Channel logging
        logger.initDiscord(Bot.Client, '1487161342208245790');

        // Global Anti-Spam Decay (Every 5 minutes)
        setInterval(() => {
            ProcessSpamDecay(Bot);
        }, 5 * 60 * 1000);
});

Bot.Client.on('messageCreate', msg => {
        if (msg.author.bot) { return }

        // 1. Restricted Mode Check
        if (CheckRestricted(msg.author.id, Bot)) {
            const lastAlert = restrictionAlertCooldowns.get(msg.author.id) || 0;
            if (Date.now() - lastAlert > 60000) { // 1 min cooldown to avoid self-spamming
                restrictionAlertCooldowns.set(msg.author.id, Date.now());
                const UserObj = GetUser(msg.author.id, Bot);
                const timeLeft = UserObj.restricted_until ? Math.max(1, Math.ceil((new Date(UserObj.restricted_until) - Date.now()) / 60000)) : 5;
                msg.reply(`**Restricted.** You are currently restricted from using the bot for another **${timeLeft} minutes**.`);
            }
            return; // Bot ignores completely
        }

        let cmdrunning = false;
        let User = GetUser(msg.author.id, Bot);
        if (User == false) {
                User = {};
                User.userid = msg.author.id;
                User.exp = 0;
                User.messages = 0;
                User.cash = 0;
                User.spam_score = 0;
                Bot.Users.push(User);
                AddUser(User.userid, Bot);
        }
        User = GetUser(msg.author.id, Bot);
        //User.messages += 1;

                handleAutoTtsMessage(msg, Bot).catch((error) => {
                        logger.error({ message: 'Auto TTS handler error', stack: error.stack, label: 'AutoTTS' });
                });

        const messageCashKey = `MsgCash-${msg.author.id}`;
        const now = Date.now();
        const currentMessageCashCooldown = messageCashCooldowns.get(messageCashKey) || 0;
        if (now >= currentMessageCashCooldown) {
                User.cash += 1;
                messageCashCooldowns.set(messageCashKey, now + getMessageCashCooldownMs());
        }

        // Message logging/counting disabled (handled by another bot)

        const mtext = msg.content;

        // Anti-Spam Check
        const activeAntiSpam = GetActiveAntiSpam();
        if (activeAntiSpam.has(msg.author.id)) {
                const challenge = activeAntiSpam.get(msg.author.id);
                if (msg.content.toLowerCase().trim() === challenge.answer) {
                        activeAntiSpam.delete(msg.author.id);
                        ResetSpamScore(msg.author.id, Bot);
                        return msg.reply('**Verified.** Your spam score has been reset.');
                } else {
                        // Failed Captcha
                        activeAntiSpam.delete(msg.author.id);
                        SetRestricted(msg.author.id, 5, Bot); // 5 mins
                        return msg.reply('**Captcha Failed.** You have been restricted for 5 minutes. The bot will no longer respond to you.');
                }
        }


})

async function handleAutoTtsMessage(msg, Bot) {
        if (!msg.guild || !msg.content?.trim()) return;
        if (!Bot.TTS?.AutoChannels) return;

        const autoConfig = Bot.TTS.AutoChannels.get(msg.guild.id);
        if (!autoConfig) return;

        if (msg.channel.id !== autoConfig.textChannelId) return;

        // Skip auto-TTS if music is playing
        const riffyPlayer = Bot.Client?.riffy?.players?.get(msg.guild.id);
        if (riffyPlayer && (riffyPlayer.playing || riffyPlayer.paused)) return;

        const member = await msg.guild.members.fetch(msg.author.id).catch(() => null);
        if (!member?.voice?.channel) return;
        if (member.voice.channel.id !== autoConfig.voiceChannelId) return;

        const preferredLanguage = getUserTtsLanguage(Bot, msg.author.id, 'en');

        await queueTtsPlayback({
                Bot,
                client: Bot.Client,
                guild: msg.guild,
                member,
                textChannelId: msg.channel.id,
                requester: msg.author,
                rawText: msg.content.trim(),
                targetLanguage: preferredLanguage,
                translate: autoConfig.translate || false,
        });
}

// Handle slash command interactions and button interactions
Bot.Client.on(Events.InteractionCreate, async interaction => {
        // INTERACTIVE IMPROVEMENT: Handle button interactions
        if (interaction.isButton()) {
                const customId = interaction.customId;
                
                // Get or create user for button interactions
                let User = GetUser(interaction.user.id, Bot);
                if (User == false) {
                        User = {};
                        User.userid = interaction.user.id;
                        User.exp = 0;
                        //User.messages = 0;
                        User.cash = 0;
                        Bot.Users.push(User);
                        AddUser(User.userid, Bot);
                        User = GetUser(interaction.user.id, Bot);
                }

                // Route button interactions to appropriate commands
                if (customId.startsWith('shop_buy_')) {
                        const command = Bot.Commands.get('shop');
                        if (command) {
                                try {
                                        await command.execute(interaction, User, Bot);
                                } catch (error) {
                                        logger.error({ message: 'Button interaction error', stack: error.stack, label: 'ButtonInteraction' });
                                }
                        }
                } else if (customId.startsWith('color_assign_') || customId.startsWith('color_page_')) {
                        const command = Bot.Commands.get('colors');
                        if (command) {
                                try {
                                        await command.execute(interaction, User, Bot);
                                } catch (error) {
                                        logger.error({ message: 'Button interaction error', stack: error.stack, label: 'ButtonInteraction' });
                                }
                        }
                } else if (customId.startsWith('role_toggle_')) {
                        const command = Bot.Commands.get('roles');
                        if (command) {
                                try {
                                        await command.execute(interaction, User, Bot);
                                } catch (error) {
                                        logger.error({ message: 'Button interaction error', stack: error.stack, label: 'ButtonInteraction' });
                                }
                        }
                } else if (customId.startsWith('userinfo:')) {
                        const command = Bot.Commands.get('userinfo');
                        if (command) {
                                try {
                                        await command.execute(interaction, User, Bot);
                                } catch (error) {
                                        logger.error({ message: 'Button interaction error', stack: error.stack, label: 'ButtonInteraction' });
                                }
                        }
                } else if (customId.startsWith('giveaway_entered_page_')) {
                        const command = Bot.Commands.get('giveaway');
                        if (command) {
                                try {
                                        await command.execute(interaction, User, Bot);
                                } catch (error) {
                                        logger.error({ message: 'Button interaction error', stack: error.stack, label: 'ButtonInteraction' });
                                }
                        }
                } else if (customId.startsWith('copy_add_emoji_')) {
                        const command = Bot.Commands.get('copy');
                        if (command) {
                                try {
                                        await command.execute(interaction, User, Bot);
                                } catch (error) {
                                        logger.error({ message: 'Button interaction error', stack: error.stack, label: 'ButtonInteraction' });
                                }
                        }
                }
                return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = Bot.Commands.get(interaction.commandName);

        if (!command) {
                logger.warn(`No command matching ${interaction.commandName} was found.`);
                try {
                        await interaction.reply({
                                content: `Command "/${interaction.commandName}" is not loaded on the bot right now. Try restarting the bot.`,
                                ephemeral: true,
                        });
                } catch {
                        // ignore if interaction already expired
                }
                return;
        }

        try {
                // Restricted Check
                if (CheckRestricted(interaction.user.id, Bot)) {
                    const lastAlert = restrictionAlertCooldowns.get(interaction.user.id) || 0;
                    if (Date.now() - lastAlert > 60000) {
                        restrictionAlertCooldowns.set(interaction.user.id, Date.now());
                        const UserObj = GetUser(interaction.user.id, Bot);
                        const timeLeft = UserObj.restricted_until ? Math.max(1, Math.ceil((new Date(UserObj.restricted_until) - Date.now()) / 60000)) : 5;
                        await interaction.reply({ 
                            content: `**Restricted.** You are currently restricted from using the bot for another **${timeLeft} minutes**.`, 
                            ephemeral: true 
                        }).catch(() => {});
                    }
                    return;
                }

                // Get or create user
                let User = GetUser(interaction.user.id, Bot);
                if (User == false) {
                        User = {};
                        User.userid = interaction.user.id;
                        User.exp = 0;
                        User.messages = 0;
                        User.cash = 0;
                        User.spam_score = 0;
                        Bot.Users.push(User);
                        AddUser(User.userid, Bot);
                        User = GetUser(interaction.user.id, Bot);
                }

                // Anti-Spam Check for Slash Commands
                const activeAntiSpam = GetActiveAntiSpam();
                if (activeAntiSpam.has(interaction.user.id)) {
                    return interaction.reply({ 
                        content: `You have an active anti-spam control. Please type the requested word in the channel before using more commands.`, 
                        ephemeral: true 
                    });
                }

                // Scoring Logic
                IncrementSpamScore(interaction.user.id, 1, Bot);
                if (command.botPoints) IncrementSpamScore(interaction.user.id, 1, Bot);

                // Repetition tracking
                let history = userCommandHistory.get(interaction.user.id) || [];
                history.push(command.name);
                if (history.length > 3) history.shift();
                userCommandHistory.set(interaction.user.id, history);

                if (history.length === 3 && history.every(v => v === command.name)) {
                    IncrementSpamScore(interaction.user.id, 5, Bot);
                }

                // Score-based Captcha Trigger
                if ((User.spam_score || 0) >= 100) {
                    const challenge = GetRandomQuestion(Bot);
                    activeAntiSpam.set(interaction.user.id, challenge);
                    return interaction.reply({ content: challenge.text });
                }

                if (ShouldShowAntiSpam()) {
                    const challenge = GetRandomQuestion(Bot);
                    activeAntiSpam.set(interaction.user.id, challenge);
                    return interaction.reply({ content: challenge.text });
                }

                // Execute the command
                await command.execute(interaction, User, Bot);
        } catch (error) {
                logger.error({ message: `Error executing command /${interaction.commandName}`, stack: error.stack, label: 'CommandExecute' });
                try {
                        if (interaction.replied || interaction.deferred) {
                                await interaction.followUp({ content: 'There was an error while executing this command!', flags: 64 });
                        } else {
                                await interaction.reply({ content: 'There was an error while executing this command!', flags: 64 });
                        }
                } catch (replyError) {
                        // Interaction already expired or failed, just log it
                        logger.error({ message: 'Could not send error response', stack: replyError.stack, label: 'CommandReplyError' });
                }
        }
});


// Auto-enroll servers when bot joins
Bot.Client.on('guildCreate', async guild => {
        const { AddServer } = await import('./utils/functions.js');
        logger.info(`Bot joined new server: ${guild.name} (${guild.id})`);
        
        // Auto-register server without invite link
        AddServer(guild.id, '', Bot);
        logger.info(`Auto-enrolled server: ${guild.name} to voting system`);
});

Bot.Client.on('guildMemberAdd', async member => {
        if (member.guild.id == '440275828509507597') {
        }
        else { return }
        const role = member.guild.roles.cache.find(r => r.name === 'Memeber');
        if (!role) {
                return;
        }
        try {
                await member.roles.add(role);
        } catch (error) { logger.error({ message: 'Error adding Memeber role', error, label: 'Event: guildMemberAdd' }); }
});

// Giveaway reaction listener
Bot.Client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return;
        
        try {
                const { default: Giveaway } = await import('./database/models/Giveaway.js');
                const giveaway = await Giveaway.findOne({ messageId: reaction.message.id });
                
                if (giveaway && !giveaway.ended) {
                        const metadata = JSON.parse(giveaway.metadata || '{}');
                        const requiredRoleId = metadata.requiredRoleId || null;
                        const requiredReaction = metadata.reaction || '🎉';

                        // Only accept the configured reaction emoji for this giveaway.
                        const reactionName = reaction.emoji?.name || '';
                        if (reactionName !== requiredReaction) {
                                return;
                        }

                        if (requiredRoleId) {
                                const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
                                const hasRole = member?.roles?.cache?.has(requiredRoleId);
                                if (!hasRole) {
                                        await reaction.users.remove(user.id).catch(() => {});
                                        return;
                                }
                        }

                        if (!giveaway.participants.includes(user.id)) {
                                giveaway.participants.push(user.id);
                                await giveaway.save();
                        }
                }
        } catch (error) {
                logger.error({ message: 'Error handling reaction add', stack: error.stack, label: 'ReactionAdd' });
        }
});

Bot.Client.on('messageReactionRemove', async (reaction, user) => {
        if (user.bot) return;
        
        try {
                const { default: Giveaway } = await import('./database/models/Giveaway.js');
                const giveaway = await Giveaway.findOne({ messageId: reaction.message.id });
                
                if (giveaway && !giveaway.ended) {
                        const metadata = JSON.parse(giveaway.metadata || '{}');
                        const requiredReaction = metadata.reaction || '🎉';
                        const reactionName = reaction.emoji?.name || '';
                        if (reactionName !== requiredReaction) {
                                return;
                        }

                        const index = giveaway.participants.indexOf(user.id);
                        if (index > -1) {
                                giveaway.participants.splice(index, 1);
                                await giveaway.save();
                        }
                }
        } catch (error) {
                logger.error({ message: 'Error handling reaction remove', stack: error.stack, label: 'ReactionRemove' });
        }
});

// Log in to Discord with your client's token
Bot.Client.login(Bot.Token);

// Graceful Shutdown Logic
async function gracefulShutdown(signal) {
    logger.info(`[System] Signal ${signal} received. Initiating graceful shutdown...`);
    
    try {
        // Save all users
        SaveBotUsers(Bot);
        logger.info('[System] User data saved successfully.');
        
        // Wait a brief moment for queries to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err) {
        logger.error(`[System] Error during save: ${err.message}`);
    }

    // Destroy client to close voice and gateway connections
    if (Bot.Client) {
        Bot.Client.destroy();
        logger.info('[System] Discord client destroyed.');
    }

    logger.info(`[System] Shutdown completed (${signal}).`);
    process.exit(0);
}

// Manejadores de señales del proceso
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Global Error Handlers
process.on('unhandledRejection', error => {
        logger.error({ message: 'Unhandled promise rejection', stack: error.stack, label: 'UnhandledRejection' });
});

process.on('uncaughtException', error => {
        logger.error({ message: 'Uncaught Exception', stack: error.stack, label: 'UncaughtException' });
});