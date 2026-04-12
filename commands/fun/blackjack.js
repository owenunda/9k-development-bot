// MOVABLE: 9kFun bot - Blackjack gambling game
// This command will be moved to a separate 9kFun bot in the future
import { CreateEmbed, SearchString, SetCoolDown, AlertCoolDown, CheckCoolDown, GetRandomFunCooldown } from '../../utils/functions.js';
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

const Cards = [
    'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'King', 'Queen', 'Jack'
];

function BlackJackHandTotal(Hand) {
    let total = 0;
    Hand.forEach(function (c) {
        if (c == 'King' || c == 'Queen' || c == 'Jack') {
            total += 10;
        }
        else {
            total += parseFloat(c);
        }
    });
    return total;
}

function BlackJackDrawCard(Hand) {
    let total = BlackJackHandTotal(Hand);
    const card = Cards[Math.floor(Math.random() * Cards.length)];
    if (card == 'Ace') {
        if (total + 11 > 21) {
            Hand.push('1');
        }
        else {
            Hand.push('11');
        }
    }
    else {
        Hand.push(card);
    }
    total = BlackJackHandTotal(Hand);
    return total;
}

function HandToEmoji(Hand) {
    let Emojis = '';
    const cardtypes = ['❤️', '♠️', '♣️', '♦️'];
    Hand.forEach(function (card) {
        const cardtype = cardtypes[Math.floor(Math.random() * cardtypes.length)];
        if (card == 'King' || card == 'Queen' || card == 'Jack') {
            Emojis += `${cardtype}(10) | `;
        }
        else if (card == '1' || card == '11') {
            Emojis += `🃏(${card}) | `;
        }
        else {
            Emojis += `${cardtype}(${card}) | `;
        }
    });
    return Emojis;
}

function BlackJackLoop(Game, msg, User, Bot) {
    const isInteraction = msg.commandName !== undefined;
    const userId = isInteraction ? msg.user.id : msg.author.id;
    const username = isInteraction ? msg.user.username : msg.author.username;
    const channel = msg.channel;

    if (Game.LastChoice == false || Game.LastChoice == 'Draw') {
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = `Black Jack - ${username}`;
        Embed.Description = `Cards: ${HandToEmoji(Game.Cards.User)}
Total: ${BlackJackHandTotal(Game.Cards.User)}

House: ${HandToEmoji(Game.Cards.House)}
Total: ${BlackJackHandTotal(Game.Cards.House)}

**Select An Action Below:**`;

        const row = new ActionRowBuilder().addComponents(
             new ButtonBuilder()
                .setCustomId('hit')
                .setLabel('Draw (Hit)')
                .setStyle(ButtonStyle.Primary),
             new ButtonBuilder()
                .setCustomId('stand')
                .setLabel('Stand')
                .setStyle(ButtonStyle.Secondary),
             new ButtonBuilder()
                .setCustomId('double')
                .setLabel('Double Down')
                .setStyle(ButtonStyle.Danger)
                .setDisabled(User.cash < Game.Bet * 2 || Game.Cards.User.length > 2)
        );

        channel.send({ embeds: [CreateEmbed(Embed)], components: [row] }).then(Sent => {
            const filter = i => i.user.id === userId;
            const collector = Sent.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 60000, max: 1 });
            
            collector.on('collect', i => {
                let Choice = false;
                if (i.customId === 'hit') {
                    Choice = 'Draw';
                    BlackJackDrawCard(Game.Cards.User);
                    if (BlackJackHandTotal(Game.Cards.User) > 21) {
                        Choice = 'Bust';
                    }
                } else if (i.customId === 'double') {
                    Choice = 'Double Down';
                } else if (i.customId === 'stand') {
                    Choice = 'Stand';
                }
                
                Game.LastChoice = Choice;
                
                const disabledRow = new ActionRowBuilder().addComponents(
                    row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
                );
                i.update({ components: [disabledRow] }).catch(() => {});
                
                BlackJackLoop(Game, msg, User, Bot);
            });
            
            collector.on('end', collected => {
                if (collected.size === 0) {
                    Game.LastChoice = 'Stand';
                    const disabledRow = new ActionRowBuilder().addComponents(
                        row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
                    );
                    Sent.edit({ components: [disabledRow] }).catch(() => {});
                    BlackJackLoop(Game, msg, User, Bot);
                }
            });
        });
    }
    else {//Stand / Double Down / Bust
        if (Game.LastChoice == 'Bust') {
            User.cash += -Game.Bet;
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = `Black Jack - ${username}`;
            Embed.Description = `**Oh No! You busted...**
*Better luck next time champ, go clean yourself up.*

New Wallet Value: ${User.cash}

Cards: ${HandToEmoji(Game.Cards.User)}
Total: ${BlackJackHandTotal(Game.Cards.User)}

House: ${HandToEmoji(Game.Cards.House)}
Total: ${BlackJackHandTotal(Game.Cards.House)}
`;
            channel.send({ embeds: [CreateEmbed(Embed)] });
        }
        else {
            if (Game.LastChoice == 'Double Down') {
                Game.Bet = Game.Bet * 2;
                Game.LastChoice = 'Stand';
                BlackJackDrawCard(Game.Cards.User);
            }
            //House Turn
            if (BlackJackHandTotal(Game.Cards.House) > 21) {//House Bust
                User.cash += Game.Bet;
                const Embed = structuredClone(Bot.Embed);
                Embed.Title = `Black Jack - ${username}`;
                Embed.Description = `**The house busted???**
*Knew I should have set a max value of 21 for the house..*

New Wallet Value: ${User.cash}

Cards: ${HandToEmoji(Game.Cards.User)}
Total: ${BlackJackHandTotal(Game.Cards.User)}

House: ${HandToEmoji(Game.Cards.House)}
Total: ${BlackJackHandTotal(Game.Cards.House)}
`;
                channel.send({ embeds: [CreateEmbed(Embed)] });
            }
            else {
                if (BlackJackHandTotal(Game.Cards.House) > BlackJackHandTotal(Game.Cards.User)) {//House win
                    User.cash += -Game.Bet;
                    const Embed = structuredClone(Bot.Embed);
                    Embed.Title = `Black Jack - ${username}`;
                    Embed.Description = `**The house always wins...**
*The odds were against you all along.*

New Wallet Value: ${User.cash}

Cards: ${HandToEmoji(Game.Cards.User)}
Total: ${BlackJackHandTotal(Game.Cards.User)}

House: ${HandToEmoji(Game.Cards.House)}
Total: ${BlackJackHandTotal(Game.Cards.House)}
`;
                    channel.send({ embeds: [CreateEmbed(Embed)] });
                }
                else {
                    BlackJackDrawCard(Game.Cards.House);
                    BlackJackLoop(Game, msg, User, Bot);
                }
            }
        }//stand/double down
    }
}

export default {
    name: 'blackjack',
    // MOVABLE: 9kFun bot - This gambling command will move to separate bot
    data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('Play blackjack and bet your cash (🎮 Fun command - may move to 9kFun bot)'),
    aliases: [],
    botPoints: true,
    execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        const userId = isInteraction ? msg.user.id : msg.author.id;
        const channel = msg.channel;

        const cooldownkey = `BlackJack-${userId}`;
        if (CheckCoolDown(cooldownkey)) {
            return AlertCoolDown(msg, cooldownkey, Bot)
        }
        SetCoolDown(msg, cooldownkey, GetRandomFunCooldown());

        let maxbet = 100;
        msg.guild.members.fetch(userId).then(MemberCache => {
            if (MemberCache.roles.cache.some(role => role.name === '!9k-Gambler')) {
                maxbet = maxbet * 5;
            }

            const Embed = structuredClone(Bot.Embed);
            Embed.Title = 'Play Blackjack?';
            Embed.Description = `Enter a amount of cash to bet! (Max ${maxbet})`;
            
            const row = new ActionRowBuilder().addComponents(
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
                ? msg.reply({ embeds: [CreateEmbed(Embed)], components: [row], fetchReply: true })
                : channel.send({ embeds: [CreateEmbed(Embed)], components: [row] });
            
            sendMessage.then(Sent => {
                const msg_filter = response => { return response.author.id === userId };
                const btn_filter = i => i.user.id === userId;
                
                const btnCollector = Sent.createMessageComponentCollector({ filter: btn_filter, componentType: ComponentType.Button, time: 30000, max: 1 });
                const msgCollector = channel.createMessageCollector({ filter: msg_filter, time: 30000, max: 1 });

                let handleBet = (Bet, isInteractionReply = null) => {
                    btnCollector.stop('resolved');
                    msgCollector.stop('resolved');
                    if (User.cash >= Bet && Bet <= maxbet && Bet >= 1) {
                        const Game = {};
                        Game.Cards = {};
                        Game.Cards.User = [];
                        Game.Cards.House = [];
                        Game.LastChoice = false;
                        Game.Bet = Bet;
                        if (isInteractionReply) {
                            isInteractionReply.deferUpdate().catch(() => {});
                        }
                        BlackJackDrawCard(Game.Cards.User);
                        BlackJackDrawCard(Game.Cards.House);
                        
                        const disabledRow = new ActionRowBuilder().addComponents(
                            row.components.map(c => ButtonBuilder.from(c).setDisabled(true))
                        );
                        Sent.edit({ components: [disabledRow] }).catch(() => {});

                        BlackJackLoop(Game, msg, User, Bot);
                    }
                    else {//money issue
                        const Embed = structuredClone(Bot.Embed);
                        Embed.Title = 'Nope.';
                        Embed.Description = 'You dont have that much money or did not enter a valid number stop being silly.';
                        if (isInteractionReply) {
                            isInteractionReply.reply({ embeds: [CreateEmbed(Embed)], flags: 64 }).catch(() => {});
                        } else {
                            channel.send({ embeds: [CreateEmbed(Embed)] });
                        }
                    }
                };

                btnCollector.on('collect', i => {
                    const betAmount = parseInt(i.customId.split('_')[1]);
                    handleBet(betAmount, i);
                });

                msgCollector.on('collect', collected => {
                    const betAmount = Math.floor(collected.content);
                    if (!isNaN(betAmount)) {
                        handleBet(betAmount);
                    }
                });
            })
        })
    }
}
