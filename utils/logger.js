import winston from 'winston';
import { EmbedBuilder } from 'discord.js';
import config from '../config.js';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console and file logs
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${stack || message}`;
    if (Object.keys(metadata).length > 0 && !metadata.label) {
        msg += `\nMetadata: ${JSON.stringify(metadata, null, 2)}`;
    }
    return msg;
});

let discordClient = null;
let logChannelId = null;

/**
 * Custom Winston Transport for Direct Discord Channel (via Bot Client)
 */
class BotChannelTransport extends winston.Transport {
    constructor(opts) {
        super(opts);
    }

    async log(info, callback) {
        setImmediate(() => this.emit('logged', info));

        // Only send to Discord if client and channel are initialized
        if (info.level === 'error' && discordClient && logChannelId) {
            try {
                const channel = discordClient.channels.cache.get(logChannelId);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setTitle(`Bot Error: ${info.label || 'System'}`)
                        .setColor(0xff0000)
                        .setTimestamp()
                        .setDescription(`\`\`\`js\n${(info.stack || info.message).slice(0, 2000)}\n\`\`\``);

                    // Add metadata if available (like SQL details)
                    const metadata = { ...info };
                    delete metadata.level;
                    delete metadata.message;
                    delete metadata.timestamp;
                    delete metadata.stack;
                    delete metadata.label;
                    delete metadata.service;

                    if (Object.keys(metadata).length > 0) {
                        const metaString = JSON.stringify(metadata, null, 2);
                        if (metaString.length < 1024) {
                            embed.addFields({ name: 'Details', value: `\`\`\`json\n${metaString}\n\`\`\`` });
                        }
                    }

                    await channel.send({
                        embeds: [embed]
                    });
                }
            } catch (err) {
                console.error('Failed to send error to Discord Channel via Bot:', err);
            }
        }
        callback();
    }
}

// Initializing Winston Logger
const logger = winston.createLogger({
    level: 'info',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
    ),
    defaultMeta: { service: '9k-bot' },
    transports: [
        // Error log file
        new winston.transports.File({ 
            filename: 'logs/error.log', 
            level: 'error',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            )
        }),
        // Combined log file
        new winston.transports.File({ 
            filename: 'logs/combined.log',
            format: combine(
                timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                logFormat
            )
        }),
        // Transport that uses the bot client (initialized later)
        new BotChannelTransport({ level: 'error' })
    ]
});

/**
 * Initialize Discord elements for the logger
 * @param {Client} client - The Discord.js client
 * @param {string} channelId - The ID of the channel to log to
 */
logger.initDiscord = (client, channelId) => {
    discordClient = client;
    logChannelId = channelId;
};

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: combine(
            colorize(),
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            logFormat
        )
    }));
}

export default logger;
