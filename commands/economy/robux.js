import { CreateEmbed, SearchString } from "../../utils/functions.js";
import { SlashCommandBuilder } from "discord.js";

function RobuxTradeRate(msg, Bot) {
  const Embed = structuredClone(Bot.Embed);
  Embed.Title = "Bot Points To Robux Conversion";
  Embed.Description = `Current conversion rate. ${
    Bot.Shop.Bank.RobuxTradeRate
  } (1000 Bot Point's = ${1000 * Bot.Shop.Bank.RobuxTradeRate})
The bank currently has ${Bot.Shop.Bank.Robux} Robux available for trade.
`;
  Embed.Thumbnail = false;
  Embed.Image = false;
  msg.channel.send({ embeds: [CreateEmbed(Embed)] });
}

function RobuxTrade(msg, user, Bot) {
  const author = msg.author || msg.user;
  const Embed = structuredClone(Bot.Embed);
  Embed.Title = "Trade Bot Cash For Robux?";
  Embed.Description = `Enter a amount of cash to trade! Conversion Rate: ${
    Bot.Shop.Bank.RobuxTradeRate
  }
The bank has ${Bot.Shop.Bank.Robux} Robux to trade (you can trade ${
    Bot.Shop.Bank.Robux / Bot.Shop.Bank.RobuxTradeRate
  } bot point's and must trade at least ${10 / Bot.Shop.Bank.RobuxTradeRate})
if you dont want to trade right now just enter 0 to cancel.`;
  msg.channel.send({ embeds: [CreateEmbed(Embed)] }).then((Sent) => {
    const msg_filter = (response) => {
      return response.author.id === author.id;
    };
    Sent.channel
      .awaitMessages({ filter: msg_filter, max: 1 })
      .then((collected) => {
        const Trade = Math.floor(collected.first().content);
        if (
          user.cash >= Trade &&
          Trade * Bot.Shop.Bank.RobuxTradeRate <= Bot.Shop.Bank.Robux &&
          Trade >= 10 / Bot.Shop.Bank.RobuxTradeRate
        ) {
          const Embed = structuredClone(Bot.Embed);
          Embed.Title = "Robux Traded!";
          Embed.Description = `Team 9000 has been notified about your trade. Be sure the account you want the robux on is a member of our roblox group with large trade's you may also take roblox gift cards as payment.
https://www.roblox.com/communities/36072783/9kStudiosReborn#!/about`;
          Embed.Thumbnail = false;
          Embed.Image = false;
          Bot.WebHooks.Team.send({
            content: `<@${author.id}> Traded Points For Robux
Points Traded: ${Trade}
Robux Requested: ${Trade * Bot.Shop.Bank.RobuxTradeRate}
Trade Rate: ${Bot.Shop.Bank.RobuxTradeRate}
Bank Robux After Trade: ${
              Bot.Shop.Bank.Robux - Trade * Bot.Shop.Bank.RobuxTradeRate
            }
`,
            username: "9k Shop",
          })
            .then(() => {
              user.cash += -Trade;
              Bot.Shop.Bank.Robux += -(Trade * Bot.Shop.Bank.RobuxTradeRate);
              Bot.Shop.Bank.BotCash += Trade;
              msg.channel.send({ embeds: [CreateEmbed(Embed)] });
            })
            .catch(function (e) {
              Embed.Title = "Trade Failed D:";
              Embed.Description = `Error: *${e}*`;
              msg.channel.send({ embeds: [CreateEmbed(Embed)] });
            });
        } else {
          const Embed = structuredClone(Bot.Embed);
          Embed.Title = "Error Trading.";
          Embed.Description = `Make sure you have enough bot point's/cash and the bank has enough robux to trade.
`;
          Embed.Thumbnail = false;
          Embed.Image = false;
          msg.channel.send({ embeds: [CreateEmbed(Embed)] });
        }
      });
  });
}

export default {
  name: "robux",
  data: new SlashCommandBuilder()
    .setName("robux")
    .setDescription("Trade bot cash for Robux")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rate")
        .setDescription("Check the current Robux conversion rate")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("trade").setDescription("Trade bot cash for Robux")
    ),
  aliases: [
    "!9k Robux Rate",
    "!9k Robux Trade Rate",
    "!9k Conversion",
    "!9k Trade",
    "!9k Trade Robux",
    "!9k Robux Trade",
    "!9k Buy Robux",
  ],
  execute(msg, User, Bot) {
    // Handle slash commands
    if (msg.isChatInputCommand && msg.isChatInputCommand()) {
      const subcommand = msg.options.getSubcommand();
      if (subcommand === "rate") {
        RobuxTradeRate(msg, Bot);
      } else if (subcommand === "trade") {
        RobuxTrade(msg, User, Bot);
      }
      return;
    }

    // Handle regular text commands
    if (
      SearchString(msg.content, [
        "!9k Robux Rate",
        "!9k Robux Trade Rate",
        "!9k Conversion",
        "!9k Trade",
      ])
    ) {
      RobuxTradeRate(msg, Bot);
    } else if (
      SearchString(msg.content, [
        "!9k Trade Robux",
        "!9k Robux Trade",
        "!9k Buy Robux",
      ])
    ) {
      RobuxTrade(msg, User, Bot);
    }
  },
};
