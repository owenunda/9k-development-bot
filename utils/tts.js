import translate from 'google-translate-api-x';
import axios from 'axios';
import logger from './logger.js';

export const SUPPORTED_TTS_LANGUAGES = {
    es: { name: 'Spanish', voice: 'Conchita' },
    en: { name: 'English', voice: 'Joanna' },
};

const TTS_API_BASE = 'https://api.streamelements.com/kappa/v2/speech';
const GOOGLE_TTS_BASE = 'https://translate.google.com/translate_tts';
const TTS_IDLE_MS = 5 * 60 * 1000;

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

/**
 * Queue TTS playback using @discordjs/voice directly.
 * We temporarily block Riffy from intercepting voice packets for this guild.
 */
export async function queueTtsPlayback({
    Bot,
    guild,
    member,
    rawText,
    targetLanguage,
    translate: shouldTranslate = false,
}) {
    if (!Bot?.DVC) {
        throw new Error('Voice system is not available.');
    }

    let normalizedLanguage = isSupportedTtsLanguage(targetLanguage) ? targetLanguage : 'en';
    let processedText = rawText;

    if (shouldTranslate) {
        // Smart translate: detect input language and translate to the OTHER language
        const result = await smartTranslate(rawText);
        processedText = result.translatedText;
        normalizedLanguage = result.targetLanguage;
    }

    const normalizedText = normalizeTtsText(processedText);

    const voiceChannelId = member.voice.channel.id;

    // Check if there's a Riffy music player active - if so, queue through Riffy
    const riffyPlayer = Bot.Client?.riffy?.players?.get(guild.id);
    if (riffyPlayer && (riffyPlayer.playing || riffyPlayer.paused)) {
        return await queueTtsViaRiffy(Bot, guild, member, normalizedText, normalizedLanguage);
    }

    // Otherwise use direct @discordjs/voice playback
    const session = await ensureDirectSession(Bot, guild, voiceChannelId);

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

/**
 * Fallback: queue TTS through Riffy when a music player is already active.
 */
async function queueTtsViaRiffy(Bot, guild, member, text, language) {
    const client = Bot.Client;
    const ttsUrl = buildTtsUrl(text, language);

    let result;
    try {
        result = await client.riffy.resolve({ query: ttsUrl, requester: member.user || member });
    } catch {
        const googleUrl = buildGoogleTtsUrl(text, language);
        result = await client.riffy.resolve({ query: googleUrl, requester: member.user || member }).catch(() => null);
    }

    if (result?.tracks?.length) {
        const track = result.tracks[0];
        track.info = track.info || {};
        track.info.title = `[TTS] ${text.slice(0, 60)}`;
        track.info.author = 'TTS';
        const player = client.riffy.players.get(guild.id);
        player.queue.add(track);
        if (!player.playing && !player.paused) await player.play();
        return { language, languageName: getLanguageLabel(language), translatedText: text, queuePosition: player.queue.length, isNowPlaying: false };
    }

    throw new Error('Could not queue TTS while music is playing.');
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
    } catch (err) {
        logger.warn({ message: `Translation failed: ${err.message}`, label: 'TTS' });
        return trimmed;
    }
}

/**
 * Smart translation: detect the input language and translate to the OTHER supported language.
 * English text → translated to Spanish, spoken in Spanish voice.
 * Spanish text → translated to English, spoken in English voice.
 */
async function smartTranslate(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return { translatedText: trimmed, targetLanguage: 'en' };

    try {
        // Translate to Spanish first — Google auto-detects the source language
        const result = await translate(trimmed, { to: 'es' });
        const detectedLang = result?.from?.language?.iso || 'en';

        logger.info({ message: `TTS Smart Translate: detected "${detectedLang}" for "${trimmed.slice(0, 40)}"`, label: 'TTS' });

        // If the text is in Spanish, translate to English instead
        if (detectedLang.startsWith('es')) {
            const enResult = await translate(trimmed, { to: 'en' });
            return {
                translatedText: enResult?.text?.trim() || trimmed,
                targetLanguage: 'en',
            };
        }

        // Text is not Spanish → use the Spanish translation we already have
        return {
            translatedText: result?.text?.trim() || trimmed,
            targetLanguage: 'es',
        };
    } catch (err) {
        logger.warn({ message: `Smart translate failed: ${err.message}`, label: 'TTS' });
        return { translatedText: trimmed, targetLanguage: 'en' };
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
    return [buildGoogleTtsUrl(text, language), buildTtsUrl(text, language)];
}

function normalizeTtsText(text) {
    const collapsed = (text || '').replace(/\s+/g, ' ').trim();
    return collapsed.slice(0, 180);
}

async function ensureDirectSession(Bot, guild, voiceChannelId) {
    if (!Bot.TTS) Bot.TTS = {};
    if (!Bot.TTS.DirectSessions) Bot.TTS.DirectSessions = new Map();

    let session = Bot.TTS.DirectSessions.get(guild.id);
    if (session && session.voiceChannelId !== voiceChannelId) {
        cleanupSession(session, true);
        Bot.TTS.DirectSessions.delete(guild.id);
        session = null;
    }

    if (session) return session;

    // Destroy any lingering Riffy player for this guild to free the voice slot
    const riffyPlayer = Bot.Client?.riffy?.players?.get(guild.id);
    if (riffyPlayer) {
        logger.info({ message: `Destroying stale Riffy player in guild ${guild.id} for TTS`, label: 'TTS' });
        riffyPlayer.destroy();
        // Wait for Riffy to process the destroy
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Block Riffy from intercepting voice packets during connection
    if (!Bot.TTS._ttsGuilds) Bot.TTS._ttsGuilds = new Set();
    Bot.TTS._ttsGuilds.add(guild.id);

    let connection;
    try {
        logger.info({ message: `TTS: Joining voice channel ${voiceChannelId} in guild ${guild.id}`, label: 'TTS' });

        connection = Bot.DVC.joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
            selfDeaf: true,
        });

        // Log connection state changes for debugging
        connection.on('stateChange', (oldState, newState) => {
            logger.info({ message: `TTS Voice: ${oldState.status} -> ${newState.status}`, label: 'TTS' });
        });

        const player = Bot.DVC.createAudioPlayer();
        connection.subscribe(player);

        logger.info({ message: 'TTS: Waiting for voice connection Ready state...', label: 'TTS' });
        await Bot.DVC.entersState(connection, Bot.DVC.VoiceConnectionStatus.Ready, 20_000);
        logger.info({ message: 'TTS: Voice connection is Ready!', label: 'TTS' });

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
            logger.error({ message: 'TTS audio player error', error: error.message, label: 'TTS' });
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
                Bot.TTS._ttsGuilds?.delete(guild.id);
            }
        });

        connection.on(Bot.DVC.VoiceConnectionStatus.Destroyed, () => {
            Bot.TTS._ttsGuilds?.delete(guild.id);
        });

        Bot.TTS.DirectSessions.set(guild.id, session);
    } catch (error) {
        Bot.TTS._ttsGuilds?.delete(guild.id);
        try { connection?.destroy(); } catch {}
        throw new Error(`Could not connect to voice channel: ${error.message}`);
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
            Bot.TTS._ttsGuilds?.delete(guildId);
        }, TTS_IDLE_MS);
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
            logger.warn({ message: `TTS provider failed (${url.slice(0, 60)}): ${error.message}`, label: 'TTS' });
        }
    }

    throw new Error('No TTS provider returned audio.');
}
