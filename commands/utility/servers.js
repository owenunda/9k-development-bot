import { CreateEmbed } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'servers',
    // HIERARCHY IMPROVEMENT: Enhanced server leaderboard command
    data: new SlashCommandBuilder()
        .setName('servers')
        .setDescription('View the server leaderboard and community rankings'),
    aliases: ['!9k Servers', '!9k Servers List', '!9k Leaderboard', '!9k Server List', '/servers'],
    async execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        if (isInteraction) {
            await msg.deferReply();
        }

        const Embed = structuredClone(Bot.Embed);
        Embed.Title = "Server Leaderboard";
        Embed.Description = `Here are the top servers voted by users!\n\n`;
        Embed.Thumbnail = false;
        Embed.Image = false;

        // Get servers from Bot.Servers
        let Servers = Bot.Servers || [];
        
        Servers.sort((a, b) => b.points - a.points);
        
        const TopServers = Servers.slice(0, 15);
        
        if (TopServers.length === 0) {
            Embed.Description = "No servers have been registered yet or the leaderboard is being reset.";
        } else {
            let i = 1;
            TopServers.forEach(server => {
                const Guild = Bot.Client.guilds.cache.get(server.serverid);
                const ServerName = Guild ? Guild.name : `Unknown Server (${server.serverid})`;
                const InviteLink = server.link && server.link.startsWith('http') ? `[Join Server](${server.link})` : 'No Link';
                
                Embed.Description += `**${i}. ${ServerName}** - 🏆 ${server.points} Points\n${InviteLink}\n\n`;
                i++;
            });
        }

        if (isInteraction) {
            await msg.editReply({ embeds: [CreateEmbed(Embed)] });
        } else {
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
    }
}
