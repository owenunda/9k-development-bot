import { SlashCommandBuilder } from 'discord.js';
import { clearTtsSession } from '../../utils/tts.js';

export default {
    name: 'ttsstop',
    data: new SlashCommandBuilder()
        .setName('ttsstop')
        .setDescription('Stop TTS and disconnect the bot from the voice channel'),
    aliases: [],
    async execute(interaction, User, Bot) {
        if (!interaction.isChatInputCommand()) return;

        const { guild } = interaction;

        const hadSession = await clearTtsSession(Bot, guild.id);

        // Also disable auto mode if active
        if (Bot.TTS?.AutoChannels?.has(guild.id)) {
            Bot.TTS.AutoChannels.delete(guild.id);
        }

        if (hadSession) {
            return interaction.reply({ content: '⏹️ TTS stopped and disconnected from voice channel.', flags: 64 });
        }

        return interaction.reply({ content: 'No active TTS session in this server.', flags: 64 });
    }
};
