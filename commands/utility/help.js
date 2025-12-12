import { CreateEmbed } from '../../utils/functions.js';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    SlashCommandBuilder,
} from 'discord.js';

function getHelpModeFromPrefixMessage(msg) {
    const text = (msg.content || '').toLowerCase();
    if (text.includes(' slash')) return 'slash';
    if (text.includes(' prefix')) return 'prefix';
    if (text.includes(' both')) return 'both';
    return 'both';
}

function buildSlashCommandsHelp(Bot) {
    const lines = [];

    Bot.Commands.forEach((cmd) => {
        if (!cmd || !cmd.data || cmd.data === false) return;
        if (typeof cmd.data.toJSON !== 'function') return;

        const json = cmd.data.toJSON();
        const name = json?.name;
        const desc = json?.description || '';

        if (!name) return;

        const subcommands = Array.isArray(json.options)
            ? json.options
                .filter(o => o && o.type === 1 && o.name)
                .map(o => o.name)
            : [];

        let line = `**/${name}** - *${desc}*`;
        if (subcommands.length) {
            line += `\n↳ sub: ${subcommands.map(s => `\`/${name} ${s}\``).join(', ')}`;
        }
        lines.push(line);
    });

    if (!lines.length) return 'No slash commands found.';
    return lines.join('\n\n');
}

function buildHelpEmbed(mode, Bot) {
    const Embed = structuredClone(Bot.Embed);
    Embed.Title = "Bot Commands";

    const prefixHelp = `**!9k Help** - *Helpful info on using our bot!*

Tip: Use the buttons below to switch views.

**!9k Messages (All, Year, Month, Week, Day, Hour) #Channel** - *List server message's within time ranges and a specific channel if added "!9k Messages Week #Chat" shows messages for the last 7 days in the channel named Chat.*

**!9k List Colors** - *List all color role's in the server.*

**!9k Color @ColorRole** - *Give's you that color role and removes any other's!*

**!9k Role @Role** - *Give's you that role!*

**!9k Channel Roles** - *List all channel / extra role's in the server!*

**!9k Shop** - *List the bot's shop item's*

**!9k Buy** - *Buy's item from the shop (send command then send the item's # to purchase)*

**!9k Robux Rate** - *Gives info about current robux trading rate's.*

**!9k Buy Robux** - *Allows you to trade bot point's/cash for robux woah!*

**!9k Emote** - *Create's a message you can react on to get emoji info.*

**!9k Work** - *Random Event / Work Job.*

**!9k User** - *Get's user info your's unless you add a user mention!*

**!9k Slots** - *A slot game you can play to win and lose money!*

**!9k bj** - *Play some black jack and become the next high roller!*\n
**!9k Transfer** - *Let's you send some of your cash to another user beware the banking fee's!*\n
**!9k 9kTube** - *Info about our youtube extension!*\n
**!9k Coin Flip** - *Flip a coin see the result good for solving dispute's*\n
**!9k Guess** - *Guess the number im thinking of get it right and win some cash!*\n
**!9k Invite** - *Get a link to invite 9k to your server it's free!*\n
**!9k Server List** - *List the server's 9k is in.*
`;

    const slashHelp = buildSlashCommandsHelp(Bot);

    if (mode === 'prefix') {
        Embed.Description = `__Prefix Commands__\n\n${prefixHelp}`;
    } else if (mode === 'slash') {
        Embed.Description = `__Slash Commands__\n\n${slashHelp}`;
    } else {
        Embed.Description = `__Prefix Commands__\n\n${prefixHelp}\n\n__Slash Commands__\n\n${slashHelp}`;
    }

    Embed.Thumbnail = false;
    Embed.Image = false;
    return Embed;
}

function buildHelpComponents(activeMode) {
    const prefixBtn = new ButtonBuilder()
        .setCustomId('help:prefix')
        .setLabel('Prefix Commands')
        .setStyle(activeMode === 'prefix' ? ButtonStyle.Primary : ButtonStyle.Secondary);

    const bothBtn = new ButtonBuilder()
        .setCustomId('help:both')
        .setLabel('Both')
        .setStyle(activeMode === 'both' ? ButtonStyle.Primary : ButtonStyle.Secondary);

    const slashBtn = new ButtonBuilder()
        .setCustomId('help:slash')
        .setLabel('Slash Commands')
        .setStyle(activeMode === 'slash' ? ButtonStyle.Primary : ButtonStyle.Secondary);

    return [new ActionRowBuilder().addComponents(prefixBtn, bothBtn, slashBtn)];
}

export default {
    name: 'help',
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display all available bot commands and information')
        .addStringOption(option =>
            option
                .setName('mode')
                .setDescription('Which commands to show')
                .setRequired(false)
                .addChoices(
                    { name: 'Both (default)', value: 'both' },
                    { name: 'Prefix (!9k)', value: 'prefix' },
                    { name: 'Slash (/)', value: 'slash' },
                )),
    aliases: ['!9k Help', '!9k Info', '!9k Commands', '!9k Cmds', '!9k'],
    async execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;

        let mode = isInteraction
            ? (msg.options.getString('mode') || 'both')
            : getHelpModeFromPrefixMessage(msg);

        const ownerId = isInteraction ? msg.user.id : msg.author.id;

        const payload = {
            embeds: [CreateEmbed(buildHelpEmbed(mode, Bot))],
            components: buildHelpComponents(mode),
        };

        const sent = isInteraction
            ? await msg.reply({ ...payload, fetchReply: true })
            : await msg.channel.send(payload);

        const collector = sent.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 120_000,
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== ownerId) {
                return i.reply({ content: 'This help menu is not for you.', ephemeral: true });
            }

            if (i.customId === 'help:prefix') mode = 'prefix';
            else if (i.customId === 'help:slash') mode = 'slash';
            else if (i.customId === 'help:both') mode = 'both';

            const nextPayload = {
                embeds: [CreateEmbed(buildHelpEmbed(mode, Bot))],
                components: buildHelpComponents(mode),
            };

            await i.update(nextPayload);
        });

        collector.on('end', async () => {
            try {
                await sent.edit({ components: [] });
            } catch {
                // ignore
            }
        });
    }
}
