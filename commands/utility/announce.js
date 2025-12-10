import { CreateEmbed } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'announce',
    data: new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Make an announcement in a specified channel')
        .addChannelOption(option => option.setName('channel').setDescription('Channel to announce in').setRequired(true))
        .addStringOption(option => option.setName('message').setDescription('Announcement message').setRequired(true)),
    async execute(interaction, User, Bot) {
        // Handle both interaction and legacy message if needed, though this is primarily a slash command
        if (!interaction.isChatInputCommand || !interaction.isChatInputCommand()) return;

        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');

        if (!interaction.member.permissions.has('SendMessages')) {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Permission Denied";
            Embed.Description = "You do not have permission to send messages.";
            Embed.Thumbnail = false;
            Embed.Image = false;
            return interaction.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
        }

        try {
            await channel.send(message);
            
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Announcement Sent";
            Embed.Description = `Message sent to ${channel.toString()}`;
            Embed.Thumbnail = false;
            Embed.Image = false;
            
            return interaction.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
        } catch (error) {
            console.error(error);
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Error";
            Embed.Description = "Failed to send announcement. Please check my permissions.";
            Embed.Thumbnail = false;
            Embed.Image = false;
            return interaction.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
        }
    }
}