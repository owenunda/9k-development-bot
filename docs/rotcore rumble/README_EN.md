# Rotcore Rumble - Game Documentation

## Overview
Rotcore Rumble is an "Animation Throwdown" style card game integrated into the Discord bot. It's an automated battle game with collectible cards, characters, items, and basic animations.

---

## Database Structure

### Table: RotcoreRumbleCards
Stores information about cards available in the game.

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Card unique ID |
| Name | String | Card name |
| Price | Float | Card price |
| Shop | Bool | Is it sold in the shop? |
| Pack | Bool | Can it be obtained in packs? |
| Stock | Float | Available stock |

### Table: RotcoreRumblePlayers
Stores information about characters/players available in the game.

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Character unique ID |
| Name | String | Character name |
| Price | Float | Character price |
| Shop | Bool | Is it sold in the shop? |
| Pack | Bool | Can it be obtained in packs? |
| Stock | Float | Available stock |
| PVP | Bool | Can it appear in NPC/Boss battles? |

### Table: RotcoreRumbleUsers
Stores specific information for each user.

| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Record unique ID |
| User | String | Discord ID of the user |
| Players | String/JSON | List of characters owned |
| Cards | String/JSON | List of cards owned |
| Wins | Float | Number of wins |
| Loss | Float | Number of losses |
| Packs | String/JSON | Packs purchased/unopened |
| Decks | String/JSON | Decks created by user |
| SelectedDeck | String | Deck selected for next battle |

---

## Available Commands

```
/RotcoreRumble Battle [User id/NPC name]  - Start a battle against another player or NPC
/RotcoreRumble Packs                      - View and open card packs
/RotcoreRumble Players                    - View and purchase characters
/RotcoreRumble Leaderboard                - View leaderboard
```

---

## Card Types

### 1. Character Cards
- **Usage**: Used in battle to attack and defend
- **Basic stats**:
  - `Attack`: Damage inflicted
  - `Health`: Hit points
  - `Defense`: Reduces damage received
- **Special mechanics**:
  - **[Combine]**: During battle certain characters can be combined to create combos
    - Example: Minecraft Steve + Minecraft Horse = Minecraft Cavalier
    - Example: Cartman + Officer Barbrady = Respect My Authority

### 2. Item Cards
- **Usage**: Used on character cards
- **Item types**:
  - Health Potion (Restores health)
  - Attack Boost Potion (Increases attack)
  - Armor Boost Potion (Increases defense)
  - Card Swap Potion (Swaps cards)
- **Special mechanics**:
  - **[Use]**: Select an item and an already deployed character to use it on
  - **[Combine]**: Certain items + characters can be combined
    - Example: Sky Blue + Minecraft Steve = BLUE STEVE

---

## Shop System

### Packs
- Packs based on rarity level
- Contain character and item cards
- Opening animations
- Planned difficulty progression

### Items / Characters
- Individual sale (more expensive than packs)
- Animation when obtained (reuse pack opening code)
- Limited selection that expands over time

### Characters and Character Packs
- 1 character card per pack
- Available for individual purchase

---

## Battle Mechanics

### Before Battle

**Initialization Flow**:
1. User executes `/rotcorerumble battle opponent`
2. System validates:
   ```
   Option(A): Player doesn't have a character → [exit]
   Option(B): Player doesn't have any cards → [exit]
   Option(C): Battle Init → Continue
   ```

### Selection Components

1. **[Player/Character]**: Select character to use
   - If no previous selection, choose automatically
   - Note: Initially users will have only 1 character

2. **[Select Deck]**: Choose deck to use
   - If no deck is selected, one is created automatically
   - Requirements: Minimum 1 card, Maximum 30 cards

3. **[Card Slots]**: Slots for deploying characters
   - Initial amount: 3 slots per player
   - Expandable in the future

4. **[Card Hand]**: Card hand
   - 6 cards selected from the deck
   - Player chooses 1 for the first slot

### During Battle

**Battle type**:
- PVP: Player vs Player (future)
- Boss/NPC: Player vs Automated AI

**Turns**:
- Role-based
- Each player places 1 card per turn
- AI picks cards at random (basic initial logic)

**Validations**:
- Cannot place items in character slots
- Only valid character combinations allowed
- If no valid moves, skip turn

### Damage Calculation

```javascript
Damage = CardA.Attack / (CardB.Defense / 10)
```

**Damage logic**:
- If slot is empty → Damage goes directly to player's health
- If character is present → Damage goes to character first
- If character dies → Remaining damage goes to player
- Empty slot can be refilled

### Victory Condition

- **Win**: Opponent's health ≤ 0
- **Reward**: Bot points
- **Statistics**: Wins/Loss updated

---

## Data Structure (Hardcoded)

### Cards
```javascript
var Cards = {}
Cards.List = [
  {
    Name: 'Minecraft Steve',
    Combos: ['Hank Hill'],
    Attack: 5,
    Defense: 15,
    Health: 30,
    Crafting: []    
  },
  {
    Name: 'Hank Hill',
    Combos: ['Minecraft Steve'],
    Attack: 10,
    Defense: 5,
    Health: 30,
    Crafting: []
  },
  {
    Name: 'Mowed Lawn',
    Combos: [],
    Attack: 10,
    Defense: 19,
    Health: 45,
    Crafting: [['Minecraft Steve', 'Hank Hill']]
  }
]
```

### Players
```javascript
var Players = {}
Players.List = [
  {
    Name: 'Hank Hill',
    Health: 100
  }
]
```

### Users
```javascript
var Users = {}
Users.List = [
  {
    id: 1,
    User: 'discordid',
    Players: ['Hank Hill'],
    Cards: ['Hank Hill', 'Minecraft Steve'],
    Wins: 0,
    Loss: 0,
    Decks: {
      DeckOne: ['Hank Hill', 'Minecraft Steve']
    },
    SelectedDeck: 'DeckOne'
  }
]
```

---

## Battle Logic

### Main Function
```javascript
function Fight(Player, NPC){
  // Battle Init
  // Validate that the battle is valid
  // Both players have placed cards

  // Fight Logic
  for (let cardSlot = 0; cardSlot < maxSlots; cardSlot++) {
    var CardA = Player.Slots[cardSlot];
    var CardB = NPC.Slots[cardSlot];

    if (CardA) {
      var Damage = CardA.Attack / (CardB ? CardB.Defense / 10 : 1);
      
      if (!CardB) {
        // Direct damage to NPC player
        NPC.Health -= Damage;
      } else {
        // Damage to card
        CardB.Health -= Damage;
        
        if (CardB.Health <= 0) {
          // Remaining damage goes to NPC
          NPC.Health += CardB.Health;
        }
      }
    }
  }

  if (NPC.Health <= 0){
    // Player = Winner
  }    
}
```

---

## Animations

**Status**: Optional (can be implemented later)

### Basic Animations
- New card entry
- Card destruction exit
- Attack: Visual object shake
- Animated loot boxes
- Card selection visualization

---

## Implementation Roadmap

### Phase 1: Foundation
- [ ] Character purchase system (`/rotcorerumble players`)
- [ ] Card listing and purchase (`/rotcorerumble cards`)
- [ ] Basic pack system with animations

### Phase 2: Battles
- [ ] Battles against NPCs
- [ ] Automated battle logic
- [ ] Damage calculation
- [ ] Leaderboard

### Phase 3: Advanced Features
- [ ] PVP between players
- [ ] Card combinations
- [ ] Custom decks
- [ ] Long-term pack storage

### Phase 4: Animations
- [ ] Battle animations
- [ ] Attack visualization
- [ ] Visual effects

---

## Development Notes

- **Pack Storage**: User table needs to be updated to allow long-term pack storage
- **Auto Selection**: If no previous selection, system chooses automatically
- **Basic AI**: NPC AI is random initially, can be improved later
- **Card Limit**: Minimum 1, Maximum 30 per deck
- **Compatibility**: Combinations must be validated before allowing

---

**Last update**: April 14, 2026
**Status**: In development - Phase 1
