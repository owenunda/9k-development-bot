import { CreateEmbed, GetUserDailyData, SaveUserDaily } from '../../utils/functions.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    name: 'daily',
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily reward and maintain your streak!'),
    aliases: ['!9k Daily'],
    async execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        const userId = isInteraction ? msg.user.id : msg.author.id;
        const channel = msg.channel;

        try {
            // Get daily data from database
            const dailyData = await GetUserDailyData(userId, Bot);
            
            if (!dailyData) {
                throw new Error('Could not retrieve daily data from database');
            }

            const now = new Date();
            const lastClaim = dailyData.last_daily_claim ? new Date(dailyData.last_daily_claim) : null;
            
            let currentStreak = dailyData.daily_streak || 0;
            
            const Embed = structuredClone(Bot.Embed);
            
            // First time claiming
            if (!lastClaim) {
                currentStreak = 1;
                User.cash += 10;
                
                Embed.Color = 5763719; // Green
                Embed.Title = '🎁 Daily Reward Claimed!';
                Embed.Description = `Welcome to the daily rewards system!\\n\\n💰 **Cash Earned:** +10\\n🔥 **Current Streak:** ${currentStreak} day${currentStreak > 1 ? 's' : ''}\\n💵 **New Balance:** ${User.cash}\\n\\n*Come back in 24 hours to continue your streak!*`;
                
                SaveUserDaily(User, { streak: currentStreak }, Bot);
                
                if (isInteraction) {
                    await msg.reply({ embeds: [CreateEmbed(Embed)] });
                } else {
                    channel.send({ embeds: [CreateEmbed(Embed)] });
                }
                return;
            }
            
            // Calculate time difference in hours
            const timeDiff = (now - lastClaim) / (1000 * 60 * 60); // Convert to hours
            
            // Less than 24 hours - show cooldown
            if (timeDiff < 24) {
                const hoursLeft = Math.floor(24 - timeDiff);
                const minutesLeft = Math.floor((24 - timeDiff - hoursLeft) * 60);
                
                Embed.Color = 15548997; // Red
                Embed.Title = '⏰ Daily Reward on Cooldown';
                Embed.Description = `You've already claimed your daily reward!\\n\\n⏳ **Time Remaining:** ${hoursLeft}h ${minutesLeft}m\\n🔥 **Current Streak:** ${currentStreak} day${currentStreak > 1 ? 's' : ''}\\n\\n*Come back later to claim your next reward!*`;
                
                if (isInteraction) {
                    await msg.reply({ embeds: [CreateEmbed(Embed)], ephemeral: true });
                } else {
                    channel.send({ embeds: [CreateEmbed(Embed)] });
                }
                return;
            }
            
            // Between 24h and 48h - continue streak
            if (timeDiff >= 24 && timeDiff < 48) {
                currentStreak += 1;
                User.cash += 10;
                
                Embed.Color = 5763719; // Green
                Embed.Title = '🎁 Daily Reward Claimed!';
                Embed.Description = `Great job keeping your streak alive!\\n\\n💰 **Cash Earned:** +10\\n🔥 **Current Streak:** ${currentStreak} day${currentStreak > 1 ? 's' : ''}\\n💵 **New Balance:** ${User.cash}\\n\\n*Keep it up! Come back tomorrow!*`;
                
                SaveUserDaily(User, { streak: currentStreak }, Bot);
                
                if (isInteraction) {
                    await msg.reply({ embeds: [CreateEmbed(Embed)] });
                } else {
                    channel.send({ embeds: [CreateEmbed(Embed)] });
                }
                return;
            }
            
            // More than 48h - reset streak
            if (timeDiff >= 48) {
                currentStreak = 1;
                User.cash += 10;
                
                Embed.Color = 15844367; // Yellow/Orange
                Embed.Title = '🎁 Daily Reward Claimed';
                Embed.Description = `Your streak was reset, but you still got your reward!\\n\\n💰 **Cash Earned:** +10\\n🔥 **Current Streak:** ${currentStreak} day (Reset)\\n💵 **New Balance:** ${User.cash}\\n\\n*Try to claim daily to build a longer streak!*`;
                
                SaveUserDaily(User, { streak: currentStreak }, Bot);
                
                if (isInteraction) {
                    await msg.reply({ embeds: [CreateEmbed(Embed)] });
                } else {
                    channel.send({ embeds: [CreateEmbed(Embed)] });
                }
                return;
            }
            
        } catch (error) {
            console.error('Daily command error:', error);
            
            const ErrorEmbed = structuredClone(Bot.Embed);
            ErrorEmbed.Color = 15548997; // Red
            ErrorEmbed.Title = '❌ Error';
            ErrorEmbed.Description = 'There was an error processing your daily reward. Please try again later.';
            
            if (isInteraction) {
                await msg.reply({ embeds: [CreateEmbed(ErrorEmbed)], ephemeral: true });
            } else {
                channel.send({ embeds: [CreateEmbed(ErrorEmbed)] });
            }
        }
    }
}
