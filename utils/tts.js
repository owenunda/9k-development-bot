import { translate } from '@vitalets/google-translate-api';
import axios from 'axios';
import logger from './logger.js';

export const SUPPORTED_TTS_LANGUAGES = {
    es: { name: 'Spanish', voice: 'Conchita' },
    en: { name: 'English', voice: 'Joanna' },
};

const TTS_API_BASE = 'https://api.streamelements.com/kappa/v2/speech';
const GOOGLE_TTS_BASE = 'https://translate.google.com/translate_tts';
const DIRECT_TTS_IDLE_MS = 5 * 60 * 1000;

export function isSupportedTtsLanguage(language) {
    return Boolean(SUPPORTED_TTS_LANGUAGES[language]);
}

export function getLanguageLabel(language) {
    return SUPPORTED_TTS_LANGUAGES[language]?.name || 'Unknown';
}

export function getUserTtsLanguage(Bot, userId, fallback = 'en') {
    const saved = Bot?.TTS?.UserLanguage?.get(userId);
    if (isSupportedTtsLanguage(saved)) return saved;
    return isSupportedTtsLanguage(fallback) ? fallback : 'en';
}

export function setUserTtsLanguage(Bot, userId, language) {
    if (!isSupportedTtsLanguage(language)) return false;
    if (!Bot.TTS?.UserLanguage) Bot.TTS.UserLanguage = new Map();
    Bot.TTS.UserLanguage.set(userId, language);
    return true;
}

export function isTtsTrack(track) {
    const uri = (track?.info?.uri || track?.uri || '').toLowerCase();
    const title = (track?.info?.title || '').toLowerCase();
    const author = (track?.info?.author || '').toLowerCase();
    return uri.includes('api.streamelements.com/kappa/v2/speech')
        || uri.includes('translate.google.com/translate_tts')
        || title.startsWith('[tts]')
        || author === 'tts';
}

export async function queueTtsPlayback({
    Bot,
    guild,
    member,
    rawText,
    targetLanguage,
}) {
    const normalizedLanguage = isSupportedTtsLanguage(targetLanguage) ? targetLanguage : 'en';
    const translatedText = await translateText(rawText, normalizedLanguage);
    const normalizedText = normalizeTtsText(translatedText);
    const session = await ensureDirectSession(Bot, guild, member.voice.channel.id);

    session.queue.push({
        text: normalizedText,
        candidates: buildTtsUrls(normalizedText, normalizedLanguage),
    });

    logger.info({
        message: `Queued TTS text (${normalizedLanguage}): ${normalizedText.slice(0, 80)}`,
        label: 'TTS',
    });

    const isNowPlaying = !session.isPlaying;
    if (isNowPlaying) {
        await playNextDirectTts(Bot, guild.id);
    }

    return {
        language: normalizedLanguage,
        languageName: getLanguageLabel(normalizedLanguage),
        translatedText: normalizedText,
        queuePosition: isNowPlaying ? 0 : session.queue.length,
        isNowPlaying,
    };
}

export async function clearTtsSession(Bot, guildId) {
    const session = Bot?.TTS?.DirectSessions?.get(guildId);
    if (!session) return false;

    cleanupSession(session, true);
    Bot.TTS.DirectSessions.delete(guildId);
    return true;
}

async function translateText(text, targetLanguage) {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';

    try {
        const result = await translate(trimmed, { to: targetLanguage });
        return result?.text?.trim() || trimmed;
    } catch {
        return trimmed;
    }
}

function buildTtsUrl(text, language) {
    const voice = SUPPORTED_TTS_LANGUAGES[language]?.voice || 'Joanna';
    const params = new URLSearchParams({ voice, text });
    return `${TTS_API_BASE}?${params.toString()}`;
}

function buildGoogleTtsUrl(text, language) {
    const params = new URLSearchParams({
        ie: 'UTF-8',
        client: 'tw-ob',
        tl: language,
        q: text,
    });
    return `${GOOGLE_TTS_BASE}?${params.toString()}`;
}

function buildTtsUrls(text, language) {
    return [buildTtsUrl(text, language), buildGoogleTtsUrl(text, language)];
}

function normalizeTtsText(text) {
    const collapsed = (text || '').replace(/\s+/g, ' ').trim();
    return collapsed.slice(0, 180);
}

async function ensureDirectSession(Bot, guild, voiceChannelId) {
    if (!Bot?.DVC) {
        throw new Error('Direct voice player is not available.');
    }

    if (!Bot.TTS) Bot.TTS = {};
    if (!Bot.TTS.DirectSessions) Bot.TTS.DirectSessions = new Map();

    let session = Bot.TTS.DirectSessions.get(guild.id);
    if (session && session.voiceChannelId !== voiceChannelId) {
        cleanupSession(session, true);
        Bot.TTS.DirectSessions.delete(guild.id);
        session = null;
    }

    if (!session) {
        const connection = Bot.DVC.joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
        });

        const player = Bot.DVC.createAudioPlayer();
        connection.subscribe(player);

        try {
            await Bot.DVC.entersState(connection, Bot.DVC.VoiceConnectionStatus.Ready, 15_000);
        } catch (error) {
            connection.destroy();
            throw new Error(`Could not connect to voice channel: ${error.message}`);
        }

        session = {
            connection,
            player,
            queue: [],
            isPlaying: false,
            idleTimeout: null,
            voiceChannelId,
            activeStream: null,
        };

        player.on(Bot.DVC.AudioPlayerStatus.Idle, () => {
            session.isPlaying = false;
            session.activeStream?.destroy?.();
            session.activeStream = null;
            playNextDirectTts(Bot, guild.id).catch((error) => {
                logger.error({ message: 'TTS queue advance failed', error, label: 'TTS' });
            });
        });

        player.on('error', (error) => {
            logger.error({ message: 'TTS audio player error', error, label: 'TTS' });
            session.isPlaying = false;
            session.activeStream?.destroy?.();
            session.activeStream = null;
            playNextDirectTts(Bot, guild.id).catch(() => {});
        });

        connection.on(Bot.DVC.VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    Bot.DVC.entersState(connection, Bot.DVC.VoiceConnectionStatus.Signalling, 5_000),
                    Bot.DVC.entersState(connection, Bot.DVC.VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch {
                cleanupSession(session, true);
                Bot.TTS.DirectSessions.delete(guild.id);
            }
        });

        Bot.TTS.DirectSessions.set(guild.id, session);
    }

    return session;
}

async function playNextDirectTts(Bot, guildId) {
    const session = Bot?.TTS?.DirectSessions?.get(guildId);
    if (!session) return;

    if (session.idleTimeout) {
        clearTimeout(session.idleTimeout);
        session.idleTimeout = null;
    }

    const nextEntry = session.queue.shift();
    if (!nextEntry) {
        session.idleTimeout = setTimeout(() => {
            cleanupSession(session, true);
            Bot.TTS.DirectSessions.delete(guildId);
        }, DIRECT_TTS_IDLE_MS);
        return;
    }

    try {
        const audioStream = await fetchFirstAudio(nextEntry.candidates);
        const resource = Bot.DVC.createAudioResource(audioStream, {
            inputType: Bot.DVC.StreamType.Arbitrary,
        });

        session.activeStream = audioStream;
        session.isPlaying = true;
        logger.info({ message: `Starting TTS playback in guild ${guildId}`, label: 'TTS' });
        session.player.play(resource);
    } catch (error) {
        logger.warn({ message: `TTS playback skipped: ${error.message}`, label: 'TTS' });
        session.isPlaying = false;
        await playNextDirectTts(Bot, guildId);
    }
}

function cleanupSession(session, destroyConnection = false) {
    if (!session) return;

    if (session.idleTimeout) {
        clearTimeout(session.idleTimeout);
        session.idleTimeout = null;
    }

    session.activeStream?.destroy?.();
    session.activeStream = null;

    if (destroyConnection) {
        try {
            session.connection?.destroy();
        } catch {}
    }
}

async function fetchFirstAudio(candidates) {
    for (const url of candidates) {
        try {
            const response = await axios.get(url, {
                responseType: 'stream',
                timeout: 20000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                },
                validateStatus: (status) => status >= 200 && status < 300,
            });

            const contentType = String(response.headers?.['content-type'] || '').toLowerCase();
            if (contentType && !contentType.includes('audio') && !contentType.includes('octet-stream')) {
                response.data.destroy?.();
                continue;
            }

            logger.info({ message: `TTS provider selected: ${contentType || 'unknown'}`, label: 'TTS' });
            return response.data;
        } catch (error) {
            logger.warn({ message: `TTS provider failed: ${error.message}`, label: 'TTS' });
        }
    }

    throw new Error('No TTS provider returned audio.');
}
