import { CreateEmbed } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'coinflip',
    data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flips a coin!'),
    aliases: ['!9k coinflip', '!9k heads or tails', '!9k heads ortails'],
    execute(interaction, User, Bot) {
        let Res = Math.floor(Math.random() * 2);
        if (Res == 0) { Res = 'Heads' }
        else { Res = 'Tails' }
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = "Heads Or Tails!"
        Embed.Description = `Result: ${Res} 🪙`
        interaction.reply({ embeds: [CreateEmbed(Embed)] });
    }
}
