import winston from 'winston';
import { EmbedBuilder, WebhookClient } from 'discord.js';
import config from '../configLoader.js';
import axios from 'axios';

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console and file logs
const logFormat = printf(({ level, message, timestamp, stack, error, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${stack || message}`;
    
    // Handle error object in metadata if it exists
    const errObj = error || (metadata.error instanceof Error ? metadata.error : null);
    if (errObj && errObj instanceof Error) {
        msg += `\nError details: ${errObj.message}`;
        if (errObj.code) msg += ` (Code: ${errObj.code})`;
        if (errObj.status) msg += ` (Status: ${errObj.status})`;
        if (errObj.method) msg += ` [${errObj.method} ${errObj.url || ''}]`;
    }

    if (Object.keys(metadata).length > 0 && !metadata.label) {
        // Clean up metadata to avoid redundancy
        const cleanMeta = { ...metadata };
        delete cleanMeta.error;
        if (Object.keys(cleanMeta).length > 0) {
            msg += `\nMetadata: ${JSON.stringify(cleanMeta, null, 2)}`;
        }
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

        // Skip if not an error
        if (info.level !== 'error') return callback();

        try {
            const embed = new EmbedBuilder()
                .setTitle(`Bot Error: ${info.label || 'System'}`)
                .setColor(0xff0000)
                .setTimestamp()
                .setDescription(`\`\`\`js\n${(info.stack || info.message).slice(0, 2000)}\n\`\`\``);

            // Add metadata if available (like SQL details)
            const metadata = { ...info };
            
            // Extract error details for the embed if it's a known error type
            const err = info.error || info.stack || info;
            if (err && (err.code || err.status || err.method)) {
                let errorDetails = '';
                if (err.code) errorDetails += `**Code:** ${err.code}\n`;
                if (err.status) errorDetails += `**Status:** ${err.status}\n`;
                if (err.method) errorDetails += `**Method:** ${err.method} ${err.url || ''}\n`;
                if (errorDetails) {
                    embed.addFields({ name: 'Request Details', value: errorDetails });
                }
            }

            delete metadata.level;
            delete metadata.message;
            delete metadata.timestamp;
            delete metadata.stack;
            delete metadata.label;
            delete metadata.service;
            delete metadata.error;

            if (Object.keys(metadata).length > 0) {
                const metaString = JSON.stringify(metadata, null, 2);
                if (metaString.length < 1024) {
                    embed.addFields({ name: 'Metadata', value: `\`\`\`json\n${metaString}\n\`\`\`` });
                }
            }

            // OPTION 1: Send via active Bot Client (if initialized)
            if (discordClient && logChannelId) {
                const channel = discordClient.channels.cache.get(logChannelId);
                if (channel) {
                    await channel.send({ embeds: [embed] });
                    return callback();
                }
            }

            // OPTION 2: Send via Webhook Fallback (if bot is offline/not initialized)
            if (config.webhooks?.errors_logs?.id && config.webhooks?.errors_logs?.token) {
                const webhook = new WebhookClient({ 
                    id: config.webhooks.errors_logs.id, 
                    token: config.webhooks.errors_logs.token 
                });
                await webhook.send({ embeds: [embed] });
            }
        } catch (err) {
            console.error('Failed to send error to Discord (Bot or Webhook):', err);
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
