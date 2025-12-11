import { CreateEmbed, SearchString } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

function ListShopItems(msgOrInteraction, Bot) {
    const Embed = structuredClone(Bot.Embed);

    // Get guild name from either message or interaction
    const guildName = msgOrInteraction.guild ? msgOrInteraction.guild.name : 'Server';

    Embed.Title = guildName + " Shop Items!";
    Embed.Description = ``;
    Bot.Shop.Items.forEach(function (Item, ind) {
        let StockRes = Item.LimitedStock;
        if (Item.LimitedStock === false) {
            StockRes = 'Unlimited';
        }
        Embed.Description += `**#${ind + 1} ${Item.Title}** - *${Item.Desc}* **Price:** ${Item.Price} **Stock:** ${StockRes}

`;
    });
    Embed.Thumbnail = false;
    Embed.Image = false;

    // Check if it's an interaction or a message
    if (msgOrInteraction.reply && typeof msgOrInteraction.reply === 'function' && msgOrInteraction.commandName) {
        // It's a slash command interaction
        msgOrInteraction.reply({ embeds: [CreateEmbed(Embed)] });
    } else {
        // It's a regular message
        msgOrInteraction.channel.send({ embeds: [CreateEmbed(Embed)] });
    }
}

function BuyShopItem(msg, user, Bot) {
    console.log('test2');
    let fitem = false;
    const Embed = structuredClone(Bot.Embed);
    Embed.Title = 'Buy Item';
    Embed.Description = `Enter item # to buy that item.`;

    // Determine if it's an interaction or a message
    const isInteraction = msg.commandName !== undefined;
    const userId = isInteraction ? msg.user.id : msg.author.id;
    const channel = msg.channel;

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
                }
            });

            if (fitem) {
                if (fitem.LimitedStock === false) { }
                else {
                    if (fitem.LimitedStock >= 1) {
                        fitem.LimitedStock += -1;
                    }
                    else {
                        const Embed = structuredClone(Bot.Embed);
                        Embed.Title = fitem.Title + " Out of stock.";
                        Embed.Description = 'Maybe we will add more later sowwy.';
                        Embed.Thumbnail = false;
                        Embed.Image = false;
                        channel.send({ embeds: [CreateEmbed(Embed)] });
                        return;
                    }
                }
                if (user.cash >= fitem.Price) {
                    const Embed = structuredClone(Bot.Embed);
                    Embed.Title = `Item Purchased!`;
                    Embed.Description = `${fitem.Title}`;
                    Embed.Thumbnail = false;
                    Embed.Image = false;
                    if (fitem.Role) {
                        //add role
                        try {
                            const role = msg.guild.roles.cache.find(r => r.name === fitem.Role);
                            const member = isInteraction ? msg.member : msg.member;
                            member.roles.add(role).then(() => {
                                user.cash += -fitem.Price;
                                Bot.Shop.Bank.BotCash += fitem.Price;
                                channel.send({ embeds: [CreateEmbed(Embed)] });
                            })
                        }
                        catch (e) {
                            console.log(e);
                            Embed.Title = 'Purchase Failed D:';
                            Embed.Description = `Couldent find the role or somethin..`;
                            channel.send({ embeds: [CreateEmbed(Embed)] });
                        }
                    }
                    else {
                        Bot.WebHooks.Team.send({
                            content: `<@${userId}> Bought ${fitem.Title}`,
                            username: '9k Shop'
                        }).then(() => {
                            user.cash += -fitem.Price;
                            Bot.Shop.Bank.BotCash += fitem.Price;
                            channel.send({ embeds: [CreateEmbed(Embed)] });
                        }).catch(function (e) {
                            Embed.Title = 'Purchase Failed D:';
                            Embed.Description = `Error: *${e}*`;
                            channel.send({ embeds: [CreateEmbed(Embed)] });
                        });


                    }
                }

            }
            else {
                const Embed = structuredClone(Bot.Embed);
                Embed.Title = "Item?";
                Embed.Description = 'Could not find a item with that title rip.';
                Embed.Thumbnail = false;
                Embed.Image = false;
                channel.send({ embeds: [CreateEmbed(Embed)] });
            }

        })
    })


}

export default {
    name: 'shop',
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Shop Items')
        .addSubcommand((subcommand) =>
            subcommand.setName("buy").setDescription("Buy an item from the shop")
        ),
    aliases: ['!9k Buy', '!9k Purchase', '!9k Shop', '!9k List Shop', '!9k items'],
    execute(interaction, User, Bot) {
        // Check if it's a slash command interaction
        if (interaction.commandName) {
            // Slash command
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
            // Text command
            const msg = interaction;
            if (SearchString(msg.content, ['!9k Buy', '!9k Purchase'])) {
                BuyShopItem(msg, User, Bot);
            } else if (SearchString(msg.content, ['!9k Shop', '!9k List Shop', '!9k items'])) {
                ListShopItems(msg, Bot);
            }
        }
    }
}
