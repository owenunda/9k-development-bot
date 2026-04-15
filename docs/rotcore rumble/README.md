# Rotcore Rumble - Game Documentation

## Descripción General
Rotcore Rumble es un juego de cartas tipo "Animation Throwdown" integrado en el bot de Discord. Es un juego de batalla automatizado con cartas coleccionables, personajes, objetos y animaciones básicas.

---

## Estructura de Base de Datos

### Tabla: RotcoreRumbleCards
Almacena información de cartas disponibles en el juego.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único de la carta |
| Name | String | Nombre de la carta |
| Price | Float | Precio de la carta |
| Shop | Bool | ¿Se vende en la tienda? |
| Pack | Bool | ¿Se puede obtener en packs? |
| Stock | Float | Stock disponible |

### Tabla: RotcoreRumblePlayers
Almacena información de personajes/jugadores disponibles en el juego.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único del personaje |
| Name | String | Nombre del personaje |
| Price | Float | Precio del personaje |
| Shop | Bool | ¿Se vende en la tienda? |
| Pack | Bool | ¿Se puede obtener en packs? |
| Stock | Float | Stock disponible |
| PVP | Bool | ¿Puede aparecer en batallas NPC/Boss? |

### Tabla: RotcoreRumbleUsers
Almacena información específica de cada usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Integer | ID único del registro |
| User | String | Discord ID del usuario |
| Players | String/JSON | Lista de personajes poseídos |
| Cards | String/JSON | Lista de cartas poseídas |
| Wins | Float | Número de victorias |
| Loss | Float | Número de derrotas |
| Packs | String/JSON | Packs comprados/sin abrir |
| Decks | String/JSON | Mazos creados por el usuario |
| SelectedDeck | String | Mazo seleccionado para la siguiente batalla |

---

## Comandos Disponibles

```
/RotcoreRumble Battle [User id/NPC name]  - Inicia una batalla contra otro jugador o NPC
/RotcoreRumble Packs                      - Ver y abrir packs de cartas
/RotcoreRumble Players                    - Ver y comprar personajes
/RotcoreRumble Leaderboard                - Ver tabla de posiciones
```

---

## Tipos de Cartas

### 1. Cartas de Personaje (Character)
- **Uso**: Se utilizan en batalla para atacar y defender
- **Stats básicos**:
  - `Attack`: Daño que inflige
  - `Health`: Puntos de vida
  - `Defense`: Reduce el daño recibido
- **Mecánicas especiales**:
  - **[Combine]**: Durante la batalla se pueden combinar ciertos personajes para crear combos
    - Ejemplo: Minecraft Steve + Minecraft Horse = Minecraft Cavalier
    - Ejemplo: Cartman + Officer Barbrady = Respect My Authority

### 2. Cartas de Objeto (Item)
- **Uso**: Se utilizan sobre cartas de personaje
- **Tipos de objetos**:
  - Health Potion (Restaura vida)
  - Attack Boost Potion (Aumenta ataque)
  - Armor Boost Potion (Aumenta defensa)
  - Card Swap Potion (Cambia cartas)
- **Mecánicas especiales**:
  - **[Use]**: Selecciona un objeto y un personaje ya desplegado para usarlo
  - **[Combine]**: Ciertos objetos + personajes pueden combinarse
    - Ejemplo: Sky Blue + Minecraft Steve = BLUE STEVE

---

## Sistema de Tienda

### Packs
- Packs basados en nivel de rareza
- Contienen cartas de personaje y objeto
- Animaciones al abrir
- Progresión de dificultad planeada

### Objetos / Personajes
- Venta individual (más cara que en packs)
- Animaciones al obtener (reutilizar código de packs)
- Selección limitada que se expande con el tiempo

### Personajes y Packs de Personajes
- 1 carta de personaje por pack
- Disponible para compra individual

---

## Mecánica de Batalla

### Antes de la Batalla

**Flujo de Inicio**:
1. Usuario ejecuta `/rotcorerumble battle opponent`
2. Sistema valida:
   ```
   Option(A): Si el jugador no tiene personaje → [exit]
   Option(B): Si el jugador no tiene cartas → [exit]
   Option(C): Battle Init → Continúa
   ```

### Selección de Componentes

1. **[Player/Character]**: Seleccionar personaje a usar
   - Si no hay selección previa, elegir automáticamente
   - Nota: Inicialmente los usuarios tendrán 1 solo personaje

2. **[Select Deck]**: Elegir mazo a usar
   - Si no hay mazo seleccionado, se crea uno automáticamente
   - Requisitos: Mínimo 1 carta, Máximo 30 cartas

3. **[Card Slots]**: Espacios para desplegar personajes
   - Cantidad inicial: 3 slots por jugador
   - Expandible en el futuro

4. **[Card Hand]**: Mano de cartas
   - 6 cartas seleccionadas del mazo
   - El jugador elige 1 para el primer slot

### Durante la Batalla

**Tipo de batalla**:
- PVP: Jugador vs Jugador (futuro)
- Boss/NPC: Jugador vs IA automática

**Turnos**:
- Basados en roles
- Cada jugador coloca 1 carta por turno
- La IA elige cartas al azar (lógica básica inicial)

**Validaciones**:
- No se pueden poner objetos en slots de personaje
- Solo combinaciones de personajes válidas permitidas
- Si no hay movimientos válidos, saltar turno

### Cálculo de Daño

```javascript
Damage = CardA.Attack / (CardB.Defense / 10)
```

**Lógica de daño**:
- Si el slot está vacío → El daño va directo a la vida del jugador
- Si hay personaje → Daño va al personaje primero
- Si personaje muere → El daño restante va al jugador
- Slot vacío se puede volver a llenar

### Condición de Victoria

- **Win**: Vida del oponente ≤ 0
- **Recompensa**: Puntos de bot
- **Estadísticas**: Se actualizan Wins/Loss

---

## Estructura de Datos (Hardcoded)

### Cartas
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

### Personajes
```javascript
var Players = {}
Players.List = [
  {
    Name: 'Hank Hill',
    Health: 100
  }
]
```

### Usuarios
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

## Lógica de Batalla

### Función Principal
```javascript
function Fight(Player, NPC){
  // Battle Init
  // Validar que la batalla es válida
  // Ambos jugadores han colocado cartas

  // Fight Logic
  for (let cardSlot = 0; cardSlot < maxSlots; cardSlot++) {
    var CardA = Player.Slots[cardSlot];
    var CardB = NPC.Slots[cardSlot];

    if (CardA) {
      var Damage = CardA.Attack / (CardB ? CardB.Defense / 10 : 1);
      
      if (!CardB) {
        // Daño directo al jugador NPC
        NPC.Health -= Damage;
      } else {
        // Daño a la carta
        CardB.Health -= Damage;
        
        if (CardB.Health <= 0) {
          // El daño restante va al NPC
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

## Animaciones

**Estado**: Opcional (puede implementarse después)

### Animaciones Básicas
- Entrada de nuevas cartas
- Salida de cartas destruidas
- Ataque: Temblor del objeto visual
- Loot boxes con animación
- Visualización de selección de cartas

---

## Roadmap de Implementación

### Fase 1: Base
- [ ] Sistema de compra de personajes (`/rotcorerumble players`)
- [ ] Listado de cartas compra (`/rotcorerumble cards`)
- [ ] Sistema básico de packs con animaciones

### Fase 2: Batallas
- [ ] Batallas contra NPC
- [ ] Lógica de batalla automatizada
- [ ] Cálculo de daño
- [ ] Tabla de posiciones

### Fase 3: Características Avanzadas
- [ ] PVP entre jugadores
- [ ] Combinaciones de cartas
- [ ] Mazos personalizados
- [ ] Almacenamiento de packs a largo plazo

### Fase 4: Animaciones
- [ ] Animaciones de batalla
- [ ] Visualización de ataques
- [ ] Efectos visuales

---

## Notas de Desarrollo

- **Almacenamiento de packs**: Se necesita actualizar la tabla de usuarios para permitir almacenamiento a largo plazo
- **Selección automática**: Si no hay selección previa, el sistema elige automáticamente
- **IA básica**: La IA del NPC es aleatoria inicialmente, puede mejorarse después
- **Límite de cartas**: Mínimo 1, Máximo 30 por mazo
- **Compatibilidad**: Las combinaciones deben validarse antes de permitirse

---

**Última actualización**: Abril 14, 2026
**Estado**: En desarrollo - Fase 1
