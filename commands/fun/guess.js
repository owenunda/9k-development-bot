// MOVABLE: 9kFun bot - Number guessing game
// This command will be moved to a separate 9kFun bot in the future
import { CreateEmbed, SetCoolDown, AlertCoolDown, CheckCoolDown, GetRandomFunCooldown } from '../../utils/functions.js';
import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
import fs from 'fs';
import path from 'path';

const CATEGORY_LABELS = {
    animals: 'Animal',
    places: 'Place',
    objects: 'Objects',
    number: 'Number'
};

const DIFFICULTY_CONFIG = {
    Easy: { attempts: 5, hintLimit: 3, reward: 20 },
    Medium: { attempts: 4, hintLimit: 2, reward: 45 },
    Hard: { attempts: 3, hintLimit: 1, reward: 90 }
};

const NUMBER_RANGE_CONFIG = {
    Easy: 10,
    Medium: 25,
    Hard: 100
};

const ACTIVE_GUESS_USERS = new Set();

function disableRow(row) {
    return new ActionRowBuilder().addComponents(
        row.components.map(component => ButtonBuilder.from(component).setDisabled(true))
    );
}

function loadGuessWords() {
    const animalsPath = path.resolve('data/guess-animals.json');
    const placesPath = path.resolve('data/guess-places.json');
    const objectsPath = path.resolve('data/guess-objects.json');

    const animals = JSON.parse(fs.readFileSync(animalsPath, 'utf8'));
    const places = JSON.parse(fs.readFileSync(placesPath, 'utf8'));
    const objects = JSON.parse(fs.readFileSync(objectsPath, 'utf8'));

    return {
        animals,
        places,
        objects
    };
}

export default {
    name: 'guess',
    // MOVABLE: 9kFun bot - This guessing game will move to separate bot
    data: new SlashCommandBuilder()
        .setName('guess')
        .setDescription('Guess What game with categories, difficulty, and hints (🎮 Fun command - may move to 9kFun bot)'),
    aliases: [],
    execute(msg, User, Bot) {
        const isInteraction = msg.commandName !== undefined;
        const userId = isInteraction ? msg.user.id : msg.author.id;
        const channel = msg.channel;

        if (ACTIVE_GUESS_USERS.has(userId)) {
            const activeEmbed = structuredClone(Bot.Embed);
            activeEmbed.Title = 'Guess What';
            activeEmbed.Description = 'You already have an active guess game. Finish it before starting another one.';
            const payload = { embeds: [CreateEmbed(activeEmbed)] };
            if (isInteraction) {
                return msg.reply(payload);
            }
            return channel.send(payload);
        }

        const cooldownkey = `Guess-${userId}`;
        if (CheckCoolDown(cooldownkey)) {
            return AlertCoolDown(msg, cooldownkey, Bot);
        }
        SetCoolDown(msg, cooldownkey, GetRandomFunCooldown());

        let guessWords = null;
        try {
            guessWords = loadGuessWords();
        } catch (error) {
            const errorEmbed = structuredClone(Bot.Embed);
            errorEmbed.Title = 'Guess What';
            errorEmbed.Description = 'Could not load guess data. Please try again later.';
            const payload = { embeds: [CreateEmbed(errorEmbed)] };
            if (isInteraction) {
                return msg.reply(payload);
            }
            return channel.send(payload);
        }

        const Embed = structuredClone(Bot.Embed);
        Embed.Title = 'Guess What';
        Embed.Description = `Choose an area to guess from:\n\n• Animal\n• Place\n• Objects\n• Number`;

        const categoryRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('cat_animals')
                .setLabel('Animal')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('cat_places')
                .setLabel('Place')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('cat_objects')
                .setLabel('Objects')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cat_number')
                .setLabel('Number')
                .setStyle(ButtonStyle.Secondary),
        );

        const sendMessage = isInteraction 
            ? msg.reply({ embeds: [CreateEmbed(Embed)], components: [categoryRow], fetchReply: true })
            : channel.send({ embeds: [CreateEmbed(Embed)], components: [categoryRow] });

        ACTIVE_GUESS_USERS.add(userId);

        sendMessage.then(async Sent => {
            let difficultyRow = null;
            let selectedCategory = null;

            const interactionFilter = i => i.user.id === userId;
            const categoryFilter = i => interactionFilter(i) && i.customId.startsWith('cat_');
            const difficultyFilter = i => interactionFilter(i) && i.customId.startsWith('dif_');

            try {
                const categorySelection = await Sent.awaitMessageComponent({
                    filter: categoryFilter,
                    componentType: ComponentType.Button,
                    time: 30000
                });

                selectedCategory = categorySelection.customId.replace('cat_', '');
                const isNumberCategory = selectedCategory === 'number';
                const categoryPool = guessWords[selectedCategory];

                if (!isNumberCategory && (!Array.isArray(categoryPool) || categoryPool.length === 0)) {
                    const noDataEmbed = structuredClone(Bot.Embed);
                    noDataEmbed.Title = 'Guess What';
                    noDataEmbed.Description = 'No words available for this category yet.';
                    await categorySelection.update({ embeds: [CreateEmbed(noDataEmbed)], components: [disableRow(categoryRow)] });
                    ACTIVE_GUESS_USERS.delete(userId);
                    return;
                }

                difficultyRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('dif_Easy')
                        .setLabel('Easy')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('dif_Medium')
                        .setLabel('Medium')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('dif_Hard')
                        .setLabel('Hard')
                        .setStyle(ButtonStyle.Danger)
                );

                const categoryEmbed = structuredClone(Bot.Embed);
                categoryEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory] || 'Category'}`;
                categoryEmbed.Description = 'Now choose your difficulty.';

                await categorySelection.update({
                    embeds: [CreateEmbed(categoryEmbed)],
                    components: [disableRow(categoryRow), difficultyRow]
                });

                const difficultySelection = await Sent.awaitMessageComponent({
                    filter: difficultyFilter,
                    componentType: ComponentType.Button,
                    time: 30000
                });

                const difficulty = difficultySelection.customId.replace('dif_', '');
                const difficultyConfig = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG.Easy;

                if (isNumberCategory) {
                    const maxNumber = NUMBER_RANGE_CONFIG[difficulty] || NUMBER_RANGE_CONFIG.Easy;
                    const targetNumber = Math.floor(Math.random() * maxNumber) + 1;
                    let attemptsLeft = difficultyConfig.attempts;

                    const gameStartEmbed = structuredClone(Bot.Embed);
                    gameStartEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory]} [${difficulty}]`;
                    gameStartEmbed.Description = `I am thinking of a number between **1** and **${maxNumber}**.\nType your number in chat.\n\nAttempts: **${attemptsLeft}**`;

                    await difficultySelection.update({
                        embeds: [CreateEmbed(gameStartEmbed)],
                        components: [disableRow(categoryRow), disableRow(difficultyRow)]
                    });

                    const messageFilter = response => response.author.id === userId;
                    const guessCollector = channel.createMessageCollector({
                        filter: messageFilter,
                        time: 90000
                    });

                    let gameResolved = false;

                    guessCollector.on('collect', async collected => {
                        if (gameResolved) return;

                        const rawGuess = collected.content.trim();
                        const numericGuess = parseInt(rawGuess, 10);

                        if (Number.isNaN(numericGuess)) {
                            const invalidEmbed = structuredClone(Bot.Embed);
                            invalidEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory]} [${difficulty}]`;
                            invalidEmbed.Description = `Please send a valid number.\nAttempts left: **${attemptsLeft}**`;
                            await channel.send({ embeds: [CreateEmbed(invalidEmbed)] });
                            return;
                        }

                        if (numericGuess === targetNumber) {
                            gameResolved = true;
                            guessCollector.stop('win');

                            User.cash += difficultyConfig.reward;

                            const winEmbed = structuredClone(Bot.Embed);
                            winEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory]} [${difficulty}]`;
                            winEmbed.Description = `Correct! The number was **${targetNumber}**.\n\nPrize: **${difficultyConfig.reward}**\nNew Wallet: **${User.cash}**`;
                            await channel.send({ embeds: [CreateEmbed(winEmbed)] });
                            ACTIVE_GUESS_USERS.delete(userId);
                            return;
                        }

                        attemptsLeft -= 1;

                        if (attemptsLeft <= 0) {
                            gameResolved = true;
                            guessCollector.stop('lose');

                            const loseEmbed = structuredClone(Bot.Embed);
                            loseEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory]} [${difficulty}]`;
                            loseEmbed.Description = `No attempts left. The number was **${targetNumber}**.`;
                            await channel.send({ embeds: [CreateEmbed(loseEmbed)] });
                            ACTIVE_GUESS_USERS.delete(userId);
                            return;
                        }

                        const direction = numericGuess < targetNumber ? 'Higher' : 'Lower';
                        const wrongEmbed = structuredClone(Bot.Embed);
                        wrongEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory]} [${difficulty}]`;
                        wrongEmbed.Description = `${direction}! Attempts left: **${attemptsLeft}**`;
                        await channel.send({ embeds: [CreateEmbed(wrongEmbed)] });
                    });

                    guessCollector.on('end', async (_, reason) => {
                        if (gameResolved) return;
                        if (reason === 'win' || reason === 'lose') return;

                        const timeoutEmbed = structuredClone(Bot.Embed);
                        timeoutEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory]} [${difficulty}]`;
                        timeoutEmbed.Description = `Time is up. The number was **${targetNumber}**.`;
                        await channel.send({ embeds: [CreateEmbed(timeoutEmbed)] });
                        ACTIVE_GUESS_USERS.delete(userId);
                    });

                    return;
                }

                const categoryWords = guessWords[selectedCategory] || [];
                const selectedWord = categoryWords[Math.floor(Math.random() * categoryWords.length)];

                if (!selectedWord || !selectedWord.answer) {
                    const invalidDataEmbed = structuredClone(Bot.Embed);
                    invalidDataEmbed.Title = 'Guess What';
                    invalidDataEmbed.Description = 'Invalid word data for this category.';
                    await difficultySelection.update({
                        embeds: [CreateEmbed(invalidDataEmbed)],
                        components: [disableRow(categoryRow), disableRow(difficultyRow)]
                    });
                    ACTIVE_GUESS_USERS.delete(userId);
                    return;
                }

                const answer = String(selectedWord.answer).toLowerCase().trim();
                const hints = Array.isArray(selectedWord.hints) ? selectedWord.hints : [];
                let hintIndex = 0;
                let attemptsLeft = difficultyConfig.attempts;
                const maxHints = Math.min(difficultyConfig.hintLimit, hints.length);

                const gameStartEmbed = structuredClone(Bot.Embed);
                gameStartEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory] || 'Category'} [${difficulty}]`;
                gameStartEmbed.Description = `Type your guess in chat.\nType **hint** to get another hint.\n\nAttempts: **${attemptsLeft}**\nHints available: **${maxHints}**\n${maxHints > 0 ? `Hint 1: **${hints[0]}**` : 'No hints available for this word.'}`;

                await difficultySelection.update({
                    embeds: [CreateEmbed(gameStartEmbed)],
                    components: [disableRow(categoryRow), disableRow(difficultyRow)]
                });

                const messageFilter = response => response.author.id === userId;
                const guessCollector = channel.createMessageCollector({
                    filter: messageFilter,
                    time: 90000
                });

                let gameResolved = false;

                guessCollector.on('collect', async collected => {
                    if (gameResolved) return;

                    const userGuess = collected.content.toLowerCase().trim();

                    if (userGuess === answer) {
                        gameResolved = true;
                        guessCollector.stop('win');

                        User.cash += difficultyConfig.reward;

                        const winEmbed = structuredClone(Bot.Embed);
                        winEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory] || 'Category'} [${difficulty}]`;
                        winEmbed.Description = `Correct! The answer was **${selectedWord.answer}**.\n\nPrize: **${difficultyConfig.reward}**\nNew Wallet: **${User.cash}**`;
                        await channel.send({ embeds: [CreateEmbed(winEmbed)] });
                        ACTIVE_GUESS_USERS.delete(userId);
                        return;
                    }

                    if (userGuess === 'hint') {
                        if (hintIndex + 1 < maxHints) {
                            hintIndex += 1;
                            const hintEmbed = structuredClone(Bot.Embed);
                            hintEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory] || 'Category'} [${difficulty}]`;
                            hintEmbed.Description = `Hint ${hintIndex + 1}: **${hints[hintIndex]}**\nAttempts left: **${attemptsLeft}**`;
                            await channel.send({ embeds: [CreateEmbed(hintEmbed)] });
                        } else {
                            const noHintEmbed = structuredClone(Bot.Embed);
                            noHintEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory] || 'Category'} [${difficulty}]`;
                            noHintEmbed.Description = `No more hints available.\nAttempts left: **${attemptsLeft}**`;
                            await channel.send({ embeds: [CreateEmbed(noHintEmbed)] });
                        }
                        return;
                    }

                    attemptsLeft -= 1;

                    if (attemptsLeft <= 0) {
                        gameResolved = true;
                        guessCollector.stop('lose');

                        const loseEmbed = structuredClone(Bot.Embed);
                        loseEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory] || 'Category'} [${difficulty}]`;
                        loseEmbed.Description = `No attempts left. The answer was **${selectedWord.answer}**.`;
                        await channel.send({ embeds: [CreateEmbed(loseEmbed)] });
                        ACTIVE_GUESS_USERS.delete(userId);
                        return;
                    }

                    const wrongEmbed = structuredClone(Bot.Embed);
                    wrongEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory] || 'Category'} [${difficulty}]`;
                    wrongEmbed.Description = `Wrong guess. Attempts left: **${attemptsLeft}**\nType **hint** if you need help.`;
                    await channel.send({ embeds: [CreateEmbed(wrongEmbed)] });
                });

                guessCollector.on('end', async (_, reason) => {
                    if (gameResolved) return;
                    if (reason === 'win' || reason === 'lose') return;

                    const timeoutEmbed = structuredClone(Bot.Embed);
                    timeoutEmbed.Title = `Guess What - ${CATEGORY_LABELS[selectedCategory] || 'Category'} [${difficulty}]`;
                    timeoutEmbed.Description = `Time is up. The answer was **${selectedWord.answer}**.`;
                    await channel.send({ embeds: [CreateEmbed(timeoutEmbed)] });
                    ACTIVE_GUESS_USERS.delete(userId);
                });
            } catch (error) {
                const timeoutEmbed = structuredClone(Bot.Embed);
                timeoutEmbed.Title = 'Guess What';
                timeoutEmbed.Description = selectedCategory
                    ? 'Difficulty selection timed out.'
                    : 'Category selection timed out.';

                const rows = [disableRow(categoryRow)];
                if (difficultyRow) rows.push(disableRow(difficultyRow));

                Sent.edit({ embeds: [CreateEmbed(timeoutEmbed)], components: rows }).catch(() => {});
                ACTIVE_GUESS_USERS.delete(userId);
            }
        }).catch(() => {
            ACTIVE_GUESS_USERS.delete(userId);
        });
    }
}
