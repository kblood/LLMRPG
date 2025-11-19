# OllamaRPG - Quick Reference Guide

## 🚀 Quick Start

```bash
# 1. Ensure Ollama is running
ollama serve

# 2. Pull the model (if not already done)
ollama pull llama3.1:8b

# 3. Run the interactive demo
node interactive-demo.js

# Or run the automated demo
node demo-full-conversation.js
```

---

## 📝 Creating a New NPC

```javascript
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';

const npc = new Character('unique_id', {
  name: 'Character Name',
  role: 'Their Role',
  personality: new Personality({
    friendliness: 85,  // 0-100: How warm and welcoming
    intelligence: 70,  // 0-100: How smart and perceptive
    caution: 45,       // 0-100: How careful and suspicious
    honor: 80,         // 0-100: How honorable and trustworthy
    greed: 20,         // 0-100: How greedy and materialistic
    aggression: 30     // 0-100: How aggressive and hostile
  }),
  background: 'Brief description of their background and current situation'
});

// Add memories
npc.memory.addMemory('concern', 'Something they are worried about', { importance: 80 });
npc.memory.addMemory('fact', 'Something they know', { importance: 60 });
npc.memory.addMemory('secret', 'A secret they hold', { importance: 90 });

// Set relationship with player
npc.relationships.setRelationship('player', 45); // 0 = neutral
```

---

## 💬 Starting a Conversation

```javascript
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';

const dialogueSystem = new DialogueSystem();

// Start conversation (generates greeting automatically)
const convId = await dialogueSystem.startConversation(npc, player, {
  situation: 'Brief description of the situation',
  generateGreeting: true
});

// Get the greeting
const conversation = dialogueSystem.getConversation(convId);
const greeting = conversation.history[0].output;
console.log(`${npc.name}: "${greeting}"`);

// Add turns (NPC responds to player input)
const turn = await dialogueSystem.addTurn(convId, 'npc_id', playerInput, {
  temperature: 0.8  // 0.0-1.0: higher = more creative
});
console.log(`${npc.name}: "${turn.text}"`);

// End conversation
dialogueSystem.endConversation(convId);
```

---

## 🎯 Working with Quests

```javascript
import { QuestManager } from './src/systems/quest/QuestManager.js';

const questManager = new QuestManager();

// Create a quest
const questId = questManager.createQuest({
  title: 'Quest Title',
  description: 'Quest description',
  giver: 'npc_id',
  objectives: [
    {
      id: 'obj1',
      description: 'First objective',
      type: 'investigate',
      target: 'location',
      completed: false
    }
  ],
  rewards: {
    relationship: 10,
    description: 'Reward description'
  }
});

// Get active quests
const activeQuests = questManager.getActiveQuests();

// Update objective progress
questManager.updateObjective(questId, 'obj1', 100);

// Complete quest
questManager.completeQuest(questId);
```

---

## 🧠 Memory System

```javascript
// Add a memory
character.memory.addMemory(
  'type',        // 'fact', 'concern', 'observation', 'secret', 'interaction'
  'content',     // The memory content
  { importance: 75 }  // 0-100: How important this memory is
);

// Get recent memories
const recent = character.memory.getRecentMemories(5);

// Get memories about a subject
const relevant = character.memory.getMemoriesAbout('player');

// Get memories by type
const concerns = character.memory.getMemoriesByType('concern');
```

---

## 💫 Relationship System

```javascript
// Get current relationship value
const value = character.relationships.getRelationship('other_id');
// Returns: -100 to +100

// Get relationship level (text description)
const level = character.relationships.getRelationshipLevel('other_id');
// Returns: "Hostile", "Unfriendly", "Distant", "Neutral", "Good Friend", etc.

// Modify relationship
character.relationships.modifyRelationship('other_id', 5, 'Helped with a quest');
// Args: target_id, change amount (-100 to +100), optional reason

// Set relationship directly
character.relationships.setRelationship('other_id', 50);
```

---

## 📊 Personality Traits

### Trait Effects on Dialogue

| Trait | High (70+) | Low (30-) |
|-------|-----------|-----------|
| **Friendliness** | Warm, welcoming, chatty | Cold, distant, brief |
| **Intelligence** | Perceptive, complex speech | Simple, direct speech |
| **Caution** | Suspicious, careful | Trusting, open |
| **Honor** | Honest, keeps promises | May deceive, unreliable |
| **Greed** | Focused on profit | Generous, helpful |
| **Aggression** | Confrontational, direct | Passive, avoidant |

### Personality Archetypes

```javascript
// Cheerful Tavern Keeper
{ friendliness: 85, intelligence: 65, caution: 45, honor: 80, greed: 20, aggression: 15 }

// Gruff Blacksmith
{ friendliness: 30, intelligence: 70, caution: 60, honor: 75, greed: 50, aggression: 55 }

// Mysterious Merchant
{ friendliness: 65, intelligence: 80, caution: 75, honor: 60, greed: 65, aggression: 25 }

// Noble Knight
{ friendliness: 60, intelligence: 65, caution: 50, honor: 95, greed: 15, aggression: 45 }

// Cunning Thief
{ friendliness: 55, intelligence: 75, caution: 80, honor: 25, greed: 80, aggression: 40 }

// Wise Elder
{ friendliness: 70, intelligence: 90, caution: 65, honor: 85, greed: 20, aggression: 10 }
```

---

## 🎭 Event System

```javascript
import { EventBus } from './src/services/EventBus.js';

const eventBus = EventBus.getInstance();

// Listen for events
eventBus.on('quest:created', ({ quest }) => {
  console.log(`New quest: ${quest.title}`);
});

eventBus.on('dialogue:turn', ({ conversationId, turn }) => {
  console.log(`New dialogue turn in ${conversationId}`);
});

eventBus.on('relationship:changed', ({ characterId, targetId, newValue }) => {
  console.log(`Relationship changed: ${newValue}`);
});

// Available events:
// - dialogue:started
// - dialogue:turn
// - dialogue:ended
// - quest:created
// - quest:objective_completed
// - quest:completed
// - quest:failed
// - relationship:changed
```

---

## 🔧 Ollama Service

```javascript
import { OllamaService } from './src/services/OllamaService.js';

const ollama = OllamaService.getInstance();

// Check availability
const available = await ollama.isAvailable();

// Generate text with seed
const result = await ollama.generate(prompt, {
  model: 'llama3.1:8b',
  seed: 12345,
  temperature: 0.8,
  max_tokens: 150
});

// Get statistics
const stats = ollama.getStats();
console.log(`Calls: ${stats.totalCalls}, Tokens: ${stats.totalTokens}`);

// Clear cache
ollama.clearCache();
```

---

## 🎮 Interactive Demo Commands

### Main Menu
- `talk [name]` or just `[name]` - Start conversation with NPC
- `quests` - View active and completed quests
- `npcs` - List all NPCs and their info
- `stats` - Show session statistics
- `help` - Show command list
- `quit` - Exit demo

### During Conversation
- Type your message and press Enter
- `end` or `bye` - End conversation
- `quests` - View quests without ending conversation
- `memory` - View NPC's memories
- `relationship` - View relationship status

---

## 🧪 Testing Commands

```bash
# Test individual systems
node test-llm.js              # LLM integration
node test-character.js        # Character system
node test-dialogue-system.js  # Dialogue flow
node test-quest-system.js     # Quest detection
node test-real-dialogue.js    # Real Ollama dialogue

# Run demos
node demo-full-conversation.js  # Automated demo
node interactive-demo.js        # Interactive demo

# Run all tests
npm test                      # Run test suite
npm run test:watch           # Watch mode
```

---

## 📖 Prompt Templates

### Greeting Prompt Structure
```
You are [NAME], [ROLE].

Personality: [TRAITS]

Background: [BACKGROUND]

Recent memories:
- [MEMORY 1]
- [MEMORY 2]

Relationships:
- [CHARACTER]: [LEVEL] ([VALUE])

Situation: [SITUATION]

Generate a natural greeting in character.
```

### Response Prompt Structure
```
You are [NAME], [ROLE].

Personality: [TRAITS]

Recent memories:
- [MEMORIES]

Relationships:
- [RELATIONSHIPS]

Previous conversation:
[CHARACTER]: "[TURN 1]"
[CHARACTER]: "[TURN 2]"

They just said: "[PLAYER INPUT]"

Respond naturally in character.
```

---

## 💡 Tips & Best Practices

### Creating Compelling NPCs
1. **Give them a problem**: NPCs with concerns are more interesting
2. **Make personality distinct**: Extreme trait values create memorable characters
3. **Add secrets**: Hidden information makes dialogue deeper
4. **Connect NPCs**: Shared memories and relationships create web

### Writing Good Backgrounds
- Keep it brief (1-2 sentences)
- Include current situation
- Hint at potential quests
- Mention relationships to others

### Memory Management
- Use 'concern' for quest hooks
- Use 'secret' for hidden information
- Use 'observation' for clues
- Use 'interaction' for relationship history
- Importance 80+ for critical information

### Relationship Tips
- Start neutral (40-50) for strangers
- Start friendly (60-70) for acquaintances
- Change by 1-3 for minor interactions
- Change by 5-10 for significant moments
- Change by 15+ for major events

### Quest Design
- Tie to NPC personality and concerns
- Multiple objectives (2-4) for depth
- Clear success criteria
- Meaningful rewards (relationship + item/info)
- Consider moral choices

---

## 🐛 Troubleshooting

### Ollama Not Responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
# On Windows: Restart the Ollama service
# On Linux/Mac: killall ollama && ollama serve
```

### Model Not Found
```bash
# Pull the model
ollama pull llama3.1:8b

# List available models
ollama list
```

### Responses Too Short/Long
```javascript
// Adjust max_tokens in dialogue generation
const system = new DialogueSystem({
  maxTokens: 200  // Increase for longer responses
});
```

### NPCs Not Staying in Character
- Check personality traits are distinct
- Add more specific memories
- Reduce temperature (0.6-0.7 for more consistency)
- Add more context to background

### Slow Response Times
- Use smaller model (llama3.1:8b good balance)
- Reduce context window
- Enable caching for repeated scenarios
- Consider reducing temperature

---

## 📚 Further Reading

- `ARCHITECTURE.md` - System architecture details
- `NEXT_STEPS_OPTIONS.md` - Feature roadmap
- `CURRENT_STATUS.md` - Implementation status
- `PROGRESS_CHECKLIST.md` - Development checklist

---

**Quick Links**:
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Project README](README.md)
- [Getting Started](GETTING_STARTED.md)

---

**Last Updated**: 2025-01-16
