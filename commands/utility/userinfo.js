import { CreateEmbed, GetUser } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'userinfo',
    // HIERARCHY IMPROVEMENT: Enhanced user command for profile and stats
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display user information including balance, messages, and stats')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to get info about (optional)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('view')
                .setDescription('Type of information to display')
                .setRequired(false)
                .addChoices(
                    { name: 'Profile (default)', value: 'profile' },
                    { name: 'Stats & Analytics', value: 'stats' }
                )),
    aliases: ['!9k User', '!9k bal', '!9k balance', '!9k wallet', '!9k profile', '!9k stats'],
    execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        const channel = msg.channel;
        
        let targetUser = null;
        let targetMember = null;
        let viewType = 'profile'; // Default view
        
        if (isInteraction) {
            // HIERARCHY: Handle slash command options
            targetMember = msg.options.getMember('user');
            viewType = msg.options.getString('view') || 'profile';
            if (targetMember) {
                targetUser = GetUser(targetMember.id, Bot);
            }
        } else {
            // BACKWARD COMPATIBILITY: Text command handling (unchanged logic)
            targetMember = msg.mentions.members.first();
            if (targetMember) {
                targetUser = GetUser(targetMember.id, Bot);
            }
            // Detect view type from command aliases
            if (SearchString(msg.content, ['!9k stats'])) {
                viewType = 'stats';
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
            
            // HIERARCHY: Different views based on selection
            if (viewType === 'stats') {
                Embed.Title = '📊 User Stats: ' + targetMember.user.username;
                Embed.Description = `**📈 Message Analytics**
Server Messages: ${servermessages}
Total Messages: ${targetUser.messages}
Messages Ratio: ${servermessages > 0 ? ((servermessages / targetUser.messages) * 100).toFixed(1) : 0}%

**💰 Economy Status**
Current Balance: ${targetUser.cash}
Website User: ${targetUser.websiteuser || 'Not linked'}`;
            } else {
                Embed.Title = '👤 User Profile: ' + targetMember.user.username;
                Embed.Description = `**💰 Balance:** ${targetUser.cash}

**📊 Activity**
Total Messages: ${targetUser.messages}
Server Messages: ${servermessages}`;
            }
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
            
            // HIERARCHY: Different views for self
            if (viewType === 'stats') {
                Embed.Title = '📊 Your Stats: ' + authorUsername;
                Embed.Description = `**📈 Message Analytics**
Server Messages: ${servermessages}
Total Messages: ${User.messages}
Messages Ratio: ${servermessages > 0 ? ((servermessages / User.messages) * 100).toFixed(1) : 0}%

**💰 Economy Status**
Current Balance: ${User.cash}
Website User: ${User.websiteuser || 'Not linked'}`;
            } else {
                Embed.Title = '👤 Your Profile: ' + authorUsername;
                Embed.Description = `**💰 Balance:** ${User.cash}

**📊 Activity**
Total Messages: ${User.messages}
Server Messages: ${servermessages}`;
            }
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
