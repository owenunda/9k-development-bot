import { CreateEmbed } from '../../utils/functions.js';

export default {
    name: 'coinflip',
    aliases: ['!9k coin flip', '!9k flip coin', '!9k heads or', '!9k tails or'],
    execute(msg, User, Bot) {
        let Res = Math.floor(Math.random() * 2);
        if (Res == 0) { Res = 'Heads' }
        else { Res = 'Tails' }
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = "Heads Or Tails!"
        Embed.Description = `Result: ${Res} 🪙`
        msg.channel.send({ embeds: [CreateEmbed(Embed)] });
    }
}
