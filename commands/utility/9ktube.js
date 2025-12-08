import { CreateEmbed } from '../../utils/functions.js';

export default {
    name: '9ktube',
    aliases: ['!9k 9kTube', '!9k Youtube'],
    execute(msg, User, Bot) {
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = "9kTube";
        Embed.Description = `Adds all kinds of features to youtube Volume/Bass dials, Adblocking, Themes, Stats & More!`;
        Embed.Thumbnail = false;
        Embed.Image = false;
        const AdvEmbed = CreateEmbed(Embed);
        AdvEmbed.addFields(
            { name: '9kTube Stable', value: 'https://9000inc.com/9kTube/' },
            { name: '9kTube Beta', value: 'https://9000inc.com/9kTube/Beta' },
            { name: '9kTube Install', value: 'https://youtube.com/live/Eox5OUW8CvI?feature=share' });
        msg.channel.send({ embeds: [AdvEmbed] });
    }
}
