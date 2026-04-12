// MOVABLE: 9kFun bot - Roulette gambling game
// This command will be moved to a separate 9kFun bot in the future
import { CreateEmbed, SetCoolDown, AlertCoolDown, CheckCoolDown, GetRandomFunCooldown } from '../../utils/functions.js';
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

const RouletteNumbers = {
    red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
    black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
    green: [0]
};

export default {
    name: 'roulette',
    // MOVABLE: 9kFun bot - This gambling game will move to separate bot
    data: new SlashCommandBuilder()
        .setName('roulette')
        .setDescription('Play roulette and bet your cash on numbers or colors (🎮 Fun command - may move to 9kFun bot)'),
    aliases: [],
    botPoints: true,
    execute(interaction, User, Bot) {
        const isInteraction = interaction?.commandName !== undefined;
        const author = interaction.author || interaction.user;
        const cooldownkey = `Roulette-${author.id}`;
        if (CheckCoolDown(cooldownkey)) {
            return AlertCoolDown(interaction, cooldownkey, Bot)
        }
        SetCoolDown(interaction, cooldownkey, GetRandomFunCooldown());

        let maxbet = 100;
        interaction.guild.members.fetch(author.id).then(MemberCache => {
            if (MemberCache.roles.cache.some(role => role.name === '!9k-Gambler')) {
                maxbet = maxbet * 5;
            }

            const Embed = structuredClone(Bot.Embed);
            Embed.Title = ' Play Roulette?';
            Embed.Description = `Enter an amount of cash to bet! (Max ${maxbet})`;

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('bet_100')
                    .setLabel('Bet 100')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(100 > maxbet || 100 > User.cash),
                new ButtonBuilder()
                    .setCustomId('bet_300')
                    .setLabel('Bet 300')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(300 > maxbet || 300 > User.cash),
                new ButtonBuilder()
                    .setCustomId('bet_500')
                    .setLabel('Bet 500')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(500 > maxbet || 500 > User.cash)
            );

            const sendMessage = isInteraction
                ? interaction.reply({ embeds: [CreateEmbed(Embed)], components: [row1], fetchReply: true })
                : interaction.channel.send({ embeds: [CreateEmbed(Embed)], components: [row1] });

            sendMessage.then(Sent => {
                const interaction_filter = response => response.author.id === author.id;
                const btn_filter = i => i.user.id === author.id;

                const btnCollector = Sent.createMessageComponentCollector({ filter: btn_filter, componentType: ComponentType.Button, time: 30000, max: 1 });
                const msgCollector = Sent.channel.createMessageCollector({ filter: interaction_filter, time: 30000, max: 1 });

                let handleBet = (Bet, isInteractionReply = null) => {
                    btnCollector.stop('resolved');
                    msgCollector.stop('resolved');

                    if (User.cash >= Bet && Bet <= maxbet && Bet >= 1) {
                        if (isInteractionReply) {
                            isInteractionReply.deferUpdate().catch(() => {});
                        }
                        const disabledRow = new ActionRowBuilder().addComponents(
                            row1.components.map(c => ButtonBuilder.from(c).setDisabled(true))
                        );
                        Sent.edit({ components: [disabledRow] }).catch(() => {});

                        const Embed2 = structuredClone(Bot.Embed);
                        Embed2.Title = ' Choose Your Bet ';
                        Embed2.Description = `**What do you want to bet on?**
                        
**Select an option below or type a number (0-36):**`;

                        const rowRow2 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('choice_red').setLabel('Red').setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('choice_black').setLabel('Black').setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('choice_even').setLabel('Even').setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('choice_odd').setLabel('Odd').setStyle(ButtonStyle.Primary)
                        );
                        const rowRow3 = new ActionRowBuilder().addComponents(
                            new ButtonBuilder().setCustomId('choice_low').setLabel('Low (1-18)').setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('choice_high').setLabel('High (19-36)').setStyle(ButtonStyle.Success)
                        );

                        interaction.channel.send({ embeds: [CreateEmbed(Embed2)], components: [rowRow2, rowRow3] }).then(Sent2 => {
                            const choiceBtnCollector = Sent2.createMessageComponentCollector({ filter: btn_filter, componentType: ComponentType.Button, time: 30000, max: 1 });
                            const choiceMsgCollector = Sent2.channel.createMessageCollector({ filter: interaction_filter, time: 30000, max: 1 });

                            let handleChoice = (choice, choiceInteraction = null) => {
                                choiceBtnCollector.stop('resolved');
                                choiceMsgCollector.stop('resolved');

                                if (choiceInteraction) {
                                    choiceInteraction.deferUpdate().catch(() => {});
                                }

                                const disabledRow2 = new ActionRowBuilder().addComponents(rowRow2.components.map(c => ButtonBuilder.from(c).setDisabled(true)));
                                const disabledRow3 = new ActionRowBuilder().addComponents(rowRow3.components.map(c => ButtonBuilder.from(c).setDisabled(true)));
                                Sent2.edit({ components: [disabledRow2, disabledRow3] }).catch(() => {});

                                // Spin the wheel
                                const winningNumber = Math.floor(Math.random() * 37); // 0-36
                                let winningColor = 'green';
                                if (RouletteNumbers.red.includes(winningNumber)) {
                                    winningColor = 'red';
                                } else if (RouletteNumbers.black.includes(winningNumber)) {
                                    winningColor = 'black';
                                }

                                let won = false;
                                let multiplier = 0;

                                // Check if user won
                                const numChoice = parseInt(choice);
                                if (!isNaN(numChoice) && numChoice >= 0 && numChoice <= 36) {
                                    // Bet on specific number
                                    if (numChoice === winningNumber) {
                                        won = true;
                                        multiplier = 35; // 35:1 payout
                                    }
                                } else if (choice === 'red' || choice === 'black') {
                                    // Bet on color
                                    if (choice === winningColor) {
                                        won = true;
                                        multiplier = 1; // 1:1 payout
                                    }
                                } else if (choice === 'even' || choice === 'odd') {
                                    // Bet on even/odd
                                    if (winningNumber !== 0) {
                                        const isEven = winningNumber % 2 === 0;
                                        if ((choice === 'even' && isEven) || (choice === 'odd' && !isEven)) {
                                            won = true;
                                            multiplier = 1; // 1:1 payout
                                        }
                                    }
                                } else if (choice === 'low' || choice === 'high') {
                                    // Bet on low/high
                                    if (winningNumber >= 1 && winningNumber <= 18 && choice === 'low') {
                                        won = true;
                                        multiplier = 1; // 1:1 payout
                                    } else if (winningNumber >= 19 && winningNumber <= 36 && choice === 'high') {
                                        won = true;
                                        multiplier = 1; // 1:1 payout
                                    }
                                }

                                // Calculate winnings
                                let Winnings = 0;
                                if (won) {
                                    Winnings = Bet * multiplier;
                                    User.cash += Winnings;
                                } else {
                                    User.cash -= Bet;
                                    Winnings = -Bet;
                                }

                                // Get color emoji
                                let colorEmoji = '🟢';
                                if (winningColor === 'red') colorEmoji = '🔴';
                                if (winningColor === 'black') colorEmoji = '⚫';

                                // Create result embed
                                const ResultEmbed = structuredClone(Bot.Embed);
                                ResultEmbed.Title = won ? ' 🇼 🇮 🇳 🇳 🇪 🇷 ' : ' 🇱 🇴 🇸 🇪 🇷 ';
                                ResultEmbed.Description = ` **ROULETTE SPIN** 

${colorEmoji} **Winning Number: ${winningNumber}** ${colorEmoji}
Color: ${winningColor.toUpperCase()}

Your Bet: ${choice}
Amount Bet: ${Bet}
${won ? `Multiplier: ${multiplier}x` : ''}
Cash Won/Lost: ${Winnings}

New Wallet Value: ${User.cash}`;
                                ResultEmbed.Image = 'https://media.tenor.com/X6hWPXlAYGkAAAA1/roulette-game.webp';

                                interaction.channel.send({ embeds: [CreateEmbed(ResultEmbed)] });
                            };

                            choiceBtnCollector.on('collect', i => {
                                handleChoice(i.customId.split('_')[1], i);
                            });

                            choiceMsgCollector.on('collect', msg => {
                                handleChoice(msg.content.toLowerCase().trim());
                            });
                        });
                    } else {
                        const Embed = structuredClone(Bot.Embed);
                        Embed.Title = 'Nope.';
                        Embed.Description = 'You dont have that much money or did not enter a valid number.';
                        if (isInteractionReply) {
                            isInteractionReply.reply({ embeds: [CreateEmbed(Embed)], flags: 64 }).catch(() => {});
                        } else {
                            interaction.channel.send({ embeds: [CreateEmbed(Embed)] });
                        }
                    }
                };

                btnCollector.on('collect', i => {
                     handleBet(Math.floor(parseInt(i.customId.split('_')[1])), i);
                });

                msgCollector.on('collect', msg => {
                     const val = Math.floor(msg.content);
                     if (!isNaN(val)) {
                         handleBet(val);
                     }
                });
            });
        });
    }
}
