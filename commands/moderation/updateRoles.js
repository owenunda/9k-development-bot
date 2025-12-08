import { CreateEmbed, CheckAdmin, delay } from '../../utils/functions.js';

export default {
    name: 'updateRoles',
    aliases: ['!9k Update Member Roles'],
    execute(msg, User, Bot) {
        CheckAdmin(msg).then(IsAdmin => {
            if (IsAdmin == msg.author.id) { }
            else {
                return;
            }

            let addedCount = 0;
            const role = msg.guild.roles.cache.find(r => r.name === 'Memeber');
            msg.guild.members.fetch().then(Members => {
                if (!role) {
                    return;
                }

                Members.forEach(async function (member) {
                    if (!member.user.bot && !member.roles.cache.has(role.id)) {
                        try {
                            await member.roles.add(role);
                            addedCount++;
                            console.log(`✅ Added role to ${member.user.tag}`);
                        } catch (err) {
                            console.error(`❌ Failed to add role to ${member.user.tag}: ${err.message}`);
                        }

                        // Wait 1.5 seconds before the next request
                        await delay(9000);
                    }

                })
            })
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Memeber Roles Updated";
            Embed.Description = `Added Role To ${addedCount} Members`;
            Embed.Thumbnail = false;
            Embed.Image = false;
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        })
    }
}
