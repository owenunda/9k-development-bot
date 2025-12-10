import { CreateEmbed } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'invite',
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Get the invite link to add 9k bot to your server'),
    aliases: ['!9k Invite', 'get !9k', 'invite !9k', '!9k bot invite', '!9k join link', '!9k link', 'link !9k', 'add !9k', '!9k add', '!9k server invite', '!9k guild invite'],
    execute(msg, User, Bot) {
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = "Invite 9k to your server! (please? he's kinda lonely..)";
        Embed.Description = ``;
        const embed = CreateEmbed(Embed);
        embed.addFields(
            { name: '9k Invite', value: Bot.Invite },
            { name: '9k Server', value: Bot.ServerInvite });
        msg.channel.send({ embeds: [embed] });
    }
}
