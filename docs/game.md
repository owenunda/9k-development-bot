Structure
Database
RotcoreRumbleCards
id,Name[string],Price[float],Shop[bool],Pack[bool],Stock[float]
RotcoreRumblePlayers
id,Name[string],Price[float],Shop[bool],Pack[bool],Stock[float],PVP[bool]
These tables can be used to control sales of cards and user characters/players the shop/pack bool decides if the item is sold in the shop and if the item can be found inside packs PVP bool for the players table decides if that player/character can appear in npc/boss battles there will be far more data hard coded within the bot code
Database
RotcoreRumbleUsers
id,User[string],Players[string],Cards[string],Wins[float],Loss[float],Packs[string],Decks[string],SelectedDeck[string]
This table stores specific user info User would be their discord id, Players would store a table of players they have purchased from the store / got through opening packs or other means, Cards same thing as Players, Wins/Loss simple storage for leaderboard, Packs to store packs bought from the store, Decks to store player created decks, SelectedDeck to store the deck the player wishes to use for the next battle

Commands
/RotcoreRumble Battle [User id/NPC name]
/RotcoreRumble Packs 
/RotcoreRumble Players
/RotcoreRumble Leaderboard

Animation Throwdown Clone Feature
Its a card game but we will also provide some basic animation like fights and loot boxes likely things we can programmatically animate with basic assets
Foundation
We need storage for
Cards (Store/Player)
Players (Store/Player)
Players
Health (Health hits 0 you lose match)
Card(s)
Card Rarity
Two card types (Character/Item)
Character
For use in battle
[Combine] While in battle you can combine certain cards to make combo cards EG. Minecraft Steve + Minecraft Horse = Minecraft Cavalier, Cartman + Officer Barbrady = Respect My Authority (Combine is a card but not one the player can store in a deck must be done inside of battle)
Attack,Health,Defense (Basic stats probably more later)
Item
For use on character card
[Use] While in battle you can use a item card similar to a character card, you select the item card and a character card that is already deployed to use it on EG. Health Potion, Attack Boost Potion, Armor Boost Potion, Card Swap Potion [Combine] Certain Items + Certain Characters Combine like traditional character cards uh wild example but Sky Blue (Breaking bad meth reference) + Minecraft Steve = BLUE STEVE (regular one but blue with lightning all over or something)
Shop
Packs (Rarity level based packs with open animations packs should contain item and character cards probably start basic and expand later)
Items / Characters (Not full selection + more expensive then packs reuse code to make animation when pack opens and get character or item)
Players + Player Pack (1 player card)
Battle!
You place character cards to fight somewhere around 3-5 slots for each player
Actual battle is automated turns are just to place additional cards
PVP / Boss the battle is between you the player and (another human player, a afk human player or a boss/npc that is automated)
Basic animation 
New cards added / removed, attack = object shake (very basic but feels like your playing a real game not just a discord text command)
Winner
P1 Card slot has character P2 Empty, P2 health drained to 0 from cards attacking empty slot, P1 win
If human win, get bot points.

Animation at this point animation is optional we could put work into visualizing choices and battles now or could work on that later would be good if additional work is needed so we are not all trying to do the same thing
/rotcorerumble battle opponent:@jaisonr
check cards and players both players
looks like your new! take a player and some cards on us. [give basic player and card pack to open and instructions on how to open them] [exit] (i need to update user table to allow long term pack storage)
Option(A) This player does not have a player [exit]
Option(B) This player does not have any cards [exit]
Option(C) Battle Init
[Player/Character] User should select before if no selection we automatically choose one at this point its likely the user only has 1 character but possibly more if they purchase before playing
[Select Deck] (i need to update user table to allow preferred card deck storage)
[Card Slots] We need slots where character cards can be placed we could start with 3 (per player)
[Card Hand] We need card hands a selection of lets say 6 cards pulled from the Deck the player will then take 1 card from here and place it in the first card slot to start the battle
[NPC / Other Player] I do want live player vs player battles this is hard and complex though and we will need npc battles before the game is big so we need auto battle logic for the npc to start this can be super basic pick random player with PVP set to true when their turn is active pick random card etc just enough to play not be a smart battle
User Person who started the battle sees turn based role play each person puts down 1 card with compatibility matching (no items in character slots, no invalid character combos, if no valid moves skip turn only apply fight mechanics, etc)
Winning In order to win you need to use your character card placed into a slot to kill the other persons character card, once killed the slot is empty the user can see this and add another character card to that slot but if it stays empty when the turn ends and battle mechanics are calculated an empty slot does damage to the Player/Character directly instead of damaging a card when the players health hits 0 they lose for now this should only effect win/loss stats.

no decks or selected deck we could create one from their cards (Min cards per deck 1, Max 30).

example of structure:


var Cards = {}//hard coded data
Cards.List = [
{
Name: 'Minecraft Steve',
Combos: ['Hank Hill'],
Attack: 5,
Defense: 15,
Health: 30,
Crafting: []    
}
{
Name: 'Hank Hill',
Combos: ['Minecraft Steve'],
Attack: 10,
Defense: 5,
Health: 30,
Crafting: []
}
{
Name: 'Mowed Lawn',
Combos: [],
Attack: 10,
Defense: 19,
Health: 45
Crafting: [['Minecraft Steve', 'Hank Hill']]
}
]
var Players = {}
Players.List = [
{
Name: 'Hank Hill',
Health: 100
}
]
var Users = {}
Users.List = [
{
id:1,
User:discordid,
Players:['Hank Hill'],
Cards:['Hank Hill', 'Minecraft Steve']
Wins:0
Loss:0
Decks:{
    DeckOne: ['Hank Hill', 'Minecraft Steve']
},
Selected Deck:['DeckOne']
}
]
Fight(FindPlayer(discordid), FindPlayer(discordid))
function Fight(Player, NPC){
//Battle Init
//Grab info from database run checks to make sure fight is valid
//Both Players have placed cards


//Fight Logic
//CardA attacks CardB defends
//need a forloop for all card slots
var Damage = CardA.Attack / (CardB.Defense / 10)//Lower damage based on CardB defense
if (NPC.SlotOne == null){
NPC.Health += -Damage
}
else{
CardB.Health += -Damage
if (CardB.Health <= 0){
NPC.Health += CardB.Health
}
}
if (NPC.Health <= 0){
//Player = Winner
}    
}

easiest would be start with specific buy option /rotcorebumble players /rotcorerumber cards list cards and buy button just like shop we already have
then eventually we also need to make a pack system that randomly gives cards/players based on rarity
