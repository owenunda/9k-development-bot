import { CheckAdmin, SaveBotUsers } from '../../utils/functions.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export default {
    name: 'save',
    data: new SlashCommandBuilder()
        .setName('save')
        .setDescription('Force save bot data (Admin only)'),
    aliases: ['!9k ForceSave'],
    execute(msg, User, Bot) {
        CheckAdmin(msg).then(IsAdmin => {
            console.log(IsAdmin);
            if (IsAdmin == msg.author.id) { }
            else {
                return;
            }
            const reply = new EmbedBuilder()
                .setColor(5793266)
                .setTitle('9k Force Saving!')
                .setDescription("Dont spam this or daddy 9k will get mad.")
                .setThumbnail('https://9000inc.com/Resources/9000INCLogoV2.png');
            SaveBotUsers(Bot);
            console.log('forcesaving');
            msg.channel.send({ embeds: [reply] });
            setTimeout(function () {
                console.log(IsAdmin);
            }, 3000);
        })
    }
}
