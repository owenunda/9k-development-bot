import { SlashCommandBuilder } from 'discord.js';
import logger from '../../utils/logger.js';
import {
    CreateEmbed,
    GetRumbleUser,
    AddRumbleUser,
    GetRumbleLeaderboard,
    GetRumbleShopCards,
    GetRumbleShopPlayers
} from '../../utils/functions.js';
import {
    EnsurePlayer,
    InitializeBattle,
    ResolveBattleLoadout
} from '../../utils/battle-logic.js';

// Helper: get or auto-create a RumbleUser row
async function ensureRumbleUser(userid, Bot) {
    let rumbleUser = await GetRumbleUser(userid, Bot);
    if (!rumbleUser) {
        await AddRumbleUser(userid, Bot);
        rumbleUser = await GetRumbleUser(userid, Bot);
    }
    return rumbleUser;
}

export default {
    name: 'rotcorerumble',
    data: new SlashCommandBuilder()
        .setName('rotcorerumble')
        .setDescription('Rotcore Rumble — the card battle game!')
        .addSubcommand(sub =>
            sub.setName('battle')
                .setDescription('Challenge another player to a Rotcore Rumble battle!')
                .addUserOption(opt =>
                    opt.setName('opponent')
                        .setDescription('The player you want to battle')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('packs')
                .setDescription('Browse and open card packs')
        )
        .addSubcommand(sub =>
            sub.setName('players')
                .setDescription('Browse the player shop')
        )
        .addSubcommand(sub =>
            sub.setName('leaderboard')
                .setDescription('See the top Rotcore Rumble players')
        ),
    aliases: [],
    botPoints: false,

    async execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        const userId = isInteraction ? msg.user.id : msg.author.id;
        const subcommand = isInteraction ? msg.options.getSubcommand() : null;

        const Embed = structuredClone(Bot.Embed);

        try {
            // ── BATTLE ─────────────────────────────────────────────────────
            if (subcommand === 'battle') {
                const opponent = msg.options.getUser('opponent');

                if (opponent.id === userId) {
                    Embed.Title = 'Rotcore Rumble';
                    Embed.Description = '> You cannot battle yourself!';
                    Embed.Color = 15548997;
                    return msg.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
                }

                // Ensure both users exist in RotcoreRumbleUsers and give them a base setup
                const [rumbleUser, opponentRumble] = await Promise.all([
                    EnsurePlayer(userId, Bot),
                    EnsurePlayer(opponent.id, Bot)
                ]);

                if (!rumbleUser || !opponentRumble) {
                    Embed.Title = 'Rotcore Rumble';
                    Embed.Description = '> Could not prepare the battle setup. Please try again.';
                    Embed.Color = 15548997;
                    return msg.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
                }

                const battleState = InitializeBattle(rumbleUser, opponentRumble, opponent.username);

                if (!battleState) {
                    Embed.Title = 'Rotcore Rumble';
                    Embed.Description = '> Battle setup failed. Please try again.';
                    Embed.Color = 15548997;
                    return msg.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
                }

                const player1Loadout = ResolveBattleLoadout(rumbleUser);
                const player2Loadout = ResolveBattleLoadout(opponentRumble);

                Embed.Title = 'Rotcore Rumble — Battle';
                Embed.Description = [
                    `**${msg.user.username}** has challenged **${opponent.username}** to a battle!`,
                    '',
                    '> **Battle base ready.**',
                    `> You are using **${player1Loadout.selectedPlayer?.name || 'Unknown'}** with **${player1Loadout.selectedDeckName}**.`,
                    `> Opponent is using **${player2Loadout.selectedPlayer?.name || 'Unknown'}** with **${player2Loadout.selectedDeckName}**.`,
                    `> Your record: **${rumbleUser.Wins}W / ${rumbleUser.Loss}L**`
                ].join('\n');
                Embed.Color = 15105570; // Orange

                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            }

            // ── PACKS ──────────────────────────────────────────────────────
            if (subcommand === 'packs') {
                const cards = await GetRumbleShopCards(Bot);

                Embed.Title = 'Rotcore Rumble — Card Shop';
                Embed.Color = 5763719; // Green

                if (!cards || cards.length === 0) {
                    Embed.Description = '> No cards available in the shop at the moment.';
                } else {
                    const list = cards.map((c, i) =>
                        `**${i + 1}.** ${c.Name} — ${c.Price} coins`
                    ).join('\n');
                    Embed.Description = [
                        '> **Pack purchasing coming soon!**',
                        '',
                        '**Available Cards:**',
                        list
                    ].join('\n');
                }

                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            }

            // ── PLAYERS ────────────────────────────────────────────────────
            if (subcommand === 'players') {
                const players = await GetRumbleShopPlayers(Bot);

                Embed.Title = 'Rotcore Rumble — Player Shop';
                Embed.Color = 3447003; // Blue

                if (!players || players.length === 0) {
                    Embed.Description = '> No players available in the shop at the moment.';
                } else {
                    const list = players.map((p, i) =>
                        `**${i + 1}.** ${p.Name} — ${p.Price} coins${p.PVP ? ' PVP' : ''}`
                    ).join('\n');
                    Embed.Description = [
                        '> **Player purchasing coming soon!**',
                        '',
                        '**Available Players:**',
                        list
                    ].join('\n');
                }

                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            }

            // ── LEADERBOARD ────────────────────────────────────────────────
            if (subcommand === 'leaderboard') {
                const top = await GetRumbleLeaderboard(10, Bot);

                Embed.Title = 'Rotcore Rumble — Leaderboard';
                Embed.Color = 15844367; // Gold

                if (!top || top.length === 0) {
                    Embed.Description = '> No players on the leaderboard yet. Be the first!';
                } else {
                    const medals = ['1.', '2.', '3.'];
                    const rows = top.map((entry, i) => {
                        const medal = medals[i] || `**${i + 1}.**`;
                        // Calculate win rate
                        const total = (entry.Wins + entry.Loss) || 1;
                        const wr = ((entry.Wins / total) * 100).toFixed(1);
                        return `${medal} <@${entry.User}> — ${entry.Wins}W / ${entry.Loss}L *(${wr}% WR)*`;
                    });
                    Embed.Description = rows.join('\n');
                }

                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            }

        } catch (error) {
            logger.error({ message: 'RotcoreRumble command error', error, label: 'Rumble' });

            Embed.Title = 'Error';
            Embed.Description = 'Something went wrong. Please try again later.';
            Embed.Color = 15548997;

            if (isInteraction) {
                return msg.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
            }
        }
    }
};
