import { CreateEmbed, SearchString } from '../../utils/functions.js';
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

function ListShopItems(msgOrInteraction, Bot) {
    const Embed = structuredClone(Bot.Embed);

    // Get guild name from either message or interaction
    const guildName = msgOrInteraction.guild ? msgOrInteraction.guild.name : 'Server';

    Embed.Title = guildName + " Shop Items!";
    Embed.Description = `Welcome to the shop! Browse items below and click to purchase:

`;
    
    // INTERACTIVE IMPROVEMENT: Build item list with better formatting
    Bot.Shop.Items.forEach(function (Item, ind) {
        let StockRes = Item.LimitedStock;
        if (Item.LimitedStock === false) {
            StockRes = 'Unlimited';
        }
        Embed.Description += `**${ind + 1}. ${Item.Title}** - ${Item.Price} 💰
*${Item.Desc}*
Stock: ${StockRes}

`;
    });

    Embed.Description += `💡 *Use the buttons below to purchase items, or use text commands for compatibility*`;
    Embed.Thumbnail = false;
    Embed.Image = false;

    // INTERACTIVE IMPROVEMENT: Create purchase buttons for items
    const buttons = [];
    const maxButtonsPerRow = 5;
    const rows = [];
    
    Bot.Shop.Items.forEach(function (Item, ind) {
        if (ind < 20) { // Discord limit of 25 components, keep some space
            const isOutOfStock = Item.LimitedStock !== false && Item.LimitedStock <= 0;
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(`shop_buy_${ind}`)
                    .setLabel(`${ind + 1}. ${Item.Title} (${Item.Price}💰)`)
                    .setStyle(isOutOfStock ? ButtonStyle.Danger : ButtonStyle.Primary)
                    .setDisabled(isOutOfStock)
            );
        }
    });

    // Split buttons into rows of 5
    for (let i = 0; i < buttons.length; i += maxButtonsPerRow) {
        const rowButtons = buttons.slice(i, i + maxButtonsPerRow);
        rows.push(new ActionRowBuilder().addComponents(rowButtons));
    }

    // Check if it's an interaction or a message
    const isInteraction = msgOrInteraction.commandName !== undefined;
    if (isInteraction) {
        // It's a slash command interaction
        msgOrInteraction.reply({ embeds: [CreateEmbed(Embed)], components: rows });
    } else {
        // It's a regular message
        msgOrInteraction.channel.send({ embeds: [CreateEmbed(Embed)], components: rows });
    }
}

function BuyShopItem(msg, user, Bot, itemIndex = null) {
    const isInteraction = msg.commandName !== undefined;
    const userId = isInteraction ? msg.user.id : msg.author.id;
    const channel = msg.channel;

    // INTERACTIVE IMPROVEMENT: If itemIndex provided (from button), buy directly
    if (itemIndex !== null) {
        const Item = Bot.Shop.Items[itemIndex];
        if (!Item) {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = "Item Not Found";
            Embed.Description = 'Could not find that item.';
            Embed.Thumbnail = false;
            Embed.Image = false;
            return channel.send({ embeds: [CreateEmbed(Embed)] });
        }

        return processPurchase(msg, user, Bot, Item, itemIndex);
    }

    // LEGACY SUPPORT: Original text-based item selection
    let fitem = false;
    const Embed = structuredClone(Bot.Embed);
    Embed.Title = 'Buy Item';
    Embed.Description = `Enter item # to buy that item.`;

    const sendMessage = isInteraction
        ? msg.reply({ embeds: [CreateEmbed(Embed)] })
        : channel.send({ embeds: [CreateEmbed(Embed)] });

    sendMessage.then(Sent => {
        const msg_filter = response => { return response.author.id === userId };
        channel.awaitMessages({ filter: msg_filter, max: 1 }).then((collected) => {
            const Trade = Math.floor(collected.first().content);
            Bot.Shop.Items.forEach(function (Item, ind) {
                if (ind + 1 == Trade) {
                    fitem = Item;
                    return processPurchase(msg, user, Bot, Item, ind);
                }
            });

            if (!fitem) {
                const Embed = structuredClone(Bot.Embed);
                Embed.Title = "Item?";
                Embed.Description = 'Could not find a item with that title rip.';
                Embed.Thumbnail = false;
                Embed.Image = false;
                channel.send({ embeds: [CreateEmbed(Embed)] });
            }
        });
    });
}

// INTERACTIVE IMPROVEMENT: Extracted purchase logic for reuse
function processPurchase(msg, user, Bot, Item, itemIndex) {
    const isInteraction = msg.commandName !== undefined;
    const userId = isInteraction ? msg.user.id : msg.author.id;
    const channel = msg.channel;

    // Check stock
    if (Item.LimitedStock !== false) {
        if (Item.LimitedStock >= 1) {
            Item.LimitedStock += -1;
        } else {
            const Embed = structuredClone(Bot.Embed);
            Embed.Title = Item.Title + " Out of stock.";
            Embed.Description = 'Maybe we will add more later sowwy.';
            Embed.Thumbnail = false;
            Embed.Image = false;
            return channel.send({ embeds: [CreateEmbed(Embed)] });
        }
    }

    // Check if user has enough cash
    if (user.cash >= Item.Price) {
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = `✅ Item Purchased!`;
        Embed.Description = `**${Item.Title}**

You spent: ${Item.Price} 💰
New balance: ${user.cash - Item.Price} 💰`;
        Embed.Thumbnail = false;
        Embed.Image = false;

        if (Item.Role) {
            // Add role
            try {
                const role = msg.guild.roles.cache.find(r => r.name === Item.Role);
                const member = isInteraction ? msg.member : msg.member;
                member.roles.add(role).then(() => {
                    user.cash += -Item.Price;
                    Bot.Shop.Bank.BotCash += Item.Price;
                    channel.send({ embeds: [CreateEmbed(Embed)] });
                });
            } catch (e) {
                console.log(e);
                Embed.Title = '❌ Purchase Failed';
                Embed.Description = `Couldn't find the role or something went wrong.`;
                channel.send({ embeds: [CreateEmbed(Embed)] });
            }
        } else {
            Bot.WebHooks.Team.send({
                content: `<@${userId}> Bought ${Item.Title}`,
                username: '9k Shop'
            }).then(() => {
                user.cash += -Item.Price;
                Bot.Shop.Bank.BotCash += Item.Price;
                channel.send({ embeds: [CreateEmbed(Embed)] });
            }).catch(function (e) {
                Embed.Title = '❌ Purchase Failed';
                Embed.Description = `Error: *${e}*`;
                channel.send({ embeds: [CreateEmbed(Embed)] });
            });
        }
    } else {
        const Embed = structuredClone(Bot.Embed);
        Embed.Title = "💸 Insufficient Funds";
        Embed.Description = `You need ${Item.Price} 💰 but only have ${user.cash} 💰

Need ${Item.Price - user.cash} more!`;
        Embed.Thumbnail = false;
        Embed.Image = false;
        channel.send({ embeds: [CreateEmbed(Embed)] });
    }
}

export default {
    name: 'shop',
    // HIERARCHY IMPROVEMENT: Enhanced shop command with explicit subcommands
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Server shop system - view items and make purchases')
        .addSubcommand((subcommand) =>
            subcommand.setName("list").setDescription("View all available shop items")
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("buy").setDescription("Purchase an item from the shop")
        ),
    aliases: ['!9k Buy', '!9k Purchase', '!9k Shop', '!9k List Shop', '!9k items'],
    async execute(interaction, User, Bot) {
        // Check if it's a slash command interaction
        if (interaction.commandName) {
            // HIERARCHY: Route slash subcommands
            let subcommand = null;
            try {
                subcommand = interaction.options.getSubcommand();
            } catch (error) {
                // No subcommand specified, default to list
                subcommand = "list";
            }
            
            if (subcommand === "buy") {
                BuyShopItem(interaction, User, Bot);
            } else {
                // Default to list for both "list" subcommand and base command
                ListShopItems(interaction, Bot);
            }
        } else {
            // BACKWARD COMPATIBILITY: Text command routing (unchanged logic)
            const msg = interaction;
            if (SearchString(msg.content, ['!9k Buy', '!9k Purchase'])) {
                BuyShopItem(msg, User, Bot);
            } else if (SearchString(msg.content, ['!9k Shop', '!9k List Shop', '!9k items'])) {
                ListShopItems(msg, Bot);
            }
        }

        // INTERACTIVE IMPROVEMENT: Handle button interactions
        if (interaction.isButton && interaction.isButton()) {
            const customId = interaction.customId;
            if (customId.startsWith('shop_buy_')) {
                const itemIndex = parseInt(customId.split('_')[2]);
                await interaction.deferReply();
                BuyShopItem(interaction, User, Bot, itemIndex);
            }
        }
    }
}
