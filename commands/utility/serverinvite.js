import { AddServer, GetServer } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'serverinvite',
    // HIERARCHY IMPROVEMENT: Enhanced server registration system
    data: new SlashCommandBuilder()
        .setName('serverinvite')
        .setDescription('Register your server in the 9k bot community leaderboard')
        .addStringOption(option =>
            option.setName('invite')
                .setDescription('The discord invite link for your server')
                .setRequired(true)),
    aliases: [],
    async execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        let inviteLink = '';

        const guild = isInteraction ? msg.guild : msg.guild;
        const adminRole = guild?.roles?.cache?.find(role => role.name === '!9k-Admin');
        let hasAdminRole = false;

        if (adminRole && guild) {
            if (isInteraction) {
                const member = guild.members.cache.get(msg.user.id) || await guild.members.fetch(msg.user.id).catch(() => null);
                hasAdminRole = member?.roles?.cache?.has(adminRole.id) || false;
            } else {
                hasAdminRole = msg.member?.roles?.cache?.has(adminRole.id) || false;
            }
        }

        if (!hasAdminRole) {
            const errorMsg = "You need the !9k-Admin role to use this command.";
            if (isInteraction) {
                return msg.reply({ content: errorMsg, ephemeral: true });
            }
            return msg.reply(errorMsg);
        }

        if (isInteraction) {
            inviteLink = msg.options.getString('invite');
            await msg.deferReply();
        } else {
            const args = msg.content.split(' ');
            if (args.length >= 4) {
                inviteLink = args[3];
            } else {
                return msg.reply("Please provide an invite link. Usage: `!9k server invite <link>`");
            }
        }

        if (!inviteLink.includes('discord.gg') && !inviteLink.includes('discord.com/invite')) {
            const errorMsg = "Invalid invite link. Please provide a valid Discord invite URL.";
            if (isInteraction) return msg.editReply(errorMsg);
            else return msg.reply(errorMsg);
        }

        const serverId = isInteraction ? msg.guildId : msg.guild.id;

        if (!serverId) {
            const errorMsg = "This command must be used within a server.";
            if (isInteraction) return msg.editReply(errorMsg);
            else return msg.reply(errorMsg);
        }

        const existingServer = GetServer(serverId, Bot);

        if (existingServer) {
            AddServer(serverId, inviteLink, Bot);
            const successMsg = "Server link updated successfully!";
            if (isInteraction) await msg.editReply(successMsg);
            else msg.reply(successMsg);
        } else {
            AddServer(serverId, inviteLink, Bot);
            const successMsg = `Server registered successfully! You can now vote for it using \`!9k vote ${serverId}\` or \`/vote ${serverId}\``;
            if (isInteraction) await msg.editReply(successMsg);
            else msg.reply(successMsg);
        }
    }
}
