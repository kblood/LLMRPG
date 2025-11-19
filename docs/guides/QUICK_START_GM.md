# Quick Start: Game Master System 🎭

**Get started with the AI-powered Dungeon Master in 2 minutes!**

---

## 🚀 Quickest Start

```bash
# Play the game with GM narration
npm run play:gm
```

That's it! You'll experience atmospheric narration as you explore and talk to NPCs.

---

## 🧪 Test It

```bash
# Run comprehensive tests
npm run test:gm
```

See the GM in action through 8 different test scenarios.

---

## 💻 Use In Your Code

### Basic Usage

```javascript
import { GameMaster } from './src/systems/GameMaster.js';

// Create GM
const gm = new GameMaster();

// Get scene narration
const narration = await gm.narrateScene({
    location: 'Red Griffin Inn',
    timeOfDay: 'evening',
    mood: 'mysterious'
});

console.log(narration);
// Output: "The warm glow of the tavern welcomes you. Mara wipes glasses
//          with mechanical precision, worry clouding her demeanor..."
```

### Listen for Narration

```javascript
import { EventBus } from './src/services/EventBus.js';

const eventBus = EventBus.getInstance();

// Listen for GM narration
eventBus.on('gm:narration', (data) => {
    console.log('🎭 GM:', data.text);
});

// GM will narrate automatically when events happen
```

### Configure the GM

```javascript
// Adjust GM behavior
gm.configure({
    narrationFrequency: 'key_moments', // 'constant', 'key_moments', 'minimal'
    eventGenerationEnabled: true,       // Generate dynamic events
    storyArcTracking: true              // Track story progression
});
```

---

## 🎮 What Can the GM Do?

### 1. Narrate Scenes
```javascript
const narration = await gm.narrateScene({
    location: 'tavern',
    timeOfDay: 'evening',
    weather: 'rainy',
    mood: 'tense',
    npcsPresent: ['Mara', 'Grok']
});
```

### 2. Generate Events
```javascript
const event = await gm.generateEvent({
    npcsMet: ['Mara', 'Grok'],
    activeQuests: ['investigate_thefts'],
    recentActions: ['questioned NPCs']
});
```

### 3. Orchestrate NPCs
```javascript
const interaction = await gm.orchestrateNPCInteraction(npc1, npc2, {
    reason: 'Grok stops by tavern',
    playerCanObserve: true
});
```

### 4. Add Atmosphere
```javascript
const atmosphere = await gm.provideAtmosphere({
    location: 'dark alley',
    timeOfDay: 'midnight',
    mood: 'tense'
});
```

### 5. Track Story
```javascript
// Automatically tracks player progression
gm.trackStoryArc(playerActions);

// Check current act
console.log(`Act ${gm.currentAct}`); // 1, 2, or 3
```

---

## 📚 Full Example

```javascript
import { GameMaster } from './src/systems/GameMaster.js';
import { EventBus } from './src/services/EventBus.js';
import { OllamaService } from './src/services/OllamaService.js';

// Setup
const ollama = OllamaService.getInstance();
const eventBus = EventBus.getInstance();
const gm = new GameMaster(ollama, eventBus);

// Listen for GM events
eventBus.on('gm:narration', (data) => {
    console.log('\n🎭 THE CHRONICLER:');
    console.log(data.text);
    console.log();
});

// Player enters tavern
console.log('You push open the tavern door...\n');
await gm.narrateScene({
    location: 'Red Griffin Inn',
    timeOfDay: 'evening',
    weather: 'clear',
    mood: 'welcoming',
    npcsPresent: ['Mara', 'Grok', 'patrons']
});

// Player talks to Mara
console.log('You approach the tavern keeper...\n');
eventBus.emit('dialogue:started', { npcId: 'mara' });

// Quest discovered
eventBus.emit('quest:started', { questId: 'investigate_thefts' });

// Check story progress
const context = gm.getNarrativeContext();
console.log(`\n📖 Story: Act ${context.currentAct}`);
console.log(`📜 Narrations: ${context.recentNarration.length}`);
```

---

## 🔧 Configuration Options

```javascript
// Constant narration (every action)
gm.configure({ narrationFrequency: 'constant' });

// Key moments only (default)
gm.configure({ narrationFrequency: 'key_moments' });

// Minimal narration
gm.configure({ narrationFrequency: 'minimal' });

// Disable event generation
gm.configure({ eventGenerationEnabled: false });

// Disable story tracking
gm.configure({ storyArcTracking: false });
```

---

## 🎯 Common Use Cases

### Entering a Location
```javascript
await gm.narrateScene({
    location: 'Red Griffin Inn',
    timeOfDay: 'evening'
});
```

### NPC Approach
```javascript
await gm.narrateScene({
    location: currentLocation,
    npcsPresent: [npc.name],
    playerActions: [`approaching ${npc.name}`],
    mood: 'anticipatory'
});
```

### Background Activity
```javascript
// NPCs talk to each other
const interaction = await gm.orchestrateNPCInteraction(mara, grok, {
    reason: 'Grok stops by for evening ale',
    playerCanObserve: true
});
```

### Critical Moments
```javascript
// Add atmosphere during tense moments
const atmosphere = await gm.provideAtmosphere({
    location: 'dark alley',
    mood: 'tense',
    recentEvents: ['heard suspicious noise']
});
```

---

## 📖 API Quick Reference

| Method | Purpose |
|--------|---------|
| `narrateScene(context)` | Get scene narration |
| `generateEvent(gameState)` | Generate dynamic event |
| `orchestrateNPCInteraction(npc1, npc2, context)` | Orchestrate NPC talk |
| `provideAtmosphere(moment)` | Add atmospheric description |
| `trackStoryArc(actions)` | Track story progression |
| `configure(config)` | Update GM settings |
| `getNarrativeContext()` | Get current narrative state |
| `reset()` | Reset for new game |

---

## 🎭 The Chronicler

The GM has a personality:
- **Name**: "The Chronicler"
- **Style**: Atmospheric storyteller
- **Tone**: Mysterious yet helpful
- **Role**: Unseen narrator that shapes events

---

## 📝 Events

### GM Listens To:
- `dialogue:started` / `dialogue:ended`
- `quest:started` / `quest:completed`
- `location:changed`
- `player:action`

### GM Emits:
- `gm:narration` - Scene narration
- `gm:event_generated` - New event
- `gm:npc_interaction` - NPC orchestration
- `gm:story_beat` - Story progression

---

## 💡 Tips

1. **Start Simple**: Just add scene narration first
2. **Use Events**: Let EventBus handle integration
3. **Configure Wisely**: Adjust frequency to avoid spam
4. **Fallback Works**: GM works even without Ollama (uses defaults)
5. **Check Context**: Use `getNarrativeContext()` to debug

---

## 🐛 Troubleshooting

### "Ollama not available"
GM uses fallback narration. Install Ollama for full features.

### "Too much narration"
```javascript
gm.configure({ narrationFrequency: 'minimal' });
```

### "Not enough narration"
```javascript
gm.configure({ narrationFrequency: 'constant' });
```

### "Want to disable temporarily"
```javascript
gm.configure({ 
    eventGenerationEnabled: false,
    narrationFrequency: 'minimal'
});
```

---

## 📚 More Information

- **Full Documentation**: `GAME_MASTER_IMPLEMENTATION.md`
- **Implementation Summary**: `GAME_MASTER_COMPLETE.md`
- **Test Suite**: `test-game-master.js`
- **Demo**: `play-with-gm.js`

---

## 🎉 That's It!

You now know how to use the Game Master system!

```bash
# Try it now
npm run play:gm
```

**The Chronicler awaits...** 🎭

---

**Questions?** Check `GAME_MASTER_IMPLEMENTATION.md` for complete details.
