import { CreateEmbed } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'emote',
    data: new SlashCommandBuilder()
        .setName('emote')
        .setDescription('Get information about an emoji by reacting to the message'),
    aliases: ['!9k Emote'],
    execute(msg, User, Bot) {
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = 'React to this to get emote info!';
        Embed.Description = 'Awaiting emoji reaction.';

        msg.channel.send({ embeds: [CreateEmbed(Embed)] }).then(sent => {
            const filter = (reaction, user) => { return true };
            const collector = sent.createReactionCollector({ max: 3, });
            collector.on('collect', (reaction) => {
                const emoji = reaction.emoji;
                Embed.Title = 'Name: ' + emoji.name;
                Embed.Description = `Emoji info
Name:${emoji.name}
ID:${emoji.id}
Animated:${emoji.animated}
Identifier:${emoji.identifier}
Url:${emoji.url}
`;
                if (emoji.url) { Embed.Thumbnail = emoji.url }
                if (emoji.url) { Embed.Image = emoji.url }
                msg.channel.send({ embeds: [CreateEmbed(Embed)] });
            });

            // fires when the time limit or the max is reached
            collector.on('end', (collected, reason) => { console.log('done collecting emojis') })

        })
    }
}
