import { REST, Routes } from 'discord.js';
import config from './config.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
            commands.push(command.default.data.toJSON());
            console.log(` Loaded slash command: ${command.default.data.name}`);
        }
        // Silently skip commands without 'data' (text-only commands)
    }
}

console.log(`\\n Found ${commands.length} slash command(s) to deploy.\\n`);

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(config.token);

// and deploy your commands!
(async () => {
    try {
        console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );

        console.log(`  Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // And of course, make sure you catch and log any errors!
        console.error(' Error deploying commands:');
        if (error.code === 20012) {
            console.error('  Authorization error: Make sure the token and clientId in config.js match the same bot.');
        } else if (error.code === 50035) {
            console.error('  Invalid clientId: Check that config.clientId is set correctly.');
        } else {
            console.error(error);
        }
    }
})();
