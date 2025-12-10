import { CreateEmbed, SetCoolDown, AlertCoolDown, CheckCoolDown } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

const BasicWork = [
    { Desc: 'Walking the street you find a signed 9000inc poster, might be worth something at a pawn shop.', Tone: 1 },//1 good 2 bad 3 none 4 rng
    { Desc: "Walking the street you spot a belgian hare, Woah.", Tone: 1 },
    { Desc: "Walking the street you see some money on the ground", Tone: 1 },
    { Desc: "Walking the street you ask yourself why am I walking the street?", Tone: 3 },
    { Desc: 'Walking the street you trip over your foot and break your ankle.. Clumsy.', Tone: 2 },
    { Desc: 'Walking the street you well walked the street guess that was a waste of time...', Tone: 3 },
    { Desc: 'Walking the street you encounter a man named slim shady.', Tone: 4 },
    { Desc: 'You go to work and work hard surely your boss will notice.', Tone: 1 },
    { Desc: 'You go to work and slack off the whole day.', Tone: 1 },
    { Desc: 'You go to work and try to make it look like your doing something.', Tone: 1 },
    { Desc: 'You go to work and sleep.', Tone: 1 },
    { Desc: "You go to work but it's covid rules so you can play game's.", Tone: 1 },
    { Desc: "You go to work and do a normal day's work.", Tone: 1 },
    { Desc: "You use a paid vacation day from work!", Tone: 1 },
    { Desc: "You go to work and get injured but don't report it...", Tone: 2 },
    { Desc: "You go to work and they send you home cause theres not enough volume or something..", Tone: 3 },
    { Desc: "You go to go to work but then call in just cough if the boss see's you in town..", Tone: 3 },
    { Desc: "You go to work and the boss call's you into their office, Hmmmm.", Tone: 4 },
    { Desc: "You take a trip to the store a guy won't stop talking to you about switching internet services...", Tone: 3 },
    { Desc: "You take a trip to the store and see mr beast!", Tone: 1 },
    { Desc: "You take a trip to the store and buy the stuff you need, Cant someone else buy this?", Tone: 2 },
    { Desc: "You take a trip to the store and someone in line feels bad they pay for your stuff and give you some money. Maybe you should clean up.", Tone: 1 },
    { Desc: "You take a trip to the store and buy a hand carved owl statue. **Respect Gained+**", Tone: 1 },
    { Desc: "You take a trip to the store and spend all your money on lotto tickets!", Tone: 4 },
    { Desc: "Strolling the mall a guy offers you a free shoe shine! Aw crap he made you tip him or he won't do the other shoe....", Tone: 2 },
    { Desc: "Strolling the mall you enter in a pie eating contest", Tone: 4 },
    { Desc: "Strolling the mall you look at all the things you want to buy but cant afford at least no one robbed you. WAIT DOES HE HAVE A GUN oh no it was just a cellphone, where was I? it was a ok day at the mall i guess", Tone: 3 },
    { Desc: "Strolling the mall you sign up on a fast food app to get a free meal, Ronald said the first one's free.", Tone: 1 },
    { Desc: "Strolling the mall you buy a hello kitty jacket that's not gay. Everyone calls you gay...", Tone: 2 },
    { Desc: "Strolling the mall a nice man in a easter bunny costume offers a seat on his lap, what could go wrong.", Tone: 3 },
    { Desc: "Strolling the mall you found a dudes wallet sweet bro!", Tone: 1 },
    { Desc: "Strolling the mall a car hit's you and he does not have insurance, its ok though he does have money", Tone: 1 },
    { Desc: "You go on a hike and stare at animal's, rather strange if you think about it.", Tone: 3 },
    { Desc: "You go on a hike wearing a halloween costume and some people go running and drop their stuff, I wonder why?", Tone: 1 },
    { Desc: "You go on a hike and find a backpack! Nothing really but trash in here..", Tone: 3 },
    { Desc: "You go on a hike and watch fish swim in the lake well kind of they are hard to see in the polluted water.", Tone: 3 },
    { Desc: "You go on a hike and spot the rare Pernambuco Pygmy it drop's you a coin.", Tone: 1 },
    { Desc: "You sit home all day and sleep, that was productive..", Tone: 3 },
    { Desc: "The IRS sent you a letter, you forgot to pay your taxes...", Tone: 2 },
    { Desc: "You decide to play the stock market!", Tone: 4 },
    { Desc: "You sign up for a stock market app and get a free stock, well thats something.", Tone: 1 },
    { Desc: "You sit all day typing commands on social media technically it does earn you cash.", Tone: 1 },
    { Desc: "You vote 9000inc for president and he gives you money", Tone: 1 },
    { Desc: "You enter in a 9000inc giveaway and win!", Tone: 1 },
    { Desc: "You enter in a 9000inc giveaway and don't win rip.", Tone: 3 },
    { Desc: "You hate your old job so you get a new one.", Tone: 4 },
];

export default {
    name: 'work',
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Work a random job to earn cash'),
    aliases: ['!9k Work'],
    execute(msg, User, Bot) {
        const cooldownkey = `Work-${msg.author.id}`;
        if (CheckCoolDown(cooldownkey)) {
            return AlertCoolDown(msg, cooldownkey, Bot)
        }
        SetCoolDown(msg, cooldownkey, 5000);

        msg.guild.members.fetch(msg.author.id).then(MemberCache => {
            const Embed = structuredClone(Bot.Embed);
            let Job = BasicWork[Math.floor(Math.random() * BasicWork.length)];
            if (Job.Tone == 4) {
                Job.Tone = Math.floor(Math.random() * 3) + 1;
            }
            if (MemberCache.roles.cache.some(role => role.name === '!9k-Workaholic')) {
                for (let i = 0; i < 3; i++) {
                    if (Job.Tone == 1) { }
                    else {
                        Job = BasicWork[Math.floor(Math.random() * BasicWork.length)];
                    }
                }
            }
            let Cash = 0;
            if (Job.Tone == 1) {
                Embed.Color = 5763719;
                Cash = Math.floor(Math.random() * 35) + 1;
            }
            if (Job.Tone == 2) {
                Embed.Color = 15548997;
                Cash = (Math.floor(Math.random() * 15) + 1) * -1;
            }
            if (Job.Tone == 3) { Embed.Color = 9807270 }

            if (MemberCache.roles.cache.some(role => role.name === '!9k-Workaholic')) {
                if (Cash >= 1) {
                    Cash = Cash * 1.5;
                }
            }

            User.cash += Cash;

            Embed.Title = 'Cash Earned: ' + Cash;
            Embed.Description = Job.Desc + `

New Wallet Value: ${User.cash}`;
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        })
    }
}
