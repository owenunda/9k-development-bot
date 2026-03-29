import { REST, Routes } from 'discord.js';
import config from './config.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
// Grab all the command folders from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    // Grab all the command files from the commands directory you created earlier
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(`./commands/${folder}/${file}`);
        if ('data' in command.default && 'execute' in command.default) {
            // Skip commands with data: false (text-only commands)
            if (command.default.data === false) {
                console.log(` Skipped text-only command: ${command.default.name}`);
                continue;
            }
            commands.push(command.default.data.toJSON());
            console.log(` Loaded slash command: ${command.default.data.name}`);
        }
        // Silently skip commands without 'data' (text-only commands)
    }
}

logger.info(`Found ${commands.length} slash command(s) to deploy.`);

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

const env = String(config.environment ?? 'development').toLowerCase();
const isProduction = env === 'production' || env === 'prod';

// and deploy your commands!
(async () => {
    try {
        logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        logger.error({ message: 'Error deploying commands', error, label: 'Deployment' });
    }
})();
