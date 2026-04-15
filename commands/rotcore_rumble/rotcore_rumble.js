import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import logger from '../../utils/logger.js';
import {
    CreateEmbed,
    GetRumbleUser,
    AddRumbleUser,
    GetRumbleLeaderboard,
    SaveRumbleUser
} from '../../utils/functions.js';
import {
    EnsurePlayer,
    InitializeBattle,
    ResolveBattleLoadout,
    ParseCards,
    ParsePlayers,
    CARDS_DB,
    PLAYERS_DB
} from '../../utils/battle-logic.js';

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
                .setDescription('View and open card packs (Coming Soon)')
        )
        .addSubcommand(sub =>
            sub.setName('cards')
                .setDescription('Browse and buy cards')
        )
        .addSubcommand(sub =>
            sub.setName('players')
                .setDescription('Browse and buy player characters')
        )
        .addSubcommand(sub =>
            sub.setName('leaderboard')
                .setDescription('See the top Rotcore Rumble players')
        ),
    aliases: [],

    async execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        const isButton = msg.isButton && msg.isButton();
        const userId = msg.user ? msg.user.id : msg.author?.id;
        const subcommand = isInteraction && !isButton ? msg.options.getSubcommand() : null;

        const Embed = structuredClone(Bot.Embed);

        try {
            // ── BUTTON HANDLING (Purchase) ──────────────────────────────
            if (isButton) {
                const customId = msg.customId;

                // Buy Player
                if (customId.startsWith('rumble_buy_p_')) {
                    await msg.deferReply({ ephemeral: true });
                    const playerId = parseInt(customId.split('rumble_buy_p_')[1]);
                    const player = PLAYERS_DB.find(p => p.id === playerId);
                    
                    if (!player) return msg.editReply({ content: 'Character not found.' });

                    // Simple base price (can be adjusted later)
                    const price = 100; 

                    if (User.cash < price) {
                        return msg.editReply({ content: `You need ${price} coins. You have ${User.cash}.` });
                    }

                    const rumbleUser = await EnsurePlayer(userId, Bot);
                    const ownedPlayers = ParsePlayers(rumbleUser.Players);

                    if (ownedPlayers.includes(playerId)) {
                        return msg.editReply({ content: `You already own **${player.name}**!` });
                    }

                    User.cash -= price;
                    ownedPlayers.push(playerId);
                    rumbleUser.Players = JSON.stringify(ownedPlayers);
                    await SaveRumbleUser(rumbleUser, Bot);

                    return msg.editReply({ content: `Successfully bought **${player.name}** for ${price} coins!` });
                }

                // Buy Card
                if (customId.startsWith('rumble_buy_c_')) {
                    await msg.deferReply({ ephemeral: true });
                    const cardId = parseInt(customId.split('rumble_buy_c_')[1]);
                    const card = CARDS_DB.find(c => c.id === cardId);

                    if (!card) return msg.editReply({ content: 'Card not found.' });

                    const price = 50; 

                    if (User.cash < price) {
                        return msg.editReply({ content: `You need ${price} coins. You have ${User.cash}.` });
                    }

                    const rumbleUser = await EnsurePlayer(userId, Bot);
                    const ownedCards = ParseCards(rumbleUser.Cards);

                    User.cash -= price;
                    ownedCards.push(cardId);
                    rumbleUser.Cards = JSON.stringify(ownedCards);
                    await SaveRumbleUser(rumbleUser, Bot);

                    return msg.editReply({ content: `Successfully bought **${card.name}** for ${price} coins!` });
                }
                return;
            }

            // ── /PACKS COMMAND ──────────────────────────────────────────
            if (subcommand === 'packs') {
                Embed.Title = 'Rotcore Rumble — Packs';
                Embed.Description = '> The random card pack system will be available very soon.\n\n> For now, you can buy individual cards using:\n> `/rotcorerumble cards`';
                Embed.Color = 15844367; // Gold
                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            }

            // ── /PLAYERS COMMAND ────────────────────────────────────────
            if (subcommand === 'players') {
                Embed.Title = 'Rotcore Rumble — Player Shop';
                Embed.Description = 'Select a character to buy using the buttons below:\n\n';
                
                const buttons = [];
                PLAYERS_DB.forEach((p, i) => {
                    Embed.Description += `**${i + 1}. ${p.name}** — 100 coins\n`;
                    buttons.push(
                        new ButtonBuilder()
                            .setCustomId(`rumble_buy_p_${p.id}`)
                            .setLabel(`${i + 1}. ${p.name}`)
                            .setStyle(ButtonStyle.Primary)
                    );
                });

                const rows = [];
                for (let i = 0; i < buttons.length; i += 5) {
                    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
                }

                return msg.reply({ embeds: [CreateEmbed(Embed)], components: rows });
            }

            // ── /CARDS COMMAND ──────────────────────────────────────────
            if (subcommand === 'cards') {
                Embed.Title = 'Rotcore Rumble — Card Shop';
                Embed.Description = 'Select a card to buy using the buttons below:\n\n';
                
                const buttons = [];
                CARDS_DB.forEach((c, i) => {
                    Embed.Description += `**${i + 1}. ${c.name}** — 50 coins\n`;
                    buttons.push(
                        new ButtonBuilder()
                            .setCustomId(`rumble_buy_c_${c.id}`)
                            .setLabel(`${i + 1}. ${c.name}`)
                            .setStyle(ButtonStyle.Success)
                    );
                });

                const rows = [];
                for (let i = 0; i < buttons.length; i += 5) {
                    rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
                }

                return msg.reply({ embeds: [CreateEmbed(Embed)], components: rows });
            }

            // ── LEADERBOARD (Basic) ──────────────────────────────────────
            if (subcommand === 'leaderboard') {
                const top = await GetRumbleLeaderboard(10, Bot);
                Embed.Title = 'Rotcore Rumble — Leaderboard';
                Embed.Description = top.length ? top.map((e, i) => `**${i+1}.** <@${e.User}> — ${e.Wins}W`).join('\n') : 'No players yet.';
                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            }

            // ── BATTLE ───────────────────────────────────────────────────
            if (subcommand === 'battle') {
                const opponent = msg.options.getUser('opponent');
                const [rumbleUser, opponentRumble] = await Promise.all([
                    EnsurePlayer(userId, Bot),
                    EnsurePlayer(opponent.id, Bot)
                ]);

                InitializeBattle(rumbleUser, opponentRumble, opponent.username);
                const p1 = ResolveBattleLoadout(rumbleUser);

                Embed.Title = 'Battle Initialized!';
                Embed.Description = `You are using **${p1.selectedPlayer?.name}** against **${opponent.username}**.`;
                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            }

        } catch (error) {
            logger.error({ message: 'Rumble command error', error });
            if (!msg.replied && !msg.deferred) return msg.reply({ content: 'An error occurred while executing the rumble command.', ephemeral: true });
        }
    }
};
