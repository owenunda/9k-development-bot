import { CreateEmbed, SearchString } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

function ListColorRoles(msg, Bot) {
    const ColorRoles = [];
    msg.guild.roles.fetch().then(Roles => {
        Roles.forEach(function (Role) {
            if (SearchString(Role.name, ['!9kColor-'])) {
                ColorRoles.push(Role);
            }
        });
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = msg.guild.name + " Color Roles!";
        Embed.Description = ``;
        ColorRoles.forEach(function (Role) {

            Embed.Description += `<@&${Role.id}> `;


        });
        Embed.Description += `
**!9k color @Role to get a color role!**`;
        Embed.Thumbnail = false;
        Embed.Image = false;
        msg.channel.send({ embeds: [CreateEmbed(Embed)] });
    })
}

function GiveColorRole(msg, Bot) {
    let RoleRes = 'Removed:';
    let duplicate = false;
    const Role = msg.mentions.roles.first();
    if (Role) {
        if (SearchString(Role.name, ['!9kColor-'])) {
            msg.member.roles.cache.each(UserRole => {
                if (SearchString(UserRole.name, ['!9kColor-'])) {
                    if (UserRole.name == Role.name) {
                        duplicate = true;
                    }
                    msg.member.roles.remove(UserRole);
                    RoleRes += ' ' + UserRole.name + ',';
                }
            });
            if (duplicate == false) {
                msg.member.roles.add(Role);
            }

            const Embed = structuredClone(Bot.Embed);
            Embed.Title = Role.name + ' Added';
            Embed.Description = RoleRes;
            Embed.Thumbnail = false;
            Embed.Image = false;
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
        else {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Color Role?";
            Embed.Description = 'Please mention a color role to have that role added. `!9k Color Roles` for list of roles.';
            Embed.Thumbnail = false;
            Embed.Image = false;
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
    }
    else {

    }
}

export default {
    name: 'colors',
    data: new SlashCommandBuilder()
        .setName('colors')
        .setDescription('Manage color roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all available color roles'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('assign')
                .setDescription('Assign yourself a color role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The color role to assign')
                        .setRequired(true))),
    aliases: ['!9k Color Roles', '!9k Colors', '!9k List Color', '!9k Color'],
    execute(msg, User, Bot) {
        if (SearchString(msg.content, ['!9k Color Roles', '!9k Colors', '!9k List Color'])) {
            ListColorRoles(msg, Bot);
        } else if (SearchString(msg.content, ['!9k Color'])) {
            GiveColorRole(msg, Bot);
        }
    }
}
