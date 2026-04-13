import { CheckAdmin, SaveBotUsers } from '../../utils/functions.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import logger from '../../utils/logger.js';

export default {
    name: 'shutdown',
    data: new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('Saves data and shuts down the bot (Admins Only)'),
    async execute(interaction, User, Bot) {
        // Verify admin permissions
        const isAdmin = await CheckAdmin(interaction);
        if (!isAdmin || isAdmin !== interaction.user.id) {
            return interaction.reply({ 
                content: 'You do not have permission to use this command.', 
                ephemeral: true 
            });
        }

        const reply = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('Shutdown Initiated')
            .setDescription('Saving user data and closing session...')
            .setThumbnail('https://9000inc.com/Resources/9000INCLogoV2.png')
            .setTimestamp();

        await interaction.reply({ embeds: [reply] });

        logger.info(`Shutdown requested by ${interaction.user.tag}`);

        // Force data save
        try {
            SaveBotUsers(Bot);
            logger.info('User data saved successfully.');
            
            // Wait a moment to ensure queries are sent
            setTimeout(async () => {
                await interaction.followUp({ content: 'Data saved. The bot will now shut down.', ephemeral: true });
                
                // Disconnect client and exit
                Bot.Client.destroy();
                process.exit(0);
            }, 3000);
        } catch (error) {
            logger.error(`Error during shutdown: ${error.message}`);
            await interaction.followUp({ content: 'An error occurred while saving data, but the process will attempt to close.', ephemeral: true });
            process.exit(1);
        }
    }
}
