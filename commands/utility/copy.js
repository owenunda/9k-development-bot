import { CreateEmbed, CheckServerAdmin } from '../../utils/functions.js';
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import logger from '../../utils/logger.js';
import axios from 'axios';

export default {
    name: 'copy',
    data: new SlashCommandBuilder()
        .setName('copy')
        .setDescription('Copy an emoji to your server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('emoji')
                .setDescription('Copy an emoji from any server')
                .addStringOption(option =>
                    option
                        .setName('emoji')
                        .setDescription('The emoji to copy (animated or static)')
                        .setRequired(true)
                )
        ),
    aliases: [],
    async execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;

        const adminCheckContext = msg.isButton?.()
            ? { commandName: 'copy', user: msg.user, member: msg.member, guild: msg.guild }
            : msg;
        const isAdmin = await CheckServerAdmin(adminCheckContext, Bot);
        if (!isAdmin) {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = 'Permission Denied';
            Embed.Description = 'You do not have permission to use this command.';
            Embed.Thumbnail = false;
            Embed.Image = false;

            if (msg.isButton?.()) {
                if (msg.deferred || msg.replied) {
                    return msg.followUp({ embeds: [CreateEmbed(Embed)], ephemeral: true });
                }
                return msg.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
            }

            if (isInteraction) {
                return msg.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
            }
            return msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
        
        // Check if it's a button interaction
        if (msg.isButton?.()) {
            const customId = msg.customId;
            
            if (customId.startsWith('copy_add_emoji_')) {
                // Parse customId: copy_add_emoji_${emojiId}_${emojiName}_${isAnimated}
                const parts = customId.replace('copy_add_emoji_', '').split('_');
                const emojiId = parts[0];
                const emojiName = parts[1];
                const isAnimated = parts[2] === 'true';
                
                try {
                    await msg.deferReply({ ephemeral: true });
                    
                    // Fetch the original emoji from Discord
                    const extension = isAnimated ? 'gif' : 'png';
                    const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
                    const response = await axios.get(emojiUrl, { responseType: 'arraybuffer' });
                    
                    // Create emoji in the server
                    const guild = msg.guild;
                    const createdEmoji = await guild.emojis.create({
                        attachment: Buffer.from(response.data),
                        name: emojiName.replace(/[^a-zA-Z0-9_]/g, '')
                    });
                    
                    const successEmbed = structuredClone(Bot.Embed);
                    successEmbed.Title = 'Emoji Added!';
                    successEmbed.Description = `${createdEmoji} The **${emojiName}** emoji was added successfully to your server!`;
                    successEmbed.Thumbnail = false;
                    successEmbed.Image = false;
                    
                    await msg.editReply({ embeds: [CreateEmbed(successEmbed)] });
                    logger.info(`Emoji ${emojiName} (${emojiId}) added to guild ${guild.id} by user ${msg.user.id}`);
                    
                } catch (error) {
                    logger.error({ message: 'Error adding emoji to server', error: error.message, stack: error.stack, label: 'CopyCommand' });
                    
                    const errorEmbed = structuredClone(Bot.Embed);
                    errorEmbed.Title = 'Error';
                    errorEmbed.Description = `Failed to add emoji. Make sure the emoji exists and I have permission to manage emojis.`;
                    errorEmbed.Thumbnail = false;
                    errorEmbed.Image = false;
                    
                    await msg.editReply({ embeds: [CreateEmbed(errorEmbed)] });
                }
            }
            return;
        }
        
        // Handle slash command
        if (!isInteraction) return;
        
        try {
            await msg.deferReply();
            
            const emojiInput = msg.options.getString('emoji');
            const emojiRegex = /<a?:(\w+):(\d+)>/;
            const match = emojiInput.match(emojiRegex);
            
            if (!match) {
                const errorEmbed = structuredClone(Bot.Embed);
                errorEmbed.Title = 'Invalid Emoji';
                errorEmbed.Description = 'Please provide a valid Discord emoji in the format: `<:emoji_name:id>` or `<a:emoji_name:id>` for animated emojis.';
                errorEmbed.Thumbnail = false;
                errorEmbed.Image = false;
                
                return msg.editReply({ embeds: [CreateEmbed(errorEmbed)] });
            }
            
            const [, emojiName, emojiId] = match;
            const isAnimated = emojiInput.startsWith('<a:');
            
            // Build emoji URL
            const extension = isAnimated ? 'gif' : 'png';
            const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
            
            // Verify emoji exists by attempting to fetch it
            try {
                await axios.head(emojiUrl);
            } catch (error) {
                const errorEmbed = structuredClone(Bot.Embed);
                errorEmbed.Title = 'Emoji Not Found';
                errorEmbed.Description = 'The emoji you provided could not be found or is no longer available.';
                errorEmbed.Thumbnail = false;
                errorEmbed.Image = false;
                
                return msg.editReply({ embeds: [CreateEmbed(errorEmbed)] });
            }
            
            // Create info embed
            const infoEmbed = structuredClone(Bot.Embed);
            infoEmbed.Title = `Emoji Information`;
            infoEmbed.Description = `Here's the emoji you want to copy:`;
            infoEmbed.Image = emojiUrl;
            
            const embed = CreateEmbed(infoEmbed);
            embed.addFields(
                { name: 'Name', value: emojiName, inline: true },
                { name: 'ID', value: emojiId, inline: true },
                { name: 'Animated', value: isAnimated ? 'Yes' : 'No', inline: true },
                { name: 'Type', value: isAnimated ? 'Animated GIF' : 'Static PNG', inline: true }
            );
            
            // Create button with encoded emoji data
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`copy_add_emoji_${emojiId}_${emojiName}_${isAnimated}`)
                    .setLabel('Add Emoji to Server')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('➕')
            );
            
            await msg.editReply({ 
                embeds: [embed], 
                components: [row] 
            });
            
        } catch (error) {
            logger.error({ message: 'Copy emoji command error', error: error.message, stack: error.stack, label: 'CopyCommand' });
            
            const errorEmbed = structuredClone(Bot.Embed);
            errorEmbed.Title = 'Error';
            errorEmbed.Description = 'An unexpected error occurred while processing your emoji.';
            errorEmbed.Thumbnail = false;
            errorEmbed.Image = false;
            
            await msg.editReply({ embeds: [CreateEmbed(errorEmbed)] });
        }
    }
};
