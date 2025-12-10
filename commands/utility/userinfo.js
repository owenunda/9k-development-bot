import { CreateEmbed, GetUser } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'userinfo',
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display user information including balance and messages')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get info about (optional)')
                .setRequired(false)),
    aliases: ['!9k User', '!9k bal', '!9k balance', '!9k wallet'],
    execute(msg, User, Bot) {
        const Mention = msg.mentions.members.first();
        const Embed = structuredClone(Bot.Embed);
        let servermessages = 0;
        if (Mention) {
            const MUser = GetUser(Mention.id, Bot);
            if (MUser) {
                Bot.ServerMessages.forEach(function (Message) {
                    if (Message.serverid == msg.guild.id && Message.userid == MUser.userid) {
                        servermessages += 1;
                    }
                });
                Embed.Title = 'User Info: ' + Mention.user.username;
                Embed.Description = `**Total Messages:** ${MUser.messages}

**Server Messages:** ${servermessages}

**Cash:** ${MUser.cash}
`;
                Embed.Image = Mention.user.avatarURL();
                msg.channel.send({ embeds: [CreateEmbed(Embed)] });
            }
        }
        else {
            Bot.ServerMessages.forEach(function (Message) {
                if (Message.serverid == msg.guild.id && Message.userid == User.userid) {
                    servermessages += 1;
                }
            });
            Embed.Title = 'User Info: ' + msg.author.username;
            Embed.Description = `**Total Messages:** ${User.messages}

**Server Messages:** ${servermessages}

**Cash:** ${User.cash}
`;
            Embed.Image = msg.author.avatarURL();
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
    }
}
