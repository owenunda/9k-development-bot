// MOVABLE: 9kFun bot - Simple coinflip game
// This command will be moved to a separate 9kFun bot in the future
import { CreateEmbed, SetCoolDown, AlertCoolDown, CheckCoolDown, GetRandomFunCooldown } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'coinflip',
    // MOVABLE: 9kFun bot - This simple game will move to separate bot
    data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flips a coin! (🎮 Fun command - may move to 9kFun bot)'),
    aliases: [],
    botPoints: true,
    execute(interaction, User, Bot) {
        const isInteraction = interaction.commandName !== undefined;
        const userId = isInteraction ? interaction.user.id : interaction.author.id;

        const cooldownkey = `Coinflip-${userId}`;
        if (CheckCoolDown(cooldownkey)) {
            return AlertCoolDown(interaction, cooldownkey, Bot);
        }
        SetCoolDown(interaction, cooldownkey, GetRandomFunCooldown());

        let Res = Math.floor(Math.random() * 2);
        if (Res == 0) { Res = 'Heads' }
        else { Res = 'Tails' }
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = "Heads Or Tails!"
        Embed.Description = `Result: ${Res} 🪙`
        interaction.reply({ embeds: [CreateEmbed(Embed)] });
    }
}
