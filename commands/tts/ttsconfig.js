import { SlashCommandBuilder } from 'discord.js';
import { setUserTtsLanguage } from '../../utils/tts.js';

export default {
    name: 'ttsconfig',
    data: new SlashCommandBuilder()
        .setName('ttsconfig')
        .setDescription('Configure TTS language and voice chat auto-read')
        .addSubcommand(subcommand =>
            subcommand
                .setName('language')
                .setDescription('Set your preferred TTS language')
                .addStringOption(option =>
                    option
                        .setName('value')
                        .setDescription('Preferred language for your TTS')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Spanish', value: 'es' },
                            { name: 'English', value: 'en' },
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('auto')
                .setDescription('Enable or disable TTS from the current voice chat text channel')
                .addStringOption(option =>
                    option
                        .setName('mode')
                        .setDescription('Enable or disable auto TTS in this channel')
                        .setRequired(true)
                        .addChoices(
                            { name: 'on', value: 'on' },
                            { name: 'off', value: 'off' },
                        ))
                .addBooleanOption(option =>
                    option
                        .setName('translate')
                        .setDescription('Auto-translate messages (English↔Spanish) before speaking')
                        .setRequired(false))),
    aliases: [],
    async execute(interaction, User, Bot) {
        if (!interaction.isChatInputCommand()) return;

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'language') {
            const language = interaction.options.getString('value', true);
            const updated = setUserTtsLanguage(Bot, interaction.user.id, language);
            if (!updated) {
                return interaction.reply({ content: 'Invalid language value.', flags: 64 });
            }

            const label = language === 'es' ? 'Spanish' : 'English';
            return interaction.reply({ content: `Your TTS language is now ${label}.`, flags: 64 });
        }

        if (subcommand === 'auto') {
            if (!interaction.guild) {
                return interaction.reply({ content: 'This command can only be used in a server.', flags: 64 });
            }

            const mode = interaction.options.getString('mode', true);
            const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);

            if (!member?.voice?.channel) {
                return interaction.reply({ content: 'Join a voice channel first.', flags: 64 });
            }

            if (!Bot.TTS?.AutoChannels) Bot.TTS.AutoChannels = new Map();

            if (mode === 'off') {
                Bot.TTS.AutoChannels.delete(interaction.guild.id);
                return interaction.reply({ content: 'Auto TTS disabled for this server.', flags: 64 });
            }

            const autoTranslate = interaction.options.getBoolean('translate') ?? false;

            Bot.TTS.AutoChannels.set(interaction.guild.id, {
                textChannelId: interaction.channel.id,
                voiceChannelId: member.voice.channel.id,
                translate: autoTranslate,
            });

            const translateMsg = autoTranslate
                ? '\n🌐 Auto-translate enabled (English↔Spanish)'
                : '';

            return interaction.reply({ content: `Auto TTS enabled in this channel for your current voice channel.${translateMsg}`, flags: 64 });
        }
    }
};
