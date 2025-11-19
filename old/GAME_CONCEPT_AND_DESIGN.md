# Ollama RPG Game - Complete Design and Concept Document

A Python-based RPG game using Pygame and Ollama LLM integration for dynamic NPC dialogue generation and behavior. The game emphasizes emergent gameplay through AI-driven NPC interactions, scheduling systems, memory management, and relationship tracking.

---

## Table of Contents

1. [Core Game Concept](#core-game-concept)
2. [Technical Architecture](#technical-architecture)
3. [Game Systems Overview](#game-systems-overview)
4. [World and Setting](#world-and-setting)
5. [Game Loop and States](#game-loop-and-states)
6. [Player Mechanics](#player-mechanics)
7. [NPC and AI Systems](#npc-and-ai-systems)
8. [Dialogue and Interaction](#dialogue-and-interaction)
9. [UI and Controls](#ui-and-controls)
10. [Persistence and Saving](#persistence-and-saving)
11. [Configuration and Modding](#configuration-and-modding)

---

## Core Game Concept

### Vision
An immersive top-down RPG where NPCs are powered by a local language model (Ollama). Each NPC has unique personality traits, memories, daily schedules, and relationships with the player. The game world feels alive because NPCs remember conversations, form opinions, and behave according to their personality and schedule.

### Key Differentiators
- **AI-Powered Dialogue**: Uses Ollama (local LLM) to generate contextual NPC responses in real-time
- **Persistent Memories**: NPCs remember past conversations and events with the player
- **Dynamic Scheduling**: NPCs follow daily routines that affect where they are and what they're doing
- **Relationship Tracking**: Every interaction affects how NPCs view the player
- **Emergent Gameplay**: No scripted dialogue trees; conversations flow naturally based on context
- **Personality-Driven**: NPC personality traits influence tone, topic choice, and decision-making

### Player Experience
The player explores a village called Millbrook, talking to NPCs, completing quests, and discovering the world through natural conversation. Each NPC interaction is unique because the AI generates responses based on personality, relationship, emotional state, and dialogue history.

---

## Technical Architecture

### Technology Stack
- **Language**: Python 3.8+
- **Graphics**: Pygame (2D rendering, 1280x720 default resolution)
- **LLM Integration**: Ollama (local, self-hosted language models)
- **Data Format**: JSON (save files, configuration)
- **Build**: No dependencies beyond pygame and ollama client

### Project Structure
```
ollama-rpg-game/
├── src/
│   ├── core/
│   │   ├── game.py              # Main game loop, state management, orchestration
│   │   ├── player.py            # Player entity, movement, collision detection
│   │   ├── input_handler.py     # Event handling, key/mouse input processing
│   │   └── camera.py            # Viewport/camera following player
│   │
│   ├── ui/
│   │   ├── ui_manager.py        # Central coordinator for all UI systems
│   │   ├── main_menu.py         # Main menu and pause menu screens
│   │   ├── dialogue_ui.py       # Dialogue box display and management
│   │   ├── dialogue_choices.py  # Dialogue choice menu rendering
│   │   ├── quest_log_ui.py      # Quest log overlay display
│   │   ├── settings_ui.py       # Settings/configuration menu
│   │   ├── save_load_ui.py      # Save/load file management UI
│   │   ├── debug_helpers_ui.py  # Development debug tools
│   │   └── llm_menu.py          # LLM server/model configuration
│   │
│   ├── npc/
│   │   ├── npc.py               # NPC entity definition and state
│   │   ├── npc_manager.py       # NPC spawning, despawning, management
│   │   ├── ai_controller.py     # NPC scheduling and behavior execution
│   │   ├── dialogue_manager.py  # Dialogue generation and async loading
│   │   ├── personality.py       # NPC personality trait system
│   │   ├── memory_system.py     # NPC memory storage and relationship tracking
│   │   ├── knowledge_graph.py   # World knowledge facts and relationships
│   │   └── pathfinding.py       # NPC movement pathfinding (A*-based)
│   │
│   ├── world/
│   │   ├── map.py               # Map rendering, tile management, collisions
│   │   ├── world_state.py       # Time system, weather, day/night cycle
│   │   └── location.py          # Interior/exterior transitions and locations
│   │
│   ├── systems/
│   │   ├── quest_system.py      # Quest generation, tracking, completion
│   │   └── game_master.py       # Event generation and world orchestration
│   │
│   ├── persistence/
│   │   ├── save_manager.py      # Save/load system implementation
│   │   └── serializers.py       # Entity serialization/deserialization
│   │
│   └── utils/
│       ├── config.py            # Configuration file management
│       ├── ollama_client.py     # Ollama LLM API integration
│       └── dialogue_loader.py   # Async dialogue generation with timeout handling
│
├── assets/
│   ├── maps/                    # Map tile definitions
│   ├── sprites/                 # Player and NPC sprites
│   └── tilesets/                # Tileset graphics
│
├── saves/                       # Save game files (auto-created)
│
├── tests/                       # Unit tests
│   ├── test_*.py               # Various test suites
│   └── test_pause_menu.py      # Pause menu state tests
│
├── game_settings.json           # Game configuration
├── GAME_DESIGN_GUIDE.md        # Comprehensive design documentation
├── MENU_AND_CONTROLS_GUIDE.md  # Player controls reference
└── main.py                      # Entry point
```

### Class Hierarchy

**Core Entities:**
- `Game` - Main orchestrator, manages all systems
- `Player` - Player character with position, stats, health
- `NPC` - Non-player character with personality, memory, schedule
- `Camera` - Viewport system following player

**UI Systems:**
- `UIManager` - Central coordinator
- `MainMenu` - Menu display and navigation
- `DialogueUI` - Dialogue display management
- `DialogueChoices` - Choice selection menu
- `QuestLogUI` - Quest information display
- `SaveLoadUI` - Save/load file management
- `SettingsUI` - Game settings configuration
- `DebugHelpersUI` - Development tools

**NPC Systems:**
- `NPCManager` - Manages NPC lifecycle
- `AIController` - Executes NPC schedules and behaviors
- `DialogueManager` - Generates NPC dialogue using Ollama
- `Personality` - NPC personality trait system
- `MemorySystem` - NPC memories and relationships
- `KnowledgeGraph` - World facts and relationships
- `Pathfinder` - NPC pathfinding algorithm

**World Systems:**
- `Map` - Map rendering and collision detection
- `WorldState` - Time progression and weather
- `Location` - Interior/exterior management
- `QuestSystem` - Quest tracking and completion
- `GameMaster` - Event generation and orchestration

**Persistence:**
- `SaveManager` - Save/load file operations
- `Serializers` - Entity serialization logic

---

## Game Systems Overview

### 1. Input System
- **Keyboard**: WASD for movement, SPACE/E for interaction, ESC for menu, arrow keys for UI
- **Mouse**: Click for menu selection, hover for highlighting, wheel for scrolling
- **Events**: Pygame event-based with input routing to active UI/gameplay
- **One-Time Presses**: Key down events detected once per press (no frame-based repetition)

### 2. Game State Management
- **Running State**: Game loop control (true/false)
- **Paused State**: Game updates frozen but UI responsive
- **Menu State**: Menu visible, gameplay input disabled
- **Dialogue State**: Player locked, dialogue system active
- **Location State**: Interior vs. exterior, affects rendering

### 3. World State System
- **Time**: 24-hour cycle with in-game hour = 1 second at 60 FPS
  - Full day cycle: 60 seconds per day
  - Configurable time scale
  - Tracks hours, minutes, days
- **Weather**: Types include clear, cloudy, rainy, foggy, stormy
- **Transitions**: Time and weather affect NPC scheduling and game appearance

### 4. NPC System
- **Personalities**: 6-dimensional trait system (aggression, friendliness, intelligence, caution, greed, honor)
- **Scheduling**: Daily routines with location-based activities
- **Memory**: Stores conversations, encounters, events with time decay
- **Relationships**: Range from -100 (enemy) to +100 (best friend)
- **Emotional State**: Happy, angry, sad, suspicious, neutral
- **Pathfinding**: A*-based pathfinding for NPC movement

### 5. Dialogue System
- **Context-Aware**: Considers personality, relationship, emotional state, history
- **Async Loading**: Non-blocking dialogue generation from Ollama
- **Choice Generation**: 4 contextual choices from NPC perspective
- **Fallback System**: Generic responses if Ollama unavailable
- **Auto-Show**: Choices appear automatically 300ms after greeting

### 6. Quest System
- **Types**: Fetch, delivery, kill, escort, talk, explore, help
- **Tracking**: Quests have status (available, active, completed, failed)
- **Rewards**: XP, gold, relationship points, items
- **Default Quests**: Millbrook includes starter quests
- **Progress**: Objectives track completion percentage

### 7. Knowledge Graph
- **Facts Storage**: Subject-relation-object semantic triples
- **Confidence Levels**: Each fact has confidence rating (0-1)
- **Sources**: Track where knowledge comes from
- **World Context**: Used by NPC dialogue generation

---

## World and Setting

### Millbrook (Default Setting)
A peaceful village with several key locations:
- **Town Square**: Central gathering area
- **The Gilded Grain**: Tavern and social hub (run by Mara)
- **Blacksmith**: Weapon and tool crafting
- **General Store**: Supplies and trading
- **Homes**: Various residential buildings
- **Surrounding Woods**: Exploration area

### Locations and Movement
- **Exterior**: Open world rendering with NPCs and buildings
- **Interior**: Buildings have interior spaces
- **Transitions**: Pressing E at doors moves between interior/exterior
- **Door Cooldown**: 1-second cooldown prevents door-stuck issues
- **Position Memory**: Player position remembered when entering/exiting

### Map System
- **Tile-Based Rendering**: 32x32 pixel tiles (default)
- **Collision Detection**: Pixel-perfect or tile-based
- **Layer System**: Background, objects, NPCs, player, effects
- **Camera Following**: Viewport follows player position
- **Rendering Distance**: Culls off-screen entities for performance

---

## Game Loop and States

### Main Game Loop (60 FPS)
```
while running:
    1. Handle Input
       - Collect pygame events
       - Route to appropriate handler (menu, dialogue, gameplay)
       - Track one-time key presses

    2. Update
       - Update all systems (UI, world, NPCs, player)
       - Advance world time
       - Process dialogue loading
       - Execute NPC schedules
       - Check interactions

    3. Render
       - Clear screen
       - Render map/buildings
       - Render NPCs
       - Render player
       - Render UI (dialogue, menu, HUD)

    4. Frame Lock
       - Lock to 60 FPS (~16.67ms per frame)
```

### State Transitions
```
STARTUP
  ↓
MAIN MENU (Main Menu visible)
  ├→ New Game → GAMEPLAY (fresh start)
  ├→ Load Game → (select save) → GAMEPLAY (loaded state)
  ├→ Settings → SETTINGS MENU → back to MAIN MENU
  ├→ Debug → DEBUG MENU → back to MAIN MENU
  └→ Quit → EXIT

GAMEPLAY (In-Game, ESC shows pause menu)
  ├→ Press E near NPC → DIALOGUE LOADING
  │   └→ (Ollama generating...) → DIALOGUE ACTIVE
  │       ├→ Auto-show choices (300ms) → DIALOGUE CHOICES
  │       └→ Select "farewell" → FAREWELL (auto-close 3s)
  │
  ├→ Press E at door → TRANSITION → GAMEPLAY (interior/exterior)
  ├→ Press ESC → PAUSE MENU
  └→ Press I → QUEST LOG (overlay)

PAUSE MENU (Game paused, menu visible)
  ├→ Resume → back to GAMEPLAY
  ├→ Save Game → (select slot) → back to PAUSE MENU
  ├→ Load Game → (select save) → GAMEPLAY (loaded)
  ├→ Settings → SETTINGS MENU → back to PAUSE MENU
  └→ Quit → MAIN MENU
```

### Update Order (Per Frame)
1. UI systems always update
2. Early return if paused/menu active (skip gameplay)
3. World state advances (time, weather)
4. Dialogue system checks async loading
5. Game Master generates events/quests
6. Player processes movement input
7. NPC updates (pathfinding, collision)
8. AI controller executes schedules
9. Interaction prompts update
10. Camera follows player

---

## Player Mechanics

### Movement
- **Speed**: 2 pixels per frame = 120 pixels/second at 60 FPS
- **Directions**: 8-directional (hold multiple keys for diagonals)
- **Collision**: Checked at player center and corners
- **Smooth Movement**: WASD held continuously for fluid motion

### Interaction System
**Detection Range**: 100 pixels from player center

**Priority**:
1. Check for nearby doors first
2. If door found, show door prompt and allow entry
3. If no door, check for nearby NPCs
4. If NPC found, show NPC name and allow interaction

**Interaction Types**:
- **Talk to NPC**: Press E when within range
- **Enter Building**: Press E when at door (automatically transitions)
- **Exit Building**: Press E at interior exit door

### Player Stats
- **Health**: Tracked but not heavily used (framework for combat)
- **Level**: Experience-based progression (not fully implemented)
- **Experience**: Gained from quests and interactions
- **Relationships**: Tracks relationship with each NPC (-100 to +100)

### Inventory (Framework)
- Structure exists for item management
- Not fully implemented in current version
- Quest rewards will expand this system

---

## NPC and AI Systems

### NPC Personality System

**Six Personality Dimensions** (0-100 scale):

1. **Aggression**: How likely to be hostile or confrontational
   - Low (0-33): Peaceful, avoids conflict
   - Medium (33-66): Balanced, stands up for self
   - High (66-100): Hostile, seeks conflict

2. **Friendliness**: How warm and welcoming
   - Low: Cold, distant, suspicious
   - Medium: Neutral, sociable with effort
   - High: Warm, welcoming, open

3. **Intelligence**: Problem-solving and knowledge
   - Low: Simple, straightforward thinking
   - Medium: Average reasoning ability
   - High: Clever, strategist, quick learner

4. **Caution**: Risk aversion and paranoia
   - Low: Impulsive, takes big risks
   - Medium: Balanced risk assessment
   - High: Paranoid, avoids risks

5. **Greed**: Materialism and self-interest
   - Low: Generous, shares resources
   - Medium: Fair trader, self-interested
   - High: Greedy, exploits for profit

6. **Honor**: Truthfulness and morality
   - Low: Deceitful, amoral
   - Medium: Situational ethics
   - High: Honorable, truthful, moral

### Personality Effects
- **Dialogue Tone**: Personality shapes how NPC speaks
- **Choice Generation**: Personality influences what NPC suggests
- **Behavior**: Personality determines schedule and activities
- **Relationships**: Personality affects what impresses/offends NPC
- **Memory**: Personality colors how NPC remembers events

### NPC Daily Schedules
NPCs follow time-based schedules with location and activity:

**Example Schedule (Mara - Tavern Owner)**:
```
5:00-8:00   rest          at Tavern back room
8:00-12:00  work          at Tavern counter
12:00-13:00 social        town square
13:00-17:00 work          at Tavern counter
17:00-19:00 social        tavern/eating area
19:00-22:00 patrol        tavern front
22:00-5:00  rest          tavern back room
```

**Schedule System**:
- NPCs automatically pathfind to scheduled location
- Perform scheduled activity when at location
- Schedule repeats daily
- Can be interrupted by player interaction
- Affects dialogue (working vs. resting moods)

### NPC Memory and Relationships

**Memory Types**:
- **Encounters**: Meetings with player
- **Dialogues**: Conversations and topics discussed
- **Events**: World events the NPC witnessed
- **Gifts**: Items received from player

**Memory Decay**:
- Retains memories for ~30 in-game days (configurable)
- Old memories gradually forgotten (less influence)
- Recent memories weighted higher
- Never fully deleted, just less relevant

**Relationship System**:
- **Range**: -100 (enemy) to +100 (best friend)
- **Effects**:
  - Affects dialogue friendliness
  - Influences choice generation (friendlier choices at +)
  - Affects gift acceptance
  - Influences quest assignment
- **Modification**:
  - Increased by kind dialogue choices
  - Decreased by hostile/insulting choices
  - Affected by gifts and actions
  - NPC emotional state influences changes

### NPC Emotional States
- **Happy**: Cheerful, optimistic, friendly
- **Angry**: Irritable, hostile, confrontational
- **Sad**: Melancholic, withdrawn, sympathetic
- **Suspicious**: Cautious, distrusting, paranoid
- **Neutral**: Balanced, default state

**Emotional Triggers**:
- Past dialogue outcomes
- Recent events
- Relationship level with player
- Time of day and weather
- Random variation for realism

### Pathfinding Algorithm
- **Type**: A* pathfinding for NPC movement
- **Cost**: ~1ms per NPC per frame (optimized)
- **Collision**: Uses game collision data
- **Performance**: Scales well with 20-50 NPCs
- **Regeneration**: Paths regenerated on load (not saved)

---

## Dialogue and Interaction

### Dialogue Generation Flow
1. **Player initiates**: Press E near NPC
2. **Ollama generation**: Async call to generate NPC response
3. **Display greeting**: Show NPC response with formatted text
4. **Auto-show choices**: After 300ms, generate and display 4 choices
5. **Player selects**: Choose from dialogue options
6. **Continue loop**: Generate next NPC response, repeat
7. **End dialogue**: Select farewell option or timeout

### Dialogue Context
Generated dialogues consider:
- **NPC Personality**: All 6 personality traits
- **Relationship Level**: How NPC feels about player
- **Emotional State**: Current mood/emotional state
- **Dialogue History**: Past conversations recorded
- **NPC Memories**: Player actions and past events
- **World Knowledge**: Facts from knowledge graph
- **NPC Motivations**: Current goals and desires

### Choice Generation
The Ollama LLM generates 4 contextual choices:
1. **Question/Information**: Seeking more information
2. **Emotional Reaction**: NPC reacting emotionally to player
3. **Conversation Redirect**: Changing topic
4. **Polite Exit/Farewell**: Ending conversation gracefully

**Auto-Show Mechanic**:
- Choices automatically display 300ms after NPC greeting
- No SPACE key required (removes friction)
- Full quality context generation during delay
- Feels natural and responsive

### Dialogue Display
```
┌─ NPC Name (Light Blue) ────────────────────┐
│ [NPC response text with proper wrapping]    │
│ [Multiple lines as needed]                  │
│                    [Auto-shown after 300ms]│
└────────────────────────────────────────────┘

Your Response: [Bottom-left box with choices]
┌─────────────────────────────────────────────┐
│ ► Choice 1 (highlighted if selected)        │
├─────────────────────────────────────────────┤
│   Choice 2                                  │
├─────────────────────────────────────────────┤
│   Choice 3                                  │
├─────────────────────────────────────────────┤
│   Choice 4 (often farewell/exit)            │
└─────────────────────────────────────────────┘
```

### Text Wrapping
- **Word-based wrapping**: Splits on word boundaries (no mid-word breaks)
- **Dynamic height**: Choice boxes expand with wrapped text
- **Box positioning**: Bottom-left of screen (320px wide)
- **Readable**: Ensures no text goes off-screen

### Fallback System
**If Ollama unavailable**:
1. Generic response used (NPC personality considered)
2. Generic choice set returned
3. Game continues without blocking
4. Debug info shows fallback used

**If parsing fails**:
1. Retry with stricter prompt format
2. If retry fails, use hardcoded fallback choices
3. Still considers NPC personality for tone

### Farewell Mechanic
- **Trigger**: Player selects farewell option
- **Display**: NPC's final response
- **Duration**: Auto-closes after 3 seconds
- **Return**: Game resumes normal gameplay

### Conversation History
```
┌─ Dialogue History ─────────────────────────┐
│ [Previous NPC response]                    │
│                                            │
│ [You] → [Your previous choice]            │
│                                            │
│ [NPC response to your choice]              │
│                                            │
│ [You] → [Your most recent choice]         │
│                                            │
│ [Current NPC response showing...]          │
└────────────────────────────────────────────┘
```

- **Color-coded**: Player (light blue), NPCs (light green)
- **Scrollable**: UP/DOWN or mouse wheel
- **Visible during choices**: Can read history while selecting response
- **Full conversation**: Shows entire dialogue exchange

---

## UI and Controls

### Screen Layout
- **Default Resolution**: 1280x720 pixels (configurable)
- **Aspect Ratio**: 16:9 widescreen

**Layout Zones**:
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              GAME WORLD RENDERING                   │ (0-580px height)
│         (Map, NPCs, player, effects)                │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [HUD: Status]    [Dialogue Box / Quest Log / Menu] │ (580-720px height)
│ HP: 100/100      or Dialogue Choices               │
│ Level: 5         or other UI elements              │
└─────────────────────────────────────────────────────┘
```

### HUD Elements

**Status Bar** (Bottom-left, always visible):
- Player name, current health, level
- Format: `[Name] | HP: [current]/[max] | Level: [level]`
- Font: 24pt white
- Updated every frame

**FPS Counter** (Top-left, debug mode only):
- Current frames per second (locked at 60)
- Additional info: position, map, NPC count, world time, weather
- Toggle with F12 key
- Green text when enabled

### Menu System

**Main Menu**:
- Appears on startup or when accessing from gameplay
- Centered on screen
- Shows title, LLM info, menu items
- Items: New Game, Load Game, Save Game, Settings, Debug, LLM Menu, Quit

**Pause Menu**:
- Triggered by ESC during gameplay
- Shows "PAUSED" title instead of main menu title
- First item becomes "Resume Game" instead of "New Game"
- Same navigation as main menu

**Sub-Menus**:
- Settings: Game configuration (not heavily used)
- Save/Load: 10 save slots with file management
- Debug Helpers: Real-time stats, spawning, testing
- LLM Menu: Configure Ollama server and model selection

**Menu Navigation**:
- Keyboard: UP/DOWN arrows or W/S to navigate, SPACE/ENTER to select
- Mouse: Hover to highlight, click to select
- ESC: Return to previous menu or close
- One-time key detection prevents accidental multiple selections

### Control Mapping

**Movement**:
| Action | Keys |
|--------|------|
| Move Up | W or ↑ |
| Move Down | S or ↓ |
| Move Left | A or ← |
| Move Right | D or → |

**Interaction**:
| Action | Keys | Notes |
|--------|------|-------|
| Interact/Talk | E, SPACE, ENTER | Talk to NPC, confirm dialogue |
| Navigate Menus | UP/DOWN, W/S, Mouse | Select menu items |
| Select Menu Item | SPACE, ENTER, Click | Confirm selection |
| Go Back | ESC | Return to previous menu |

**Dialogue**:
| Action | Keys | Notes |
|--------|------|-------|
| Select Choice | UP/DOWN arrows or Click | Navigate dialogue options |
| Confirm Choice | SPACE, ENTER, or Click | Confirm selection |
| Scroll History | UP/DOWN, W/S, Mouse Wheel | Review conversation |

**Game Controls**:
| Action | Key | Notes |
|--------|-----|-------|
| Pause Menu | ESC | Opens menu (pauses game) |
| Simple Pause | P | Pauses game without menu |
| Quest Log | I | Shows quest information |
| Debug Info | F12 | Toggles FPS and debug info |
| Map | M | Configured but not implemented |

### Input Routing Logic
```
EVENT RECEIVED
│
├─ LLM Menu Visible?
│  └─ YES → Route to LLM menu (independent, top priority)
│
├─ Main Menu Visible?
│  └─ YES → Route to main menu handler
│
├─ Any Submenu Visible? (Settings, Save/Load, Debug)
│  └─ YES → Route to submenu handler
│
├─ Dialogue Active?
│  ├─ ESC → Show pause menu
│  └─ UP/DOWN/SPACE → Navigate/select dialogue choices
│
└─ Gameplay (No menus)?
   ├─ WASD → Move player
   ├─ E/SPACE → Interact with NPC/door
   ├─ I → Open quest log
   ├─ ESC → Open pause menu
   └─ F12 → Toggle debug display
```

### Mouse Support
- **Menu Hovering**: Highlight menu items on mouse over
- **Menu Clicking**: Click to select menu items
- **Dialogue Choices**: Click directly on dialogue choice to select
- **Dialogue History**: Mouse wheel to scroll conversation
- **Mixed Input**: Can freely mix keyboard and mouse input

---

## Persistence and Saving

### Save System Overview
- **Directory**: `./saves/` (auto-created)
- **Files**: `save_slot_0.json` through `save_slot_9.json`
- **Format**: Human-readable JSON
- **Size**: 5-100 KB typical per save
- **Version Tracking**: Includes version number for compatibility

### Save File Contents

**Metadata**:
- Save date and time
- Character name and level
- Current location name
- Total playtime in seconds
- Save version number

**Player State**:
- Position (x, y coordinates)
- Health and max health
- Level and experience
- Current map/location
- Camera position

**NPC State**:
- Each NPC position (x, y)
- NPC health and level
- Personality traits (all 6)
- Relationship level with player
- Emotional state
- Current activity
- Position in daily schedule

**Dialogue History**:
- Per-NPC conversation logs
- Time of conversation
- Player choices and NPC responses
- Emotional context

**Memories**:
- All NPC memories of player
- Event memories
- Gift history
- Time stamps for decay calculation

**Quest State**:
- All quests with status
- Completed quests
- Available quests
- Progress on active quests
- Quest rewards

**World State**:
- Current in-game time (hour, minute, day)
- Weather condition
- Map ID
- Location type (interior/exterior)

**Knowledge Graph**:
- All facts and relationships
- Confidence levels
- Sources of knowledge

### Save Operations

**Saving**:
1. User selects "Save Game" from pause menu
2. Choose save slot (0-9)
3. Current save backed up (if exists)
4. New save file created with JSON serialization
5. Game state fully persisted to disk
6. Menu closes, game resumes

**Loading**:
1. User selects "Load Game" from main menu or pause menu
2. Choose save slot to load
3. All systems reconstructed:
   - Player position and stats
   - NPCs respawned with remembered state
   - Quest state restored
   - Memories reactivated
   - Time and weather reset
   - Camera repositioned
4. Game resumes at saved point

### What Gets Saved vs. Generated

**Saved**:
- ✓ Player position and stats
- ✓ NPC positions and states
- ✓ Personality traits
- ✓ Relationships and emotional state
- ✓ Dialogue history
- ✓ Memories with timestamps
- ✓ Quest progress
- ✓ World time and weather
- ✓ Knowledge graph
- ✓ Camera position

**Generated (Not Saved)**:
- ✗ NPC pathfinding paths (regenerated from collision)
- ✗ Active dialogue state (resets)
- ✗ Async loading state (resets)
- ✗ Personality traits use same seed (deterministic)

---

## Configuration and Modding

### Game Settings File (game_settings.json)

```json
{
  "game": {
    "width": 1280,
    "height": 720,
    "fps": 60,
    "debug": false
  },
  "ollama": {
    "enabled": true,
    "host": "http://localhost:11434",
    "model": "mistral",
    "timeout": 30,
    "temperature": 0.7
  },
  "npc": {
    "max_npcs": 50,
    "memory_retention_days": 30
  },
  "world": {
    "time_scale": 1.0,
    "day_length": 3600,
    "starting_hour": 8
  }
}
```

**Configuration Options**:

| Setting | Type | Purpose |
|---------|------|---------|
| game.width | int | Screen width in pixels |
| game.height | int | Screen height in pixels |
| game.fps | int | Target frame rate |
| game.debug | bool | Enable debug mode on startup |
| ollama.enabled | bool | Enable LLM features |
| ollama.host | string | Ollama server URL |
| ollama.model | string | Default model name |
| ollama.timeout | int | Dialogue generation timeout (seconds) |
| ollama.temperature | float | LLM creativity (0.0-1.0) |
| npc.max_npcs | int | Maximum concurrent NPCs |
| npc.memory_retention_days | int | How long NPCs remember (days) |
| world.time_scale | float | Speed of time (1.0 = normal) |
| world.day_length | int | Seconds per full day cycle |
| world.starting_hour | int | Starting hour (0-23) |

### Modding Points

**1. Adding New NPCs**
```python
# Spawn NPC
npc = npc_manager.spawn_npc("New Name", x, y, "archetype")
npc.set_pathfinder(game.pathfinder)

# Register with AI controller
ai_controller.add_npc(npc.npc_id)

# Set daily schedule
schedule = [
    ("5:00", "8:00", "rest", "home"),
    ("8:00", "17:00", "work", "job_location"),
    ("17:00", "22:00", "social", "tavern"),
    ("22:00", "5:00", "rest", "home"),
]
ai_controller.set_schedule(npc.npc_id, schedule)
```

**2. Adding New Quests**
```python
quest = game.quest_manager.create_quest(
    title="Quest Title",
    description="Quest description",
    quest_type=QuestType.DELIVERY,
    giver_npc_id="npc_id",
    objectives=["Deliver item to X", "Return to giver"],
    reward=QuestReward(experience=100, gold=50)
)
```

**3. Adding World Knowledge**
```python
game.knowledge_graph.add_knowledge(
    subject="Millbrook",
    relation="is_peaceful",
    object="town",
    confidence=0.9,
    source="exploration"
)
```

**4. Custom Dialogue Generation**
```python
response = game.dialogue_manager.generate_dialogue(
    npc_name="NPC Name",
    personality=npc.personality,
    context="Situation context",
    npc_id=npc.npc_id,
    relationship_level=relationship
)
```

**5. Custom Events**
```python
event = GameEvent(
    event_type="npc_arrival",
    description="NPC arrives in town",
    trigger_condition=lambda: world_state.hour == 10,
    action=lambda: npc_manager.spawn_npc(...)
)
game_master.add_event(event)
```

### Extending Save/Load System
```python
# Add custom serializer for new entity type
class CustomEntitySerializer(Serializer):
    def serialize(self, entity):
        return {
            "id": entity.id,
            "custom_data": entity.custom_property,
        }

    def deserialize(self, data):
        return CustomEntity(data["id"], data["custom_data"])

# Register serializer
save_manager.register_serializer(CustomEntity, CustomEntitySerializer())
```

---

## Key Design Decisions and Rationale

### 1. Ollama for Local LLM Integration
- **Why**: Offline capability, no API keys, full control over responses, privacy
- **Cost**: ~1-5 seconds per dialogue generation
- **Fallback**: Generic responses if unavailable
- **Trade-off**: Slower dialogue but more immersive and controllable

### 2. Event-Based Input (One-Time Key Press)
- **Why**: Prevents accidental multiple toggles from single key hold
- **Implementation**: Check KEYDOWN events, not frame-based state
- **Benefit**: Robust pause menu that won't get stuck
- **Trade-off**: Slightly more complex event routing

### 3. 300ms Auto-Show for Dialogue Choices
- **Why**: Remove friction of SPACE requirement, feels more natural
- **Implementation**: Timer in DialogueManager updates each frame
- **Benefit**: Smoother dialogue flow, responsive feel
- **Trade-off**: Slight delay before choices appear (imperceptible to player)

### 4. Text Wrapping with Dynamic Heights
- **Why**: Prevent dialogue choices from going off-screen
- **Implementation**: Word-by-word wrapping in choice rendering
- **Benefit**: All text readable regardless of length
- **Trade-off**: More complex layout calculation

### 5. Pause Menu with Resume Option
- **Why**: Easy return to gameplay without navigating menus
- **Implementation**: `is_pause_menu` flag changes menu display
- **Benefit**: Single ESC to pause, another ESC or Resume button to unpause
- **Trade-off**: Two different menu modes to manage

### 6. Async Dialogue Loading
- **Why**: Non-blocking generation while player continues gameplay
- **Implementation**: Separate thread, checked each frame
- **Benefit**: Game stays responsive, no stutters
- **Trade-off**: Loading indicator needed, may create confusion

### 7. Personality-Driven Dialogue
- **Why**: NPC responses feel consistent and reactive
- **Implementation**: 6-trait system influences context sent to LLM
- **Benefit**: Characters feel unique and believable
- **Trade-off**: Need good personality generation and prompt engineering

### 8. Daily Schedules for NPCs
- **Why**: World feels alive, NPCs have purpose and consistency
- **Implementation**: Time-based schedule with location and activity
- **Benefit**: Predictable NPC locations, encourages exploration
- **Trade-off**: NPCs less flexible, may feel scripted

### 9. Full Persistent Save/Load
- **Why**: Players can experiment with dialogue and reload
- **Implementation**: Complete JSON serialization of all state
- **Benefit**: True save-scumming capability, high player agency
- **Trade-off**: Saves are fairly large (5-100KB), many serialization points

### 10. Knowledge Graph for World Facts
- **Why**: Share information between NPCs consistently
- **Implementation**: Triple-based semantic graph
- **Benefit**: Believable world where NPCs reference shared knowledge
- **Trade-off**: More data to track and serialize

---

## Performance Targets and Optimization

### Frame Budget (60 FPS = 16.67ms per frame)
- **Input**: 0.5ms
- **Update**: 5-8ms
- **Render**: 6-10ms
- **Headroom**: 2-5ms buffer

### Performance Notes
- **NPC Pathfinding**: ~1ms per NPC per frame (optimized A*)
- **Dialogue Generation**: Async (non-blocking), ~1-5 seconds
- **Memory System**: ~0.1ms per update
- **Rendering**: ~6-10ms including all systems
- **Scalability**: Tested with 20-50 NPCs effectively

### Optimization Strategies
1. **Async Dialogue**: Non-blocking LLM calls
2. **Efficient Pathfinding**: A* with optimization
3. **Viewport Culling**: Only render visible entities
4. **Memory Decay**: Old memories less relevant, reduce processing
5. **Lazy Loading**: Load dialogue only when needed

---

## Future Expansion Ideas

### Combat System
- Health/damage mechanics
- Combat AI for NPCs
- Inventory weapons
- Enemy NPCs

### Expanded Quests
- Chain quests with prerequisites
- Dynamic quest generation
- Reputation system
- Quest consequences

### Magic/Abilities
- Spell system
- Skill trees
- Ability learning from NPCs
- Magic item crafting

### More Locations
- Multiple towns/cities
- Dungeons and caves
- Weather-affected areas
- Seasonal changes

### Multiplayer (Optional)
- Network synchronization
- Shared world state
- Player-to-NPC interaction
- Emergent PvP systems

### Advanced AI
- NPC factions and politics
- Territorial behavior
- NPC-to-NPC relationships
- Emergent conflicts

### Graphical Enhancements
- Animated sprites
- Weather effects
- Particle systems
- UI animations

---

## Getting Started for New Development

### 1. Understand the Architecture
- Read this document thoroughly
- Examine `src/core/game.py` for main loop
- Review `src/npc/npc.py` for NPC entity structure
- Look at `src/ui/ui_manager.py` for UI coordination

### 2. Set Up Development Environment
```bash
# Install dependencies
pip install pygame ollama

# Run the game
python main.py

# Run tests
python -m pytest tests/
```

### 3. Key Files to Understand First
1. `src/core/game.py` - Main game orchestrator
2. `src/ui/ui_manager.py` - UI system coordinator
3. `src/npc/npc_manager.py` - NPC management
4. `src/npc/dialogue_manager.py` - Dialogue generation
5. `src/utils/config.py` - Configuration loading

### 4. Development Workflow
- Use debug mode (F12) to see real-time info
- Use Debug Helpers menu to spawn NPCs and test
- Save/load frequently during development
- Check game_settings.json for quick config changes
- Write tests for new systems

### 5. Common Modifications
- **Add NPC**: Edit spawn code in game.py, add to ai_controller
- **Change Schedule**: Modify schedule lists in ai_controller.py
- **Adjust Dialogue**: Modify ollama_client.py prompts
- **Add Quest**: Create new quest in quest_system.py
- **Change UI**: Modify corresponding UI class

---

## Summary

The Ollama RPG is a modular, extensible framework for creating AI-driven RPGs. Key strengths:

✅ **AI-Powered NPCs**: Real dialogue generation with personality
✅ **Rich Systems**: Memory, scheduling, relationships, knowledge graph
✅ **Modular Design**: Easy to extend and customize
✅ **Persistent World**: Full save/load with all state preservation
✅ **Flexible Input**: Keyboard and mouse support
✅ **Performance**: Optimized for 60 FPS with many NPCs
✅ **Developer-Friendly**: Clear separation of concerns, well-documented

Whether building upon this foundation or starting fresh with these concepts, the architecture provides a solid base for emergent, AI-driven storytelling and gameplay.
