import { SlashCommandBuilder } from 'discord.js';
import { getUserTtsLanguage, isSupportedTtsLanguage, queueTtsPlayback } from '../../utils/tts.js';

export default {
    name: 'tts',
    data: new SlashCommandBuilder()
        .setName('tts')
        .setDescription('Speak text in voice channel using TTS (Spanish/English)')
        .addStringOption(option =>
            option
                .setName('text')
                .setDescription('Text to speak')
                .setRequired(true)
                .setMaxLength(180))
        .addStringOption(option =>
            option
                .setName('language')
                .setDescription('TTS language')
                .setRequired(false)
                .addChoices(
                    { name: 'Spanish', value: 'es' },
                    { name: 'English', value: 'en' },
                )),
    aliases: [],
    async execute(interaction, User, Bot) {
        if (!interaction.isChatInputCommand()) return;

        const { member, guild, client } = interaction;

        if (!Bot?.DVC) {
            return interaction.reply({ content: 'TTS system is not ready yet. Please try again in a moment.', flags: 64 });
        }

        if (!member.voice.channel) {
            return interaction.reply({ content: 'You must be in a voice channel to use this command.', flags: 64 });
        }

        const permissions = member.voice.channel.permissionsFor(client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return interaction.reply({ content: 'I do not have permission to connect or speak in your voice channel.', flags: 64 });
        }

        const text = interaction.options.getString('text')?.trim();
        if (!text) {
            return interaction.reply({ content: 'Please provide text to speak.', flags: 64 });
        }

        const selectedLanguage = interaction.options.getString('language');
        const localeBasedLanguage = interaction.locale?.toLowerCase().startsWith('es') ? 'es' : 'en';
        const savedLanguage = getUserTtsLanguage(Bot, interaction.user.id, localeBasedLanguage);
        const language = selectedLanguage || savedLanguage;

        if (!isSupportedTtsLanguage(language)) {
            return interaction.reply({ content: 'Unsupported language. Use Spanish or English.', flags: 64 });
        }

        const autoConfig = Bot?.TTS?.AutoChannels?.get(guild.id);
        if (autoConfig && autoConfig.textChannelId === interaction.channel.id && autoConfig.voiceChannelId === member.voice.channel.id) {
            return interaction.reply({ content: 'Auto TTS is enabled in this channel. Just type normally and I will read your messages.', flags: 64 });
        }

        await interaction.deferReply().catch(() => {});

        try {
            const playback = await queueTtsPlayback({
                Bot,
                client,
                guild,
                member,
                textChannelId: interaction.channel.id,
                requester: interaction.user,
                rawText: text,
                targetLanguage: language,
            });

            const position = playback.isNowPlaying ? 'Playing now' : `Queued at position ${playback.queuePosition}`;

            return interaction.editReply(`TTS queued in ${playback.languageName}. ${position}.`);
        } catch (error) {
            return interaction.editReply(`An error occurred while generating TTS: ${error.message}`);
        }
    }
};
