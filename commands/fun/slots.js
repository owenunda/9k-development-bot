import { CreateEmbed, SetCoolDown, AlertCoolDown, CheckCoolDown } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

const Emojis = [
    '🍊', '🍊', '🍆', '🍆', '🍇', '🍇', '🍅', '🍓', '🍓', '💀', '🐰', '🐰', '🐰', '🐰',
    '🦉', '🦉', '🦉', '🦉', '🃏', '🍒', '🍒', '💣', '🍌', '🍌', '🍐', '🍐', '👑', '💰',
    '💎',
    '<:9000INC:771512087280091186>'
];

export default {
    name: 'slots',
    data: new SlashCommandBuilder()
        .setName('slots')
        .setDescription('Play the slot machine and bet your cash'),
    aliases: ['!9k Slots', '!9k Play Slots'],
    execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        const userId = isInteraction ? msg.user.id : msg.author.id;
        const username = isInteraction ? msg.user.username : msg.author.username;
        const channel = msg.channel;

        const cooldownkey = `Slots-${userId}`;
        if (CheckCoolDown(cooldownkey)) {
            return AlertCoolDown(msg, cooldownkey, Bot)
        }
        SetCoolDown(msg, cooldownkey, 9000);

        let maxbet = 100;
        msg.guild.members.fetch(userId).then(MemberCache => {
            if (MemberCache.roles.cache.some(role => role.name === '!9k-Gambler')) {
                maxbet = maxbet * 5;
            }

            const Embed = structuredClone(Bot.Embed);

            Embed.Title = 'Play Slots?';
            Embed.Description = `Enter a amount of cash to bet! (Max ${maxbet})`;
            
            const sendMessage = isInteraction 
                ? msg.reply({ embeds: [CreateEmbed(Embed)] })
                : channel.send({ embeds: [CreateEmbed(Embed)] });
            
            sendMessage.then(Sent => {
                const msg_filter = response => { return response.author.id === userId };
                channel.awaitMessages({ filter: msg_filter, max: 1 }).then((collected) => {
                    const Bet = Math.floor(collected.first().content);
                    if (User.cash >= Bet && Bet <= maxbet && Bet >= 1) {
                        const UserRoll = {};
                        let TrippleBonus = false;
                        let JackPot = false;
                        let Winnings = 0;
                        let Prize = 0;

                        const BettingOdds = Math.floor(25 - (Bet / 5));
                        console.log('User Betting: ' + Bet.toString() + ' Odds Of Winning: ' + BettingOdds.toString());
                        UserRoll.one = Emojis[Math.floor(Math.random() * Emojis.length)];
                        UserRoll.two = Emojis[Math.floor(Math.random() * Emojis.length)];
                        UserRoll.three = Emojis[Math.floor(Math.random() * Emojis.length)];
                        if (BettingOdds >= 1) {
                            for (let i = 0; i < BettingOdds; i++) {
                                if (UserRoll.one != UserRoll.two) {
                                    UserRoll.two = Emojis[Math.floor(Math.random() * Emojis.length)];
                                }
                                if (UserRoll.two != UserRoll.three) {
                                    UserRoll.three = Emojis[Math.floor(Math.random() * Emojis.length)];
                                }
                            }
                        }
                        User.cash = User.cash - Bet;
                        Winnings = Winnings - Bet;
                        if (UserRoll.one == UserRoll.two || UserRoll.one == UserRoll.three || UserRoll.two == UserRoll.three) {//win
                            let bad = 0;
                            if (UserRoll.one == '💀' || UserRoll.one == '💣' || UserRoll.one == '🍅') { bad += 1 }
                            if (UserRoll.two == '💀' || UserRoll.two == '💣' || UserRoll.two == '🍅') { bad += 1 }
                            if (UserRoll.three == '💀' || UserRoll.three == '💣' || UserRoll.three == '🍅') { bad += 1 }
                            if (bad <= 1) {
                                if (UserRoll.one == UserRoll.two && UserRoll.two == UserRoll.three) {
                                    TrippleBonus = true;
                                    if (UserRoll.one == '<:9000INC:771512087280091186>') { JackPot = true };
                                }
                                Prize = Bet * 1.5;
                                if (TrippleBonus) {
                                    Prize = Prize * 3;
                                }
                                if (JackPot) {
                                    Prize = Prize * 10;
                                }
                                Winnings += Prize;
                                User.cash += Prize;
                                const Embed = structuredClone(Bot.Embed);
                                Embed.Title = '🇼 🇮 🇳 🇳 🇪 🇷';
                                // 🇼 🇮 🇳 🇪 🇷 🇱 🇴 🇸
                                Embed.Description = `🇷 🇴 🇱 🇱 🇸

▶️ ` + UserRoll.one + ' | ' + UserRoll.two + ' | ' + UserRoll.three + ` ◀️

User: ${username}
Cash Won: ${Winnings}
Tripple Bonus: ${TrippleBonus}
JackPot: ${JackPot}
New Wallet Value: ${User.cash}
`;
                                channel.send({ embeds: [CreateEmbed(Embed)] });

                            }
                        }
                        else {//lose
                            const Embed = structuredClone(Bot.Embed);
                            Embed.Title = '🇱 🇴 🇸 🇪 🇷';
                            Embed.Description = `🇷 🇴 🇱 🇱 🇸

▶️ ` + UserRoll.one + ' | ' + UserRoll.two + ' | ' + UserRoll.three + ` ◀️

User: ${username}
Cash Won: ${Winnings}
New Wallet Value: ${User.cash}
`;
                            channel.send({ embeds: [CreateEmbed(Embed)] });
                        }

                    }
                    else {
                        const Embed = structuredClone(Bot.Embed);
                        Embed.Title = 'Nope.';
                        Embed.Description = 'You dont have that much money or did not enter a number stop being silly.';
                        channel.send({ embeds: [CreateEmbed(Embed)] });
                    }
                })
            })

        })
    }
}
