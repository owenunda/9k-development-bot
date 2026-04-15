/**
 * Rotcore Rumble Game Logic
 * Handles game setup, battle mechanics, and data management
 */

import logger from './logger.js';
import { GetRumbleUser, AddRumbleUser, SaveRumbleUser } from './functions.js';

/* ============================================================
   CARD DEFINITIONS (Hardcoded Game Data)
   ============================================================ */

// Card database with all available cards
export const CARDS_DB = [
    {
        id: 1,
        name: 'Minecraft Steve',
        combos: [2], // Can combine with 'Hank Hill' (id: 2)
        attack: 5,
        defense: 15,
        health: 30,
        crafting: [], // Empty - can be crafted into other cards
        rarity: 'common'
    },
    {
        id: 2,
        name: 'Hank Hill',
        combos: [1], // Can combine with 'Minecraft Steve'
        attack: 10,
        defense: 5,
        health: 30,
        crafting: [],
        rarity: 'common'
    },
    {
        id: 3,
        name: 'Mowed Lawn',
        combos: [],
        attack: 10,
        defense: 19,
        health: 45,
        crafting: [[1, 2]], // Result of combining Minecraft Steve + Hank Hill
        rarity: 'rare'
    },
    {
        id: 4,
        name: 'Health Potion',
        combos: [],
        attack: 0,
        defense: 0,
        health: 20,
        crafting: [],
        type: 'item',
        rarity: 'common'
    },
    {
        id: 5,
        name: 'Attack Boost Potion',
        combos: [],
        attack: 5,
        defense: 0,
        health: 0,
        crafting: [],
        type: 'item',
        rarity: 'uncommon'
    }
];

// Player/Character database
export const PLAYERS_DB = [
    {
        id: 1,
        name: 'Hank Hill',
        health: 100,
        pvp: true,
        rarity: 'common'
    },
    {
        id: 2,
        name: 'Eric Cartman',
        health: 80,
        pvp: true,
        rarity: 'uncommon'
    }
];

/* ============================================================
   STARTER SETUP - For New Players
   ============================================================ */

/**
 * Initialize a new player with starter cards and player
 * @param {string} userId - Discord user ID
 * @param {Object} Bot - Bot instance
 * @returns {Object|null} - Updated rumble user or null on error
 */
export async function InitializeNewPlayer(userId, Bot) {
    try {
        // Add user to database
        const created = await AddRumbleUser(userId, Bot);
        if (!created) {
            logger.error({ message: 'Failed to create new player', userId, label: 'Rumble' });
            return null;
        }

        // Get fresh user record
        let rumbleUser = await GetRumbleUser(userId, Bot);
        if (!rumbleUser) {
            logger.error({ message: 'Could not fetch newly created player', userId, label: 'Rumble' });
            return null;
        }

        // Give starter cards and player
        const starterCards = [1, 4]; // Minecraft Steve + Health Potion
        const starterPlayers = [1]; // Hank Hill
        const starterDeck = {
            DeckOne: [1, 4] // Basic starter deck
        };

        rumbleUser.Cards = JSON.stringify(starterCards);
        rumbleUser.Players = JSON.stringify(starterPlayers);
        rumbleUser.Decks = JSON.stringify(starterDeck);
        rumbleUser.SelectedDeck = 'DeckOne';
        rumbleUser.Wins = 0;
        rumbleUser.Loss = 0;

        // Save to database
        const saved = await SaveRumbleUser(rumbleUser, Bot);
        if (!saved) {
            logger.error({ message: 'Failed to save new player data', userId, label: 'Rumble' });
            return null;
        }

        logger.info({ message: `New player initialized: ${userId}`, label: 'Rumble' });
        return rumbleUser;

    } catch (error) {
        logger.error({ message: 'InitializeNewPlayer Error', error, label: 'Rumble' });
        return null;
    }
}

/* ============================================================
   PLAYER VALIDATION & RETRIEVAL
   ============================================================ */

/**
 * Get or create a player, ensuring they exist in the database
 * @param {string} userId - Discord user ID
 * @param {Object} Bot - Bot instance
 * @returns {Object|null} - Rumble user object or null
 */
export async function EnsurePlayer(userId, Bot) {
    try {
        let rumbleUser = await GetRumbleUser(userId, Bot);

        // New player - initialize them
        if (!rumbleUser) {
            rumbleUser = await InitializeNewPlayer(userId, Bot);
        }

        return rumbleUser;

    } catch (error) {
        logger.error({ message: 'EnsurePlayer Error', error, label: 'Rumble' });
        return null;
    }
}

/**
 * Validate if a player can start a battle
 * @param {Object} rumbleUser - Rumble user object
 * @returns {Object} - { canBattle: boolean, reason: string }
 */
export function ValidateBattleReadiness(rumbleUser) {
    if (!rumbleUser) {
        return { canBattle: false, reason: 'Player not found' };
    }

    // Check if player has a character/player selected
    if (!rumbleUser.Players || rumbleUser.Players === 'null' || rumbleUser.Players === '' || rumbleUser.Players === '[]') {
        return { canBattle: false, reason: 'This player does not have a player character. [exit]' };
    }

    // Check if player has cards
    if (!rumbleUser.Cards || rumbleUser.Cards === 'null' || rumbleUser.Cards === '' || rumbleUser.Cards === '[]') {
        return { canBattle: false, reason: 'This player does not have any cards. [exit]' };
    }

    return { canBattle: true, reason: 'Ready for battle' };
}

/* ============================================================
   DECK MANAGEMENT
   ============================================================ */

/**
 * Parse decks from JSON string
 * @param {string|Object} decksData - JSON string or object
 * @returns {Object} - Parsed decks object
 */
export function ParseDecks(decksData) {
    if (!decksData || decksData === 'null') {
        return {};
    }

    try {
        if (typeof decksData === 'string') {
            return JSON.parse(decksData);
        }
        return decksData || {};
    } catch (error) {
        logger.warn({ message: 'Failed to parse decks', error, label: 'Rumble' });
        return {};
    }
}

/**
 * Parse cards from JSON string
 * @param {string|Array} cardsData - JSON string or array
 * @returns {Array} - Parsed cards array (card IDs)
 */
export function ParseCards(cardsData) {
    if (!cardsData || cardsData === 'null') {
        return [];
    }

    try {
        if (typeof cardsData === 'string') {
            return JSON.parse(cardsData) || [];
        }
        return Array.isArray(cardsData) ? cardsData : [];
    } catch (error) {
        logger.warn({ message: 'Failed to parse cards', error, label: 'Rumble' });
        return [];
    }
}

/**
 * Parse players from JSON string
 * @param {string|Array} playersData - JSON string or array
 * @returns {Array} - Parsed players array (player IDs)
 */
export function ParsePlayers(playersData) {
    if (!playersData || playersData === 'null') {
        return [];
    }

    try {
        if (typeof playersData === 'string') {
            return JSON.parse(playersData) || [];
        }
        return Array.isArray(playersData) ? playersData : [];
    } catch (error) {
        logger.warn({ message: 'Failed to parse players', error, label: 'Rumble' });
        return [];
    }
}

/**
 * Get selected deck cards for a player
 * @param {Object} rumbleUser - Rumble user object
 * @returns {Array} - Array of card IDs in selected deck
 */
export function GetSelectedDeckCards(rumbleUser) {
    try {
        const decks = ParseDecks(rumbleUser.Decks);
        const selectedDeckName = rumbleUser.SelectedDeck || 'DeckOne';
        return decks[selectedDeckName] || [];
    } catch (error) {
        logger.warn({ message: 'GetSelectedDeckCards Error', error, label: 'Rumble' });
        return [];
    }
}

/**
 * Draw hand cards from a deck
 * @param {Array} deckCards - Array of card IDs
 * @param {number} handSize - Number of cards to draw (default: 6)
 * @returns {Array} - Array of card objects
 */
export function DrawHand(deckCards, handSize = 6) {
    if (!deckCards || deckCards.length === 0) {
        return [];
    }

    const hand = [];
    const shuffled = [...deckCards].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(handSize, shuffled.length); i++) {
        const cardId = shuffled[i];
        const card = GetCardById(cardId);
        if (card) {
            hand.push(card);
        }
    }

    return hand;
}

/* ============================================================
   CARD & PLAYER LOOKUP
   ============================================================ */

/**
 * Get card object by ID
 * @param {number} id - Card ID
 * @returns {Object|null} - Card object or null
 */
export function GetCardById(id) {
    return CARDS_DB.find(c => c.id === id) || null;
}

/**
 * Get player/character object by ID
 * @param {number} id - Player ID
 * @returns {Object|null} - Player object or null
 */
export function GetPlayerById(id) {
    return PLAYERS_DB.find(p => p.id === id) || null;
}

/**
 * Get card by name
 * @param {string} name - Card name
 * @returns {Object|null} - Card object or null
 */
export function GetCardByName(name) {
    return CARDS_DB.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Resolve the active battle loadout for a user.
 * This is the temporary base layer: it auto-picks the first character
 * and the first available deck so battles can start without a manual setup UI.
 * @param {Object} rumbleUser - Rumble user object
 * @returns {Object} - Resolved loadout data
 */
export function ResolveBattleLoadout(rumbleUser) {
    const players = ParsePlayers(rumbleUser?.Players);
    const cards = ParseCards(rumbleUser?.Cards);
    const decks = ParseDecks(rumbleUser?.Decks);

    const selectedPlayerId = players.length > 0 ? players[0] : (PLAYERS_DB[0]?.id ?? null);
    const selectedPlayer = selectedPlayerId ? GetPlayerById(selectedPlayerId) : null;

    const availableDeckNames = Object.keys(decks);
    const selectedDeckName = rumbleUser?.SelectedDeck && decks[rumbleUser.SelectedDeck]
        ? rumbleUser.SelectedDeck
        : (availableDeckNames[0] || 'StarterDeck');

    const selectedDeckCards = Array.isArray(decks[selectedDeckName]) && decks[selectedDeckName].length > 0
        ? decks[selectedDeckName]
        : (cards.length > 0 ? cards : [1, 4]);

    const hand = DrawHand(selectedDeckCards, 6);

    return {
        selectedPlayerId,
        selectedPlayer,
        selectedDeckName,
        selectedDeckCards,
        hand
    };
}

/* ============================================================
   BATTLE INITIALIZATION
   ============================================================ */

/**
 * Create battle state object
 * @param {Object} player1 - Player 1 rumble user
 * @param {Object} player2 - Player 2 rumble user (or NPC)
 * @param {string} player2Name - Name of player 2 for display
 * @returns {Object} - Battle state object
 */
export function InitializeBattle(player1, player2, player2Name = 'Opponent') {
    try {
        const player1Loadout = ResolveBattleLoadout(player1);
        const player2Loadout = ResolveBattleLoadout(player2);

        if (!player1Loadout.selectedPlayer || !player2Loadout.selectedPlayer) {
            return null;
        }

        // Create battle state
        const battleState = {
            id: Date.now(),
            createdAt: new Date(),
            player1: {
                userId: player1.User,
                character: player1Loadout.selectedPlayer,
                health: player1Loadout.selectedPlayer.health,
                deck: player1Loadout.selectedDeckCards,
                hand: player1Loadout.hand,
                deckName: player1Loadout.selectedDeckName,
                slots: [null, null, null] // 3 slots
            },
            player2: {
                userId: player2.User || 'NPC',
                name: player2Name,
                character: player2Loadout.selectedPlayer,
                health: player2Loadout.selectedPlayer.health,
                deck: player2Loadout.selectedDeckCards,
                hand: player2Loadout.hand,
                deckName: player2Loadout.selectedDeckName,
                slots: [null, null, null] // 3 slots
            },
            turn: 1,
            phase: 'SETUP', // SETUP -> PLAYER1_PLAY -> PLAYER2_PLAY -> BATTLE_CALC -> NEXT_TURN/WIN
            winner: null,
            history: []
        };

        logger.info({ 
            message: `Battle initialized: ${player1.User} vs ${player2Name}`, 
            label: 'Rumble' 
        });

        return battleState;

    } catch (error) {
        logger.error({ message: 'InitializeBattle Error', error, label: 'Rumble' });
        return null;
    }
}

/**
 * Calculate damage between two cards
 * @param {Object} attackCard - Attacking card
 * @param {Object} defendCard - Defending card (optional)
 * @returns {number} - Damage amount
 */
export function CalculateDamage(attackCard, defendCard = null) {
    if (!attackCard || !attackCard.attack) {
        return 0;
    }

    let defence = defendCard && defendCard.defense ? defendCard.defense / 10 : 1;
    const damage = Math.max(1, Math.floor(attackCard.attack / defence));

    return damage;
}

/**
 * Execute a single turn attack
 * @param {Object} battleState - Current battle state
 * @param {number} slotIndex - Slot index (0-2)
 * @param {Object} attackCard - Card attacking
 * @returns {Object} - Result of the attack
 */
export function ExecuteAttack(battleState, slotIndex, attackCard) {
    const result = {
        success: false,
        damage: 0,
        target: null,
        defender: null,
        targetDied: false
    };

    if (!battleState || !attackCard || slotIndex < 0 || slotIndex >= 3) {
        return result;
    }

    const defendCard = battleState.player2.slots[slotIndex];
    const damage = CalculateDamage(attackCard, defendCard);

    result.damage = damage;

    if (defendCard) {
        // Damage to card
        defendCard.health -= damage;
        result.target = 'CARD';
        result.defender = defendCard;

        if (defendCard.health <= 0) {
            // Card destroyed
            result.targetDied = true;
            battleState.player2.slots[slotIndex] = null;

            // Remaining damage to player
            const overflowDamage = Math.abs(defendCard.health);
            battleState.player2.health -= overflowDamage;
        }
    } else {
        // Direct damage to player
        result.target = 'PLAYER';
        battleState.player2.health -= damage;
    }

    result.success = true;

    // Record in history
    battleState.history.push({
        turn: battleState.turn,
        action: 'ATTACK',
        attacker: 'PLAYER1',
        card: attackCard.name,
        damage: damage,
        target: result.target
    });

    return result;
}

/* ============================================================
   BATTLE STATUS CHECKS
   ============================================================ */

/**
 * Check if battle is over
 * @param {Object} battleState - Current battle state
 * @returns {Object|null} - { winner: 'PLAYER1' | 'PLAYER2', reason: string } or null
 */
export function CheckBattleEnd(battleState) {
    if (!battleState) {
        return null;
    }

    if (battleState.player1.health <= 0) {
        return { winner: 'PLAYER2', reason: 'Player 1 defeated' };
    }

    if (battleState.player2.health <= 0) {
        return { winner: 'PLAYER1', reason: 'Player 2 defeated' };
    }

    return null;
}

/**
 * Get current battle status summary
 * @param {Object} battleState - Current battle state
 * @returns {Object} - Battle status
 */
export function GetBattleStatus(battleState) {
    if (!battleState) {
        return null;
    }

    return {
        turn: battleState.turn,
        phase: battleState.phase,
        player1: {
            health: battleState.player1.health,
            character: battleState.player1.character.name,
            slots: battleState.player1.slots.map(s => s ? s.name : 'EMPTY'),
            handSize: battleState.player1.hand.length
        },
        player2: {
            health: battleState.player2.health,
            character: battleState.player2.character.name,
            name: battleState.player2.name,
            slots: battleState.player2.slots.map(s => s ? s.name : 'EMPTY'),
            handSize: battleState.player2.hand.length
        }
    };
}
