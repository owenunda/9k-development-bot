import { CreateEmbed, SearchString } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'servers',
    data: new SlashCommandBuilder()
        .setName('servers')
        .setDescription('List all servers the 9k bot is in'),
    aliases: ['!9k Servers Im In', '!9k Server List', '!9k List Servers', '!9k Servers List', '!9k All Server', '!9k Get Server', '!9k what servers are you in'],
    execute(msg, User, Bot) {
        const Guilds = Bot.Client.guilds.cache;

        const Embed = structuredClone(Bot.Embed);
        Embed.Title = "List of guild's I am in!";
        Embed.Description = ``;
        Embed.Thumbnail = false;
        Embed.Image = false;

        Guilds.each(Guild => {
            Embed.Description += `**Guild: ${Guild.name}** *Online Members - ${Guild.approximatePresenceCount} / ${Guild.memberCount}*
*Member Since: ${Guild.joinedAt}*
`;
        });
        msg.channel.send({ embeds: [CreateEmbed(Embed)] });
    }
}
