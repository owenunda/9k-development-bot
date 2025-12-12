import { CreateEmbed, SearchString } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

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

        const isInteraction = msg.commandName !== undefined;
        if (isInteraction) {
            if (msg.deferred || msg.replied) return msg.editReply({ embeds: [CreateEmbed(Embed)] });
            return msg.reply({ embeds: [CreateEmbed(Embed)] });
        }
        return msg.channel.send({ embeds: [CreateEmbed(Embed)] });
    })
}

function GiveChannelRole(msg, Bot, roleFromSlash) {
    const isInteraction = msg.commandName !== undefined;
    const Role = roleFromSlash || msg.mentions.roles.first();
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
            if (isInteraction) {
                if (msg.deferred || msg.replied) return msg.editReply({ embeds: [CreateEmbed(Embed)] });
                return msg.reply({ embeds: [CreateEmbed(Embed)] });
            }
            return msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
        else {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Role?";
            Embed.Description = isInteraction
                ? 'That role is not a channel role. This command only works with roles that start with `!9kRole-`. Use `/roles list` to see valid roles, then run `/roles toggle` again.'
                : 'Please mention a channel role to have that role added or removed. `!9k Roles` for a list of roles.';
            Embed.Thumbnail = false;
            Embed.Image = false;
            if (isInteraction) {
                if (msg.deferred || msg.replied) return msg.editReply({ embeds: [CreateEmbed(Embed)] });
                return msg.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
            }
            return msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
    }
    else {

    }
}

export default {
    name: 'roles',
    data: new SlashCommandBuilder()
        .setName('roles')
        .setDescription('Manage channel roles')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all available channel roles'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('Toggle a channel role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The channel role to toggle')
                        .setRequired(true))),
    aliases: ['!9k Channel Roles', '!9k Roles', '!9k List Role', '!9k List Channel Role', '!9k Role'],
    async execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        if (isInteraction) {
            await msg.deferReply();
            const sub = msg.options.getSubcommand();
            if (sub === 'list') {
                return ListChannelRoles(msg, Bot);
            }
            if (sub === 'toggle') {
                const role = msg.options.getRole('role');
                return GiveChannelRole(msg, Bot, role);
            }
            return;
        }

        if (SearchString(msg.content, ['!9k Channel Roles', '!9k Roles', '!9k List Role', '!9k List Channel Role'])) {
            ListChannelRoles(msg, Bot);
        } else if (SearchString(msg.content, ['!9k Role'])) {
            GiveChannelRole(msg, Bot);
        }
    }
}
