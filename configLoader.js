let config;

if (process.env.ENVIRONMENT === 'production_cd_cd') {
    // Modo Dokploy: usa explícitamente las variables de entorno
    config = {
        environment: 'production',
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.CLIENT_ID,
        guildId: process.env.GUILD_ID,
        database: {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE
        },
        webhooks: {
            team: {
                id: process.env.WEBHOOK_TEAM_ID,
                token: process.env.WEBHOOK_TEAM_TOKEN
            },
            errors_logs: {
                id: process.env.WEBHOOK_ERRORS_ID,
                token: process.env.WEBHOOK_ERRORS_TOKEN
            }
        },
        bot: {
            icon: process.env.BOT_ICON,
            invite: process.env.BOT_INVITE,
            serverInvite: process.env.BOT_SERVER_INVITE
        },
        nodes: [
            {
                name: process.env.LAVALINK_1_NAME,
                host: process.env.LAVALINK_1_HOST,
                port: process.env.LAVALINK_1_PORT ? parseInt(process.env.LAVALINK_1_PORT) : 13592,
                password: process.env.LAVALINK_1_PASSWORD,
                secure: process.env.LAVALINK_1_SECURE === 'true'
            },
            {
                host: process.env.LAVALINK_2_HOST,
                port: process.env.LAVALINK_2_PORT ? parseInt(process.env.LAVALINK_2_PORT) : 443,
                password: process.env.LAVALINK_2_PASSWORD,
                secure: process.env.LAVALINK_2_SECURE === 'true'
            }
        ],
        music: {
            allowedServers: process.env.MUSIC_ALLOWED_SERVERS ? process.env.MUSIC_ALLOWED_SERVERS.split(',') : ['440275828509507597']
        }
    };
} else {
    // Modo Local/Producción Tradicional: Usa el archivo local (ignorará el código de arriba)
    const configModule = await import('./config.js');
    config = configModule.default;
}

export default config;
