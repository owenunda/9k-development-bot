import { CreateEmbed } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

const usedcodes = [];

export default {
    name: 'redeem',
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Redeem a code for cash rewards')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The code to redeem')
                .setRequired(true)),
    aliases: [], // Aliases will be handled by checking against Bot.Codes in index.js or here?
    // The original code checks if msg.content is in Bot.Codes.
    // I should probably export the check logic or handle it in index.js to route here.
    // Or I can make this command handle the logic if routed correctly.
    // For now, I'll assume index.js will route to this if it matches a code.
    execute(msg, User, Bot) {
        let isused = false;
        usedcodes.forEach(function (used) {
            if (used.user == msg.author.id && used.code == msg.content) {
                const Embed = structuredClone(Bot.Embed);
                Embed.Title = "You used this code already.. -.-";
                Embed.Description = `rip`;
                msg.channel.send({ embeds: [CreateEmbed(Embed)] });
                isused = true;
            }
        });
        if (isused) { return }

        const code = msg.content;
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
        usedcodes.push({ user: msg.author.id, code: code });
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = `Code: ${code} Activated`;
        Embed.Description = `heres $${codecash}
New Wallet: ${User.cash}`;
        msg.channel.send({ embeds: [CreateEmbed(Embed)] });
    }
}
