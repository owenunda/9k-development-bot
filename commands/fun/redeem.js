// MOVABLE: 9kFun bot - Code redemption system
// This command will be moved to a separate 9kFun bot in the future
import { CreateEmbed } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

const usedcodes = [];

export default {
    name: 'redeem',
    // MOVABLE: 9kFun bot - This reward system will move to separate bot
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Redeem a code for cash rewards (🎮 Fun command - may move to 9kFun bot)')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The code to redeem')
                .setRequired(true)),
    aliases: [],
    execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        const userId = isInteraction ? msg.user.id : msg.author.id;
        const channel = msg.channel;
        
        // Get the code based on command type
        let code;
        if (isInteraction) {
            // Slash command - get code from option and add prefix for comparison
            const codeInput = msg.options.getString('code');
            code = '!9k ' + codeInput;
        } else {
            // Text command - use full message content
            code = msg.content;
        }
        
        let isused = false;
        usedcodes.forEach(function (used) {
            if (used.user == userId && used.code == code) {
                const Embed = structuredClone(Bot.Embed);
                Embed.Title = "You used this code already.. -.-";
                Embed.Description = `rip`;
                
                if (isInteraction) {
                    msg.reply({ embeds: [CreateEmbed(Embed)] });
                } else {
                    channel.send({ embeds: [CreateEmbed(Embed)] });
                }
                isused = true;
            }
        });
        if (isused) { return }

        let codecash = 0;
        if (code == '!9k Lazyyy') {
            codecash = 125;
        }
        else if (code == '!9k CalOFduty9000') {
            codecash = 25;
        }
        else if (code == '!9k Bunny') {
            codecash = 50;
        }
        else if (code == '!9k HootHoot') {
            codecash = 125;
        }
        else if (code == '!9k Filthy') {
            codecash = 50;
        }
        else if (code == '!9k BigGay') {
            codecash = 75;
        }
        else if (code == '!9k MrBreast') {
            codecash = 200;
        }
        else if (code == '!9k 9kStudiosReborn') {
            codecash = 100;
        }
        else if (code == '!9k iloveyou') {
            codecash = 25;
        }
        else if (code == '!9k FREE') {
            codecash = 60;
        }
        else if (code == '!9k Daddy') {
            codecash = 25;
        }
        else if (code == '!9k uwu') {
            codecash = 25;
        }
        else if (code == '!9k Weeaboo') {
            codecash = 25;
        }
        else if (code == '!9k Aids') {
            codecash = 25;
        }
        else if (code == '!9k Crippling Depression Intensifies') {
            codecash = 1;
        }
        else if (code == '!9k Harambe') {
            codecash = 25;
        }
        else if (code == '!9k 9kmc') {
            codecash = 25;
        }
        else if (code == '!9k chocolate') {
            codecash = 50;
        }
        else if (code == '!9k revive') {
            codecash = 25;
        }
        else {
            codecash = 90;
        }
        User.cash += codecash;
        usedcodes.push({ user: userId, code: code });
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = `Code: ${code} Activated`;
        Embed.Description = `heres $${codecash}
New Wallet: ${User.cash}`;
        
        if (isInteraction) {
            msg.reply({ embeds: [CreateEmbed(Embed)] });
        } else {
            channel.send({ embeds: [CreateEmbed(Embed)] });
        }
    }
}
