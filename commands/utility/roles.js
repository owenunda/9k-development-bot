import { CreateEmbed, SearchString } from '../../utils/functions.js';

function ListChannelRoles(msg, Bot) {
    const ChannelRoles = [];
    msg.guild.roles.fetch().then(Roles => {
        Roles.forEach(function (Role) {
            if (SearchString(Role.name, ['!9kRole-'])) {
                ChannelRoles.push(Role);
            }
        });
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = msg.guild.name + " Channel Roles!";
        Embed.Description = ``;
        ChannelRoles.forEach(function (Role) {

            Embed.Description += `<@&${Role.id}> `;


        });
        Embed.Description += `
**!9k Role @Role to get a channel role!**`;
        Embed.Thumbnail = false;
        Embed.Image = false;
        msg.channel.send({ embeds: [CreateEmbed(Embed)] });
    })
}

function GiveChannelRole(msg, Bot) {
    const Role = msg.mentions.roles.first();
    let RoleRes = ' Added';
    if (Role) {
        if (SearchString(Role.name, ['!9kRole-'])) {
            msg.member.roles.cache.each(UserRole => {
                if (UserRole.name == Role.name) {
                    msg.member.roles.remove(UserRole);
                    RoleRes = ' Removed';
                }
            });
            if (RoleRes == ' Added') {
                msg.member.roles.add(Role);
            }

            const Embed = structuredClone(Bot.Embed);
            Embed.Title = Role.name + RoleRes;
            Embed.Description = ``;
            Embed.Thumbnail = false;
            Embed.Image = false;
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
        else {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Role?";
            Embed.Description = 'Please mention a channel role to have that role added or removed. `!9k Roles` for a list of roles.';
            Embed.Thumbnail = false;
            Embed.Image = false;
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
    }
    else {

    }
}

export default {
    name: 'roles',
    aliases: ['!9k Channel Roles', '!9k Roles', '!9k List Role', '!9k List Channel Role', '!9k Role'],
    execute(msg, User, Bot) {
        if (SearchString(msg.content, ['!9k Channel Roles', '!9k Roles', '!9k List Role', '!9k List Channel Role'])) {
            ListChannelRoles(msg, Bot);
        } else if (SearchString(msg.content, ['!9k Role'])) {
            GiveChannelRole(msg, Bot);
        }
    }
}
