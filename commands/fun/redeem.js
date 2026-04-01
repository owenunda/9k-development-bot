// MOVABLE: 9kFun bot - Code redemption system
// This command will be moved to a separate 9kFun bot in the future
import { CreateEmbed, SetCoolDown, AlertCoolDown, CheckCoolDown, GetRandomFunCooldown, GetRedeemCode, CheckCodeUsed, MarkCodeUsed, SaveUser } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

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
    async execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        const userId = isInteraction ? msg.user.id : msg.author.id;
        const channel = msg.channel;
        
        const cooldownkey = `Redeem-${userId}`;
        if (CheckCoolDown(cooldownkey)) {
            return AlertCoolDown(msg, cooldownkey, Bot);
        }
        SetCoolDown(msg, cooldownkey, GetRandomFunCooldown());

        // Get the code based on command type
        let code;
        if (isInteraction) {
            // Slash command - get code from option
            const codeInput = msg.options.getString('code').trim();
            // If the user manually wrote "!9k " inside the slash command, do not duplicate it
            if (codeInput.toLowerCase().startsWith('!9k ')) {
                code = codeInput;
            } else {
                code = '!9k ' + codeInput;
            }
        } else {
            // Text command - use full message content
            code = msg.content.trim();
        }

        // Just in case there are multiple spaces or casing differences, code should strictly match what is in DB
        // But since we store exact codes like '!9k Lazyyy', we'll rely on MySQL case-insensitivity on VARCHAR by default.
        
        // Lookup the code in DB
        const dbCode = await GetRedeemCode(code, Bot);
        if (!dbCode) {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Invalid Code";
            Embed.Description = "That code does not exist or is no longer active.";
            
            if (isInteraction) {
                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            } else {
                return channel.send({ embeds: [CreateEmbed(Embed)] });
            }
        }
        
        // Check if user already used it
        const isused = await CheckCodeUsed(userId, dbCode.id, Bot);
        if (isused) {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "You used this code already.. -.-";
            Embed.Description = `rip`;
            
            if (isInteraction) {
                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            } else {
                return channel.send({ embeds: [CreateEmbed(Embed)] });
            }
        }

        const codecash = dbCode.cash_value;
        User.cash += codecash;
        
        // Mark used & Save
        await MarkCodeUsed(userId, dbCode.id, Bot);
        SaveUser(User, Bot);

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
