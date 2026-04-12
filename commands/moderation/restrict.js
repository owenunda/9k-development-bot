import { SlashCommandBuilder } from 'discord.js';
import { SetRestricted, CheckAdmin, CreateEmbed } from '../../utils/functions.js';
import logger from '../../utils/logger.js';

export default {
    name: 'restrict',
    data: new SlashCommandBuilder()
        .setName('restrict')
        .setDescription('Restrict or unrestrict a user globally (Team Only)')
        .addUserOption(option => option.setName('user').setDescription('The user to restrict').setRequired(true))
        .addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes (0 to unrestrict)').setRequired(true)),
    
    async execute(msg, User, Bot) {
        const isAdmin = await CheckAdmin(msg);
        if (!isAdmin) {
            const embed = CreateEmbed({
                title: 'Permission Denied',
                description: '❌ You do not have permission to use this command.',
                color: 0xFF0000
            });
            return msg.reply({ embeds: [embed], ephemeral: true });
        }

        const isInteraction = msg.commandName !== undefined;
        const targetUser = isInteraction ? msg.options.getUser('user') : msg.mentions.users.first();
        const duration = isInteraction ? msg.options.getInteger('duration') : parseInt(msg.content.split(/\s+/)[2]);

        if (!targetUser) {
            return msg.reply('Please specify a user.');
        }

        if (duration === undefined || isNaN(duration)) {
            return msg.reply('Please specify a valid duration in minutes (0 to unrestrict).');
        }

        if (duration <= 0) {
            SetRestricted(targetUser.id, duration, Bot); // My updated logic will handle this
            return msg.reply(`**${targetUser.username}** has been unrestricted.`);
        }

        SetRestricted(targetUser.id, duration, Bot);
        logger.info(`User ${targetUser.id} restricted globally for ${duration} mins by ${isInteraction ? msg.user.id : msg.author.id}`);
        
        return msg.reply(`**${targetUser.username}** has been restricted globally for **${duration}** minutes.`);
    }
};

