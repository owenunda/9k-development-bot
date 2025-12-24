import { CreateEmbed, SearchString } from "../../utils/functions.js";
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";

function RobuxTradeRate(interaction, Bot) {
  const Embed = structuredClone(Bot.Embed);
  Embed.Title = "Bot Points To Robux Conversion";
  Embed.Description = `Current conversion rate. ${Bot.Shop.Bank.RobuxTradeRate
    } (1000 Bot Point's = ${1000 * Bot.Shop.Bank.RobuxTradeRate})
The bank currently has ${Bot.Shop.Bank.Robux} Robux available for trade.
`;
  Embed.Thumbnail = false;
  Embed.Image = false;
  interaction.reply({ embeds: [CreateEmbed(Embed)] });
}

function RobuxTrade(interaction, user, Bot) {
  const author = interaction.author || interaction.user;
  const Embed = structuredClone(Bot.Embed);
  Embed.Title = "Trade Bot Cash For Robux?";
  Embed.Description = `**Current Conversion Rate:** ${Bot.Shop.Bank.RobuxTradeRate} Robux per Bot Point

**Bank Status:**
Available Robux: ${Bot.Shop.Bank.Robux}
Max you can trade: ${Math.floor(Bot.Shop.Bank.Robux / Bot.Shop.Bank.RobuxTradeRate)} Bot Points
Minimum trade: ${Math.ceil(10 / Bot.Shop.Bank.RobuxTradeRate)} Bot Points

**Your Balance:** ${user.cash} Bot Points

💡 *Use the buttons below for quick amounts, or type a custom amount*`;

  // INTERACTIVE IMPROVEMENT: Create preset amount buttons
  const presetAmounts = [50, 100, 250, 500, 1000];
  const buttons = [];
  
  presetAmounts.forEach(amount => {
    const canAfford = user.cash >= amount;
    const bankHasRobux = amount * Bot.Shop.Bank.RobuxTradeRate <= Bot.Shop.Bank.Robux;
    const meetsMinimum = amount >= 10 / Bot.Shop.Bank.RobuxTradeRate;
    
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`robux_trade_${amount}`)
        .setLabel(`${amount} Points (${Math.floor(amount * Bot.Shop.Bank.RobuxTradeRate)} Robux)`)
        .setStyle(canAfford && bankHasRobux && meetsMinimum ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(!canAfford || !bankHasRobux || !meetsMinimum)
    );
  });

  // Add custom amount and cancel buttons
  buttons.push(
    new ButtonBuilder()
      .setCustomId('robux_trade_custom')
      .setLabel('💬 Custom Amount')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('robux_trade_cancel')
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Danger)
  );

  const rows = [];
  // Split into rows of 3 buttons each
  for (let i = 0; i < buttons.length; i += 3) {
    const rowButtons = buttons.slice(i, i + 3);
    rows.push(new ActionRowBuilder().addComponents(rowButtons));
  }

  interaction.reply({ embeds: [CreateEmbed(Embed)], components: rows }).then((sent) => {
    // INTERACTIVE IMPROVEMENT: Handle button interactions
    const collector = sent.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
      filter: (i) => i.user.id === author.id
    });

    collector.on('collect', async (buttonInteraction) => {
      const customId = buttonInteraction.customId;
      
      if (customId === 'robux_trade_cancel') {
        const cancelEmbed = structuredClone(Bot.Embed);
        cancelEmbed.Title = "Trade Cancelled";
        cancelEmbed.Description = "Robux trade has been cancelled.";
        await buttonInteraction.update({ embeds: [CreateEmbed(cancelEmbed)], components: [] });
        return;
      }

      if (customId === 'robux_trade_custom') {
        // LEGACY SUPPORT: Fall back to text input for custom amounts
        await buttonInteraction.update({ components: [] });
        return RobuxTradeCustomAmount(interaction, user, Bot);
      }

      if (customId.startsWith('robux_trade_')) {
        const amount = parseInt(customId.split('_')[2]);
        await buttonInteraction.deferUpdate();
        return processRobuxTrade(interaction, user, Bot, amount);
      }
    });

    collector.on('end', () => {
      // Remove buttons after timeout
      sent.edit({ components: [] }).catch(() => {});
    });
  });
}

// INTERACTIVE IMPROVEMENT: Extracted trade processing logic
function processRobuxTrade(interaction, user, Bot, tradeAmount) {
  const author = interaction.author || interaction.user;
  
  if (
    user.cash >= tradeAmount &&
    tradeAmount * Bot.Shop.Bank.RobuxTradeRate <= Bot.Shop.Bank.Robux &&
    tradeAmount >= 10 / Bot.Shop.Bank.RobuxTradeRate
  ) {
    const robuxAmount = Math.floor(tradeAmount * Bot.Shop.Bank.RobuxTradeRate);
    const Embed = structuredClone(Bot.Embed);
    Embed.Title = "✅ Robux Trade Completed!";
    Embed.Description = `**Trade Summary:**
Bot Points Spent: ${tradeAmount}
Robux Received: ${robuxAmount}
New Balance: ${user.cash - tradeAmount} Bot Points

Team 9000 has been notified about your trade. Be sure the account you want the robux on is a member of our roblox group.
https://www.roblox.com/communities/36072783/9kStudiosReborn#!/about`;
    Embed.Thumbnail = false;
    Embed.Image = false;
    
    Bot.WebHooks.Team.send({
      content: `<@${author.id}> Traded Points For Robux
Points Traded: ${tradeAmount}
Robux Requested: ${robuxAmount}
Trade Rate: ${Bot.Shop.Bank.RobuxTradeRate}
Bank Robux After Trade: ${Bot.Shop.Bank.Robux - robuxAmount}`,
      username: "9k Shop",
    })
      .then(() => {
        user.cash += -tradeAmount;
        Bot.Shop.Bank.Robux += -robuxAmount;
        Bot.Shop.Bank.BotCash += tradeAmount;
        interaction.followUp({ embeds: [CreateEmbed(Embed)] });
      })
      .catch(function (e) {
        Embed.Title = "❌ Trade Failed";
        Embed.Description = `Error: *${e}*`;
        interaction.followUp({ embeds: [CreateEmbed(Embed)] });
      });
  } else {
    const Embed = structuredClone(Bot.Embed);
    Embed.Title = "❌ Trade Error";
    Embed.Description = `**Cannot complete trade:**
${user.cash < tradeAmount ? '• Insufficient Bot Points' : ''}
${tradeAmount * Bot.Shop.Bank.RobuxTradeRate > Bot.Shop.Bank.Robux ? '• Bank has insufficient Robux' : ''}
${tradeAmount < 10 / Bot.Shop.Bank.RobuxTradeRate ? '• Below minimum trade amount' : ''}

Please try a different amount.`;
    Embed.Thumbnail = false;
    Embed.Image = false;
    interaction.followUp({ embeds: [CreateEmbed(Embed)] });
  }
}

// LEGACY SUPPORT: Keep original text-based trading for custom amounts
function RobuxTradeCustomAmount(interaction, user, Bot) {
  const author = interaction.author || interaction.user;
  const Embed = structuredClone(Bot.Embed);
  Embed.Title = "Custom Robux Trade Amount";
  Embed.Description = `Enter the amount of Bot Points you want to trade:

**Your Balance:** ${user.cash} Bot Points
**Conversion Rate:** ${Bot.Shop.Bank.RobuxTradeRate} Robux per Point
**Available Robux:** ${Bot.Shop.Bank.Robux}

Type your amount or "cancel" to stop:`;
  
  interaction.followUp({ embeds: [CreateEmbed(Embed)] }).then(() => {
    const msg_filter = (response) => {
      return response.author.id === author.id;
    };
    interaction.channel
      .awaitMessages({ filter: msg_filter, max: 1, time: 60000 })
      .then((collected) => {
        const input = collected.first().content.toLowerCase();
        if (input === 'cancel' || input === '0') {
          const cancelEmbed = structuredClone(Bot.Embed);
          cancelEmbed.Title = "Trade Cancelled";
          cancelEmbed.Description = "Custom trade has been cancelled.";
          return interaction.followUp({ embeds: [CreateEmbed(cancelEmbed)] });
        }
        
        const Trade = Math.floor(collected.first().content);
        if (isNaN(Trade) || Trade <= 0) {
          const errorEmbed = structuredClone(Bot.Embed);
          errorEmbed.Title = "Invalid Amount";
          errorEmbed.Description = "Please enter a valid number greater than 0.";
          return interaction.followUp({ embeds: [CreateEmbed(errorEmbed)] });
        }
        
        processRobuxTrade(interaction, user, Bot, Trade);
      })
      .catch(() => {
        const timeoutEmbed = structuredClone(Bot.Embed);
        timeoutEmbed.Title = "Trade Timeout";
        timeoutEmbed.Description = "Trade request timed out.";
        interaction.followUp({ embeds: [CreateEmbed(timeoutEmbed)] });
      });
  });
}

export default {
  name: "robux",
  // HIERARCHY IMPROVEMENT: Enhanced with clearer subcommand structure
  data: new SlashCommandBuilder()
    .setName("robux")
    .setDescription("Trade bot cash for Robux - supports rate checking and trading")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("rate")
        .setDescription("Check the current Robux conversion rate and bank status")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("trade").setDescription("Trade your bot cash for Robux")
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
  execute(interaction, User, Bot) {
    // Handle slash commands
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const subcommand = interaction.options.getSubcommand();
      if (subcommand === "rate") {
        RobuxTradeRate(interaction, Bot);
      } else if (subcommand === "trade") {
        RobuxTrade(interaction, User, Bot);
      }
      return;
    }

    // BACKWARD COMPATIBILITY: Handle regular text commands (unchanged logic)
    if (
      SearchString(interaction.content, [
        "!9k Robux Rate",
        "!9k Robux Trade Rate",
        "!9k Conversion",
        "!9k Trade",
      ])
    ) {
      RobuxTradeRate(interaction, Bot);
    } else if (
      SearchString(interaction.content, [
        "!9k Trade Robux",
        "!9k Robux Trade",
        "!9k Buy Robux",
      ])
    ) {
      RobuxTrade(interaction, User, Bot);
    }
  },
};
