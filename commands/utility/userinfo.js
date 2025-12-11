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
        const isInteraction = msg.commandName !== undefined;
        const channel = msg.channel;
        
        let targetUser = null;
        let targetMember = null;
        
        if (isInteraction) {
            // Slash command - check for user option
            targetMember = msg.options.getMember('user');
            if (targetMember) {
                targetUser = GetUser(targetMember.id, Bot);
            }
        } else {
            // Text command - check for mention
            targetMember = msg.mentions.members.first();
            if (targetMember) {
                targetUser = GetUser(targetMember.id, Bot);
            }
        }
        
        const Embed = structuredClone(Bot.Embed);
        let servermessages = 0;
        
        if (targetMember && targetUser) {
            // Show info for mentioned/selected user
            Bot.ServerMessages.forEach(function (Message) {
                if (Message.serverid == msg.guild.id && Message.userid == targetUser.userid) {
                    servermessages += 1;
                }
            });
            Embed.Title = 'User Info: ' + targetMember.user.username;
            Embed.Description = `**Total Messages:** ${targetUser.messages}

**Server Messages:** ${servermessages}

**Cash:** ${targetUser.cash}
`;
            Embed.Image = targetMember.user.avatarURL();
        } else {
            // Show info for command author
            const authorId = isInteraction ? msg.user.id : msg.author.id;
            const authorUsername = isInteraction ? msg.user.username : msg.author.username;
            const authorAvatar = isInteraction ? msg.user.avatarURL() : msg.author.avatarURL();
            
            Bot.ServerMessages.forEach(function (Message) {
                if (Message.serverid == msg.guild.id && Message.userid == User.userid) {
                    servermessages += 1;
                }
            });
            Embed.Title = 'User Info: ' + authorUsername;
            Embed.Description = `**Total Messages:** ${User.messages}

**Server Messages:** ${servermessages}

**Cash:** ${User.cash}
`;
            Embed.Image = authorAvatar;
        }
        
        // Send response
        if (isInteraction) {
            msg.reply({ embeds: [CreateEmbed(Embed)] });
        } else {
            channel.send({ embeds: [CreateEmbed(Embed)] });
        }
    }
}
