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
    msg.channel.send({ embeds: [CreateEmbed(Embed)] }).then(Sent => {
        const msg_filter = response => { return response.author.id === msg.author.id };
        Sent.channel.awaitMessages({ filter: msg_filter, max: 1 }).then((collected) => {
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
                        msg.channel.send({ embeds: [CreateEmbed(Embed)] });
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
                            msg.member.roles.add(role).then(() => {
                                user.cash += -fitem.Price;
                                Bot.Shop.Bank.BotCash += fitem.Price;
                                msg.channel.send({ embeds: [CreateEmbed(Embed)] });
                            })
                        }
                        catch (e) {
                            console.log(e);
                            Embed.Title = 'Purchase Failed D:';
                            Embed.Description = `Couldent find the role or somethin..`;
                            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
                        }
                    }
                    else {
                        Bot.WebHooks.Team.send({
                            content: `<@${msg.author.id}> Bought ${fitem.Title}`,
                            username: '9k Shop'
                        }).then(() => {
                            user.cash += -fitem.Price;
                            Bot.Shop.Bank.BotCash += fitem.Price;
                            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
                        }).catch(function (e) {
                            Embed.Title = 'Purchase Failed D:';
                            Embed.Description = `Error: *${e}*`;
                            msg.channel.send({ embeds: [CreateEmbed(Embed)] });
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
                msg.channel.send({ embeds: [CreateEmbed(Embed)] });
            }

        })
    })


}

export default {
    name: 'shop',
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Shop Items'),
    aliases: ['!9k Buy', '!9k Purchase', '!9k Shop', '!9k List Shop', '!9k items'],
    execute(msgOrInteraction, User, Bot) {
        // Check if it's a slash command interaction
        if (msgOrInteraction.commandName) {
            // Slash command - show the shop
            ListShopItems(msgOrInteraction, Bot);
        } else {
            // Text command
            const msg = msgOrInteraction;
            if (SearchString(msg.content, ['!9k Buy', '!9k Purchase'])) {
                BuyShopItem(msg, User, Bot);
            } else if (SearchString(msg.content, ['!9k Shop', '!9k List Shop', '!9k items'])) {
                ListShopItems(msg, Bot);
            }
        }
    }
}
