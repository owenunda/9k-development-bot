import { CreateEmbed } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

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

        const mode = isInteraction
            ? (msg.options.getString('mode') || 'both')
            : getHelpModeFromPrefixMessage(msg);

        const Embed = structuredClone(Bot.Embed);
        Embed.Title = "Bot Commands"

        const prefixHelp = `**!9k Help** - *Helpful info on using our bot!*

Tip: Use **\`/help mode:slash\`** to see slash commands, or **\`!9k help slash\`**.

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

**!9k bj** - *Play some black jack and become the next high roller!*

**!9k Transfer** - *Let's you send some of your cash to another user beware the banking fee's!*

**!9k 9kTube** - *Info about our youtube extension!*

**!9k Coin Flip** - *Flip a coin see the result good for solving dispute's*

**!9k Guess** - *Guess the number im thinking of get it right and win some cash!*

**!9k Invite** - *Get a link to invite 9k to your server it's free!*

**!9k Server List** - *List the server's 9k is in.*
`

        const slashHelp = buildSlashCommandsHelp(Bot);

        if (mode === 'prefix') {
            Embed.Description = `__Prefix Commands__\n\n${prefixHelp}`;
        } else if (mode === 'slash') {
            Embed.Description = `__Slash Commands__\n\n${slashHelp}`;
        } else {
            Embed.Description = `__Prefix Commands__\n\n${prefixHelp}\n\n__Slash Commands__\n\n${slashHelp}`;
        }

        Embed.Thumbnail = false
        Embed.Image = false
        if (isInteraction) {
            await msg.reply({ embeds: [CreateEmbed(Embed)] });
        } else {
            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
    }
}
