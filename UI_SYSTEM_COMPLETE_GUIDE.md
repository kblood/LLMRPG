# Complete UI System Guide - How Everything Works

**Last Updated**: 2025-11-22

---

## Table of Contents

1. [Application Startup](#application-startup)
2. [Layout Architecture](#layout-architecture)
3. [Panel System](#panel-system)
4. [Mode Selection Flow](#mode-selection-flow)
5. [Autonomous Mode Event Flow](#autonomous-mode-event-flow)
6. [Event Log System](#event-log-system)
7. [Manual Mode Flow](#manual-mode-flow)
8. [Data Flow Diagrams](#data-flow-diagrams)

---

## Application Startup

### Initial Load Sequence

When the user launches the application, this sequence happens:

```
HTML Load
  ↓
DOMContentLoaded event fires
  ↓
OllamaRPGApp class instantiated
  ↓
app.init() called
  ↓
[See detailed init() flow below]
```

### init() Method Execution Order (app.js lines 15-52)

```
1. setupEventListeners()
   └─ Manual mode button/input handlers

2. setupAutonomousListeners()
   └─ Register all autonomous event listeners

3. Show loading screen: "Checking Ollama service..."

4. checkOllama()
   └─ Retry up to 3 times, 2-second delays
   └─ Update status bar: "Ollama: Connected ✓" or "Ollama: Disconnected ✗"

5. Show loading screen: "Initializing game world..."

6. gameAPI.init({ seed, playerName })
   └─ IPC call to backend
   └─ Backend generates world, NPCs, initial state

7. loadGameData()
   └─ Fetch NPCs via gameAPI.getNPCs()
   └─ Display in sidebar NPC list
   └─ Update NPC count in welcome panel

8. showGameScreen()
   └─ Hide loading screen
   └─ Show game screen with header, sidebar, welcome panel
```

### What User Sees During Startup

| Time | Screen | Status |
|------|--------|--------|
| T=0s | Black screen | Application launching |
| T=0.5s | Loading screen | "Initializing game..." with spinner |
| T=1-3s | Loading screen | "Checking Ollama service..." |
| T=3-5s | Loading screen | "Initializing game world..." |
| T=5-7s | Game screen | Header, sidebar, welcome panel visible |
| T=7+ | Fully loaded | Ready to select game mode |

---

## Layout Architecture

### Screen Layout (Visual)

```
┌──────────────────────────────────────────────────────────────────┐
│  Header: OllamaRPG | Session: XXX | Time: 14:32 | Evening        │
├──────────────┬───────────────────────────────────────────────────┤
│              │                                                     │
│  Sidebar     │           Dialogue Area                            │
│  (300px)     │           (flex: 1)                                │
│              │                                                     │
│ • Player     │  ┌─────────────────────────────────────────────┐  │
│   Stats      │  │  Welcome Panel                              │  │
│              │  │  ┌────────────────────────────────────────┐ │  │
│ • Inventory  │  │  │ 🏰 OllamaRPG Adventure 🏰            │ │  │
│   0/20 slots │  │  │                                         │ │  │
│              │  │  │ [Play Manually]  [Watch AI Play]       │ │  │
│ • Characters │  │  │                                         │ │  │
│   10 NPCs    │  │  │ NPCs: 10 | Conversations: 0 | Mode:... │ │  │
│              │  │  └────────────────────────────────────────┘ │  │
│ • Quests     │  │                                              │  │
│   No quests  │  │ (OR)                                         │  │
│              │  │                                              │  │
│ • World Map  │  │ Conversation Panel (when mode active)        │  │
│   Cities     │  │ ┌────────────────────────────────────────┐ │  │
│   Dungeons   │  │ │ NPC: Mara | Role: Tavern Keeper | ❤️  │ │  │
│   Landmarks  │  │ ├────────────────────────────────────────┤ │  │
│              │  │ │ 📖 Chronicler narration (hidden in    │ │  │
│              │  │ │    autonomous mode)                    │ │  │
│              │  │ ├────────────────────────────────────────┤ │  │
│              │  │ │  Dialogue History / Event Log:         │ │  │
│              │  │ │  ⚔ Quest Received: Main Quest         │ │  │
│              │  │ │  🤔 Deciding: Talk to tavern keeper   │ │  │
│              │  │ │  💬 Starting conversation with Mara   │ │  │
│              │  │ │  [Kael]: "Hello Mara!"                │ │  │
│              │  │ │  [Mara]: "Welcome, traveler..."       │ │  │
│              │  │ │  [Kael]: "Any news?"                  │ │  │
│              │  │ │  [Mara]: "Strange things..."          │ │  │
│              │  │ │  ─── Conversation ended (2 turns) ─── │ │  │
│              │  │ │  📖 The tavern grows quiet...         │ │  │
│              │  │ │  🤔 Deciding: Leave tavern            │ │  │
│              │  │ │                                        │ │  │
│              │  │ │ ⏹️ Stop Autonomous Mode  (button)     │ │  │
│              │  │ └────────────────────────────────────────┘ │  │
│              │  └─────────────────────────────────────────────┘  │
└──────────────┴───────────────────────────────────────────────────┘
│ Status: Watching conversation with Mara | Ollama: Connected ✓  │
└────────────────────────────────────────────────────────────────────┘
```

### CSS Structure (styles.css)

```css
/* Main container - fixed size, flex layout */
.container {
  display: flex;
  height: 100vh;  /* Full viewport height */
}

/* Header - always visible at top */
.game-header {
  height: 60px;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
}

/* Main content area - sidebar + dialogue area */
.main-content {
  display: flex;
  flex: 1;  /* Takes all remaining space after header */
  min-height: 0;  /* Important for flex column children */
}

/* Sidebar - fixed width, scrollable */
.sidebar {
  width: 300px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Dialogue area - takes remaining space */
.dialogue-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Status bar - always visible at bottom */
.status-bar {
  height: 40px;
  padding: 0 1.5rem;
  display: flex;
  border-top: 1px solid var(--border-color);
}
```

### Responsive Behavior

| Screen Size | Sidebar | Dialogue Area | Behavior |
|------------|---------|---------------|----------|
| Large | 300px (visible) | Full remaining width | Normal layout |
| Medium | 250px | Full remaining width | Slightly compressed |
| Mobile | Hidden | Full width | Hamburger menu (if implemented) |

---

## Panel System

### Five Main Panels

All panels exist in the DOM at all times. Visibility is controlled by adding/removing the `hidden` class.

#### 1. **Loading Screen** (id="loading-screen")

**Visibility**: Shown during app initialization, hidden when ready

**Content**:
- Game title: "⚔️ OllamaRPG ⚔️"
- Subtitle: "AI-Powered Dialogue Adventure"
- Animated spinner (CSS animation, 360° rotation)
- Dynamic status text

**Styling**:
```css
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0a1428 0%, #1a2a4a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;  /* On top of everything */
}
```

**State Transitions**:
- Initial: Not hidden
- After loadGameData(): Add 'hidden' class

---

#### 2. **Welcome Panel** (id="welcome-panel")

**Visibility**: Shown initially, hidden when mode starts, shown again when mode stops

**Content**:
- Title: "🏰 OllamaRPG - AI-Powered Adventure 🏰"
- Welcome text explaining modes
- Grid with two buttons:
  - "🕹️ Play Manually" button
  - "🤖 Watch AI Play" button
- Utility controls:
  - "📼 View Replays" button
- Stats preview:
  - NPCs Available: [count]
  - Conversations: [count]
  - Mode: [status]

**Location**: Centered in dialogue area

**HTML Structure**:
```html
<div id="welcome-panel" class="welcome-panel">
  <div class="welcome-content">
    <h2>🏰 OllamaRPG - AI-Powered Adventure 🏰</h2>

    <div class="mode-selector">
      <div class="mode-option">
        <h3>🕹️ Manual Mode</h3>
        <p>You control the protagonist...</p>
        <button id="start-manual-btn">Play Manually</button>
      </div>
      <div class="mode-option">
        <h3>🤖 Autonomous Mode</h3>
        <p>Watch AI characters interact...</p>
        <button id="start-autonomous-btn">Watch AI Play</button>
      </div>
    </div>

    <div class="utility-controls">
      <button id="view-replays-btn">📼 View Replays</button>
    </div>

    <div class="stats-preview">
      <div class="stat-item">
        <span class="stat-label">NPCs Available:</span>
        <span class="stat-value" id="npc-count">10</span>
      </div>
      <!-- ... more stats ... -->
    </div>
  </div>
</div>
```

**State Transitions**:
- Initial: Visible (not hidden)
- When mode starts: Add 'hidden' class
- When mode stops: Remove 'hidden' class

---

#### 3. **Conversation Panel** (id="conversation-panel")

**Visibility**: Hidden initially, shown when mode starts, hidden when mode stops

**Content**:
- Conversation header with NPC info
- GM narration box (hidden in autonomous mode)
- Dialogue history / Event log (main content area)
- Autonomous mode controls (hidden in manual mode)
- Manual mode input area (hidden in autonomous mode)

**Sections**:

```html
<div id="conversation-panel" class="conversation-panel hidden">

  <!-- Header: NPC Info -->
  <div class="conversation-header">
    <div class="npc-info">
      <span class="npc-name" id="current-npc-name">Character Name</span>
      <span class="npc-role" id="current-npc-role">Role</span>
    </div>
    <div class="relationship-badge">
      <span class="relationship-label">Relationship:</span>
      <span class="relationship-value" id="relationship-value">0</span>
      <span class="relationship-status" id="relationship-status">Neutral</span>
    </div>
    <button id="end-conversation-btn">End Conversation</button>
  </div>

  <!-- GM Narration (hidden in autonomous, shown in manual) -->
  <div id="gm-narration" class="gm-narration gm-narration-manual-only">
    <!-- Updates with narration text -->
  </div>

  <!-- Dialogue History / Event Log (main scrollable area) -->
  <div id="dialogue-history" class="dialogue-history">
    <!-- Messages and events accumulate here -->
  </div>

  <!-- Autonomous Mode Controls -->
  <div id="autonomous-conversation-controls" class="autonomous-conversation-controls hidden">
    <button id="stop-conversation-btn">⏹️ Stop Autonomous Mode</button>
    <span class="autonomous-status" id="autonomous-status">AI characters are conversing...</span>
  </div>

  <!-- Manual Mode Input -->
  <div id="manual-input-area" class="input-area hidden">
    <textarea id="message-input" placeholder="What do you want to say?" rows="2"></textarea>
    <button id="send-message-btn">Send</button>
  </div>

</div>
```

**Key Styling**:
```css
.conversation-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  min-height: 0;  /* Allow flex children to properly size */
}

/* Dialogue history takes up most space */
.dialogue-history {
  flex: 1;
  overflow-y: auto;  /* Scrollable */
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 0;
}
```

**State Transitions**:
- Initial: Hidden
- When mode starts: Remove 'hidden' class
- When mode stops: Add 'hidden' class

---

#### 4. **Replay Panel** (id="replay-panel")

**Visibility**: Hidden initially, shown when user clicks "View Replays"

**Content**:
- Replay list (saved replay files with dates/stats)
- Replay playback controls (when replay selected)
- Playback view (timeline, frame scrubber, event display)

**State Transitions**:
- Initial: Hidden
- When "View Replays" clicked: Remove 'hidden' class
- When user closes replay: Add 'hidden' class

---

#### 5. **Sidebar Panels** (Always visible when game screen shown)

Multiple collapsible panels in the sidebar:

**a) Player Panel** (id="player-panel", class="player-panel")
- Hidden initially, shown when mode starts
- Shows: Level, Gold, HP/Stamina/Magic bars, XP bar

**b) Inventory Panel** (class="inventory-panel")
- Always visible
- Shows: Slots (0/20), Weight (0/100)
- Lists items

**c) Characters Panel** (class="npc-panel")
- Always visible
- Lists NPCs
- In manual mode: clickable to start conversation
- In autonomous mode: non-clickable

**d) Quests Panel** (class="quests-panel")
- Always visible
- Initially shows "No active quests"
- When quest received: shows title, description, objectives
- Updates when quest status changes

**e) World Panel** (class="world-panel")
- Always visible
- Initially empty ("Exploring...")
- When autonomous mode starts: populated with world data
- Shows cities, dungeons, landmarks
- Color-coded by danger level (green, gold, orange, red)

---

## Mode Selection Flow

### Two Mutually Exclusive Modes

```
┌─────────────────────────────────────────────────────────┐
│                   Game Mode Selection                   │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Manual Mode                        Autonomous Mode      │
│  ────────────                       ────────────────     │
│  • User controls protagonist         • AI controls       │
│  • Player makes all decisions        • AI makes decisions│
│  • Input: Text message to NPCs       • Input: Stop button│
│  • NPCs respond via LLM              • Everything auto   │
│  • Single conversation at a time     • Continuous action │
│  • Player panel visible              • Player panel stats │
│  • GM narration box shown            • All narration →   │
│    (context for decisions)             event log         │
│  • NPC cards clickable               • NPC cards static  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### Manual Mode Setup

When user clicks "Play Manually":

```javascript
startManualMode() {
  this.manualMode = true;

  // Update UI
  document.getElementById('welcome-panel').classList.add('hidden');
  document.getElementById('conversation-panel').classList.remove('hidden');
  document.getElementById('player-panel').classList.remove('hidden');

  document.getElementById('manual-input-area').classList.remove('hidden');
  document.getElementById('autonomous-conversation-controls').classList.add('hidden');

  // Set up event listeners
  // - NPC card clicks
  // - Send button clicks
  // - Enter key in input

  // Load and display player stats
  this.loadPlayerStats();

  // Welcome message
  document.getElementById('gm-narration').textContent =
    'Welcome, adventurer! Click on any character to start a conversation.';
}
```

**UI Changes**:
- Welcome panel → hidden
- Conversation panel → visible
- GM narration visible (context for player)
- Manual input area visible
- Autonomous controls hidden
- Player panel visible
- NPC cards clickable

---

### Autonomous Mode Setup

When user clicks "Watch AI Play":

```javascript
async startAutonomousMode() {
  this.autonomousMode = true;

  // Call backend to start autonomous loop
  const result = await this.gameAPI.startAutonomous();

  // Update UI
  document.getElementById('welcome-panel').classList.add('hidden');
  document.getElementById('conversation-panel').classList.remove('hidden');
  document.getElementById('player-panel').classList.remove('hidden');

  document.getElementById('mode-status').textContent = 'Running';

  // All event listeners already set up in setupAutonomousListeners()
  // Backend will now emit events that trigger these listeners
}
```

**UI Changes**:
- Welcome panel → hidden
- Conversation panel → visible
- Player panel visible (stats only, not interactive)
- Manual input area hidden
- Autonomous controls visible
- NPC cards non-clickable
- Status updates as events arrive

---

## Autonomous Mode Event Flow

### Event Sequence During Autonomous Gameplay

```
Backend: startAutonomous() called
  ↓
Backend: Generate world
  ↓ IPC: "autonomous:world-generated"
Frontend: setupAutonomousListeners() → onWorldGenerated()
  └─ displayWorld(): Populate sidebar world panel
  ↓
Backend: Generate opening narration
  ↓ IPC: "autonomous:opening-narration"
Frontend: onOpeningNarration()
  └─ showOpeningNarration(): Large narration display
  └─ Welcome panel → hidden
  └─ Conversation panel → visible
  ↓
Backend: Generate main quest
  ↓ IPC: "autonomous:main-quest"
Frontend: onMainQuest()
  └─ showMainQuest(): Add quest to event log and sidebar
  ↓
Backend: Action/conversation/combat loop
  ↓ Multiple IPC events in sequence:
  ├─ "autonomous:action-decision"
  ├─ "autonomous:action"
  ├─ "autonomous:conversation-start"
  ├─ "autonomous:message" (multiple)
  ├─ "autonomous:conversation-end"
  ├─ "autonomous:action-result"
  ├─ "autonomous:combat-encounter"
  ├─ "autonomous:combat-result"
  ├─ "autonomous:chronicler"
  └─ "autonomous:transition"
  ↓
Frontend: Corresponding listener for each event
  └─ Update UI with new event
  ↓
Repeat until user clicks "Stop Autonomous Mode"
```

### Event Types and Their UI Effects

| Event | Handler | UI Effect |
|-------|---------|-----------|
| `autonomous:world-generated` | `onWorldGenerated()` | Populate world panel |
| `autonomous:opening-narration` | `onOpeningNarration()` | Large narration, show conversation panel |
| `autonomous:main-quest` | `onMainQuest()` | Add quest to event log and sidebar |
| `autonomous:action-decision` | `onAutonomousActionDecision()` | Blue event: "🤔 Deciding..." |
| `autonomous:action` | `onAutonomousAction()` | Green event or status update |
| `autonomous:conversation-start` | `onAutonomousConversationStart()` | Purple event, show NPC info |
| `autonomous:message` | `onAutonomousMessage()` | Add message to dialogue history |
| `autonomous:conversation-end` | `onAutonomousConversationEnd()` | Gray separator, preserve history |
| `autonomous:action-result` | `onAutonomousActionResult()` | Brown event with narrative |
| `autonomous:combat-encounter` | `onAutonomousCombatEncounter()` | Red event, combat started |
| `autonomous:combat-result` | `onAutonomousCombatResult()` | Orange event, combat result |
| `autonomous:chronicler` | `onAutonomousChronicler()` | Pink italic event with narration |
| `autonomous:transition` | `onTransition()` | Teal centered event, scene change |
| `autonomous:error` | `onAutonomousError()` | Error status in status bar |

---

## Event Log System

### What Is the Event Log?

The event log is the `dialogue-history` element. It's a single scrollable div that accumulates all events chronologically. Nothing is ever cleared (in autonomous mode).

### Event Types and Colors

```css
/* Action Decision - Blue tint */
.event-action-decision {
  background: rgba(100, 150, 255, 0.1);
  border-left: 4px solid #6496ff;
  color: #7fa3ff;
}

/* Action - Green tint */
.event-action {
  background: rgba(100, 200, 150, 0.1);
  border-left: 4px solid #64c896;
  color: #7fd9a8;
}

/* Action Result - Orange tint */
.event-action-result {
  background: rgba(200, 150, 100, 0.1);
  border-left: 4px solid #c89664;
  color: #e8b87a;
}

/* Combat Encounter - Dark Red */
.event-combat-encounter {
  background: rgba(220, 80, 80, 0.1);
  border-left: 4px solid #dc5050;
  color: #ff7070;
  font-weight: 500;
}

/* Combat Result - Orange-Red */
.event-combat-result {
  background: rgba(220, 150, 80, 0.1);
  border-left: 4px solid #dc9650;
  color: #ffb070;
  font-weight: 500;
}

/* Reward - Yellow */
.event-reward {
  background: rgba(200, 200, 100, 0.1);
  border-left: 4px solid #c8c864;
  color: #e8e87a;
  font-weight: 500;
}

/* Conversation Start - Purple */
.event-conversation-start {
  background: rgba(150, 100, 200, 0.1);
  border-left: 4px solid #9664c8;
  color: #b87ae8;
  font-weight: 500;
}

/* Chronicler Narration - Pink/Red italic */
.event-chronicler {
  background: rgba(233, 69, 96, 0.15);
  border-left: 4px solid #e94560;
  color: #ff6b7a;
  font-style: italic;
  font-weight: 500;
}

/* Separators - Gray */
.event-separator {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  margin: 1rem 0 0.5rem 0;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border-color);
}
```

### Event Entry Creation

All events are added via `addEventToLog()`:

```javascript
addEventToLog(text, eventType = 'event') {
  const history = document.getElementById('dialogue-history');

  const eventEl = document.createElement('div');
  eventEl.className = `event-log-entry event-${eventType}`;
  eventEl.innerHTML = text;

  history.appendChild(eventEl);
  history.scrollTop = history.scrollHeight;  // Auto-scroll to bottom
}
```

### Example Event Log Flow

```
⚔ Quest Received
  [purple box with quest description]

🤔 Deciding: Investigate the tavern for rumors
  [blue box]

💬 Starting conversation with Mara
  [purple box]

[Kael]: "Hello Mara, any news from the region?"
  [message, right-aligned, blue text]

[Mara]: "Ah, welcome traveler. Strange things happening..."
  [message, left-aligned, green text]

[Kael]: "Like what?"
  [message, right-aligned]

[Mara]: "Whispers of ancient magic awakening..."
  [message, left-aligned]

─── Conversation ended (2 turns) ───
  [gray separator]

📖 The tavern grows quiet as you consider this information.
  [pink italic box - chronicler narration]

🤔 Deciding: Leave the tavern and travel north
  [blue box]

⚔️ Combat! Encountered Goblin Scout, Orc Warrior
  [dark red box]

📖 As you travel the forest path, enemies emerge!
  [pink italic box]

⚔️ After a fierce battle, you emerge victorious!
  [orange-red box]

💰 Combat victory! Gained 150 XP and 75 gold
  [yellow box]
```

### Why This Design?

1. **Continuous History**: Nothing is ever cleared, so users can scroll back and see everything that happened
2. **Visual Scanning**: Color-coded events let users quickly identify event types
3. **Chronological Order**: Events appear in the order they happened
4. **No Information Loss**: Every narrator comment is preserved
5. **Unified Log**: All events in one place instead of scattered across multiple boxes

---

## Manual Mode Flow

### Starting a Conversation

User clicks on an NPC card:

```javascript
startManualConversation(npcId) {
  // 1. Fetch NPC data
  const npc = this.world.npcs.find(n => n.id === npcId);

  // 2. Call backend to start conversation
  const result = await this.gameAPI.startConversation(npcId);

  // 3. Update UI
  document.getElementById('current-npc-name').textContent = npc.name;
  document.getElementById('current-npc-role').textContent = npc.role;
  document.getElementById('gm-narration').textContent = result.narration;

  // 4. Show narration (manual mode shows it separately)
  document.getElementById('gm-narration').classList.remove('hidden');

  // 5. Clear dialogue history for this conversation
  document.getElementById('dialogue-history').innerHTML = '';

  // 6. Store conversation ID
  this.currentConversationId = result.conversationId;
}
```

**UI Changes**:
- Conversation header updates with NPC name/role
- GM narration shows context for the conversation
- Dialogue history clears (manual mode doesn't accumulate like autonomous)
- Input area ready for user text

### Sending a Message

User types and sends message:

```javascript
async sendManualMessage() {
  const message = document.getElementById('message-input').value;

  if (!message.trim()) return;

  // 1. Add user message to history
  this.addMessageToHistory({
    speaker: 'player',
    speakerName: 'You',
    text: message
  });

  // 2. Clear input
  document.getElementById('message-input').value = '';

  // 3. Send to backend
  const response = await this.gameAPI.sendMessage(
    this.currentConversationId,
    message
  );

  // 4. Add NPC response to history
  this.addMessageToHistory({
    speaker: 'npc',
    speakerName: response.speaker,
    text: response.text
  });
}
```

**UI Changes**:
- User message appears in dialogue history (blue/pink background, right-aligned)
- Input field clears
- NPC response appears below (green background, left-aligned)
- Auto-scrolls to bottom

### Ending a Conversation

User clicks "End Conversation":

```javascript
async endManualConversation() {
  const result = await this.gameAPI.endConversation(
    this.currentConversationId
  );

  // Update status and clear
  this.setStatus('Conversation ended. Click on another character to continue.');
  document.getElementById('dialogue-history').innerHTML = '';
  document.getElementById('gm-narration').textContent =
    'The conversation ends. Click on another character to continue your adventure.';
}
```

**UI Changes**:
- Dialogue history clears (ready for next conversation)
- GM narration updates with end message
- User can click another NPC to start new conversation

---

## Data Flow Diagrams

### Complete Event Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Game Backend                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ GameEngine / GameMaster / AutonomousLoop               │   │
│  │ - Decides actions                                       │   │
│  │ - Manages conversations                                 │   │
│  │ - Handles combat                                        │   │
│  │ - Generates narration                                   │   │
│  └──┬───────────────────────────────────────────────────────┘   │
│     │                                                             │
│     └─ Emits events via _sendToUI()                              │
│        (IPC messages to renderer)                                │
└─────────────────────────────────────────────────────────────────┘
         │
         │ IPC Channel (Electron)
         │ "autonomous:action-decision"
         │ "autonomous:message"
         │ "autonomous:chronicler"
         │ etc.
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Preload Bridge                                │
│  (electron/preload.js)                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ onAutonomousActionDecision: (callback) => ...            │   │
│  │ onAutonomousMessage: (callback) => ...                   │   │
│  │ onAutonomousChronicler: (callback) => ...                │   │
│  │ ... 15+ more event listeners                             │   │
│  └──┬───────────────────────────────────────────────────────┘   │
│     │                                                             │
│     └─ Registers with ipcRenderer.on()                           │
│        Exposes as window.gameAPI methods                         │
└─────────────────────────────────────────────────────────────────┘
         │
         │ JavaScript callbacks
         │ gameAPI.onAutonomousChronicler((data) => {})
         │
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                      UI Controller                               │
│  (ui/app.js)                                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ setupAutonomousListeners()                               │   │
│  │ ├─ onWorldGenerated → displayWorld()                     │   │
│  │ ├─ onOpeningNarration → showOpeningNarration()           │   │
│  │ ├─ onMainQuest → showMainQuest()                         │   │
│  │ ├─ onAutonomousActionDecision → addEventToLog()          │   │
│  │ ├─ onAutonomousMessage → addMessageToHistory()           │   │
│  │ ├─ onAutonomousConversationStart → showConversationPanel()│  │
│  │ ├─ onAutonomousConversationEnd → [add separator]         │   │
│  │ ├─ onAutonomousCombatEncounter → [red event]            │   │
│  │ ├─ onAutonomousCombatResult → [orange event]            │   │
│  │ ├─ onAutonomousChronicler → addEventToLog()             │   │
│  │ ├─ onTransition → showTransition()                       │   │
│  │ └─ onAutonomousError → setStatus()                       │   │
│  └──┬───────────────────────────────────────────────────────┘   │
│     │                                                             │
│     └─ Calls DOM manipulation methods                            │
│        - addEventToLog()                                         │
│        - addMessageToHistory()                                   │
│        - updateQuestPanel()                                      │
│        - displayWorld()                                          │
│        - setStatus()                                             │
└─────────────────────────────────────────────────────────────────┘
         │
         │ DOM Updates
         │ document.getElementById().innerHTML = ...
         │ document.getElementById().appendChild()
         │ classList.add/remove()
         │
         ↓
┌─────────────────────────────────────────────────────────────────┐
│                         DOM Elements                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ dialogue-history                                         │   │
│  │ ├─ Event log entries (colored boxes)                     │   │
│  │ └─ Messages (dialogue)                                   │   │
│  │                                                           │   │
│  │ quest-list                                               │   │
│  │ ├─ Quest title, description, objectives                 │   │
│  │                                                           │   │
│  │ world-locations                                          │   │
│  │ ├─ Cities, dungeons, landmarks                           │   │
│  │                                                           │   │
│  │ status-text / mode-status / turns-count                  │   │
│  │ └─ Status bar updates                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓                                                         │
│    Browser renders                                              │
│         ↓                                                         │
│    User sees updated screen                                      │
└─────────────────────────────────────────────────────────────────┘
```

### State Transitions Diagram

```
                    ┌──────────────────┐
                    │   App Started     │
                    └────────┬──────────┘
                             │
                        init() called
                             │
                             ↓
                    ┌──────────────────┐
                    │ Loading Screen   │
                    │ "Checking Ollama"│
                    └────────┬──────────┘
                             │
                        [Wait 2-3s]
                             │
                             ↓
                    ┌──────────────────┐
                    │ Loading Screen   │
                    │ "Init World"     │
                    └────────┬──────────┘
                             │
                        [Wait 2-5s]
                             │
                             ↓
                    ┌──────────────────────────┐
                    │   Game Screen Visible    │
                    │  Welcome Panel Shown     │
                    └────────┬─────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
         [Click Manual Mode]  [Click Autonomous]
                    │                 │
                    ↓                 ↓
        ┌─────────────────────┐  ┌────────────────────┐
        │  Manual Mode Active │  │ Autonomous Loading │
        ├─────────────────────┤  ├────────────────────┤
        │ • Welcome hidden    │  │ Generating:        │
        │ • Conv panel shown  │  │ • World            │
        │ • NPC cards active  │  │ • Opening narration│
        │ • Input visible     │  │ • Main quest       │
        │ • User controls     │  │ • Initial events   │
        └────────┬────────────┘  └────────┬───────────┘
                 │                        │
        [Click NPC card]         [Events fire in sequence]
                 │                        │
                 ↓                        ↓
        ┌─────────────────────┐  ┌────────────────────┐
        │ In Conversation     │  │ Autonomous Running │
        │ • Awaiting user msg │  ├────────────────────┤
        │ • NPC responds      │  │ • Event log growing│
        │ • Can end/continue  │  │ • Conversations    │
        └────────┬────────────┘  │ • Combat           │
                 │               │ • Actions          │
        [Send msg / End]         │ • Narration        │
                 │               └────────┬───────────┘
                 ↓                        │
        ┌─────────────────────┐   [Click Stop Button]
        │ Ready for next NPC  │          │
        │ (or click another)  │          ↓
        └────────┬────────────┘  ┌────────────────────┐
                 │               │ Autonomous Stopped │
                 │               ├────────────────────┤
                 │               │ • Event log final  │
        [Click another NPC       │ • Can view replay  │
         OR stop mode]           │ • Back to welcome  │
                 │               └────────┬───────────┘
                 │                        │
                 └────────────┬───────────┘
                              │
                    [Both modes can stop]
                              │
                              ↓
                    ┌──────────────────────┐
                    │   Welcome Panel      │
                    │   (Ready for reselect)
                    └──────────────────────┘
```

### Message/Event Addition Flow

```
Backend sends IPC event
         │
         ├─ "autonomous:message"
         │  with: {speaker, speakerName, text}
         │
         ↓
onAutonomousMessage() listener triggered
         │
         └─ Calls: addMessageToHistory(data)
            │
            ├─ Create DOM element: <div class="message">
            ├─ Add speaker styling
            ├─ Add text content
            ├─ Append to dialogue-history
            ├─ Auto-scroll to bottom
            └─ Message visible in event log

         OR

         "autonomous:chronicler"
         with: {text, context}

         ↓
onAutonomousChronicler() listener triggered
         │
         └─ Calls: addEventToLog(text, 'chronicler')
            │
            ├─ Create DOM element: <div class="event-log-entry">
            ├─ Apply class: "event-chronicler"
            ├─ Append to dialogue-history
            ├─ Auto-scroll to bottom
            └─ Pink italic event visible in log
```

---

## Quick Reference

### Common UI Methods

```javascript
// Add an event to the log with styling
addEventToLog(text, eventType = 'event')
  // eventType: 'action-decision', 'action-result', 'combat-encounter', etc.
  // Auto-scrolls to bottom

// Add a message (dialogue) to the log
addMessageToHistory(messageData)
  // messageData: {speaker, speakerName, text}
  // Used for NPC and player dialogue

// Show/hide panels
.classList.add('hidden')      // Hide element
.classList.remove('hidden')   // Show element

// Update status bar
setStatus(text)               // Shows in bottom left

// Update NPC header
document.getElementById('current-npc-name').textContent = name
document.getElementById('current-npc-role').textContent = role

// Update sidebar quest panel
updateQuestPanel(quest)       // Shows quest info in sidebar
```

### Event Listener Pattern

All autonomous event listeners follow the same pattern:

```javascript
this.gameAPI.onAutonomousEventType?.((data) => {
  console.log('[App] Event:', JSON.stringify(data));
  // Handle the event
  // Update UI
  // Possibly call addEventToLog() or addMessageToHistory()
});
```

The `?.` optional chaining allows the listener to exist without errors if not available.

---

## Summary

The UI system is built on a **layered architecture**:

1. **Backend** generates events via game logic
2. **IPC Channel** transmits events from backend to frontend
3. **Preload Bridge** exposes event listeners to the UI code
4. **UI Controller** (app.js) listens for events and updates DOM
5. **DOM Elements** render the visual interface
6. **Panels** control visibility of different screens
7. **Event Log** accumulates and displays all game events
8. **Sidebar** provides persistent context information

This design allows clean separation between game logic and presentation, making it easy to add new event types or UI elements.
