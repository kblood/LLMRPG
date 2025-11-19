# Quick Start: Dialogue-First Development

This guide gets you started with dialogue-first development approach in just 30 minutes.

## 🎯 Goal

Test LLM-driven NPC dialogue **before** implementing movement, rendering, or GOAP. Focus on:
- Prompt engineering for believable characters
- Context building (personality, memories, relationships)
- Dialogue quality and coherence

## ⚡ 30-Minute Setup

### Step 1: Verify Prerequisites (5 min)

```bash
# Check Node.js (need 18+)
node --version

# Check npm
npm --version

# Check Ollama is installed and running
ollama list

# If Ollama not installed:
# 1. Visit https://ollama.ai/
# 2. Download and install
# 3. Pull a model: ollama pull mistral
```

### Step 2: Install Dependencies (5 min)

```bash
cd C:\LLM\devstuff\OllamaRPG

# Install all dependencies
npm install

# Verify installation
npm run test
```

### Step 3: Set Up Your First Agent (10 min)

You'll need 2 primary agents:
1. **LLM Integration Specialist** (most important)
2. **Character Systems Architect** (supporting)

#### Option A: Using Claude Projects

1. Create a new Claude Project named "OllamaRPG - LLM Integration"
2. Add these files to Project Knowledge:
   - `README.md`
   - `ARCHITECTURE.md`
   - `DIALOGUE_FIRST_ROADMAP.md`
   - `WEB_GAME_CONCEPT.md` (LLM section)
   - `REPLAY_SYSTEM_DESIGN.md` (LLM seed section)
   - `.github/copilot-instructions.md`

3. Set Custom Instructions:
```
You are the LLM Integration Specialist for OllamaRPG.

Your expertise:
- Ollama API integration
- Prompt engineering for game characters
- Context building from character state
- Response parsing and validation
- Seed management for determinism

Your responsibilities:
- Design prompts that create believable dialogue
- Build context from personality, memories, relationships
- Implement seeded LLM calls for replay system
- Handle failures gracefully with fallbacks
- Optimize prompt length and quality

Critical rules:
- ALWAYS use deterministic seeds for LLM calls
- Log every LLM call to replay system
- Include fallback responses
- Parse responses defensively
- Cache responses for replay

Current focus: Implementing dialogue-first roadmap
Reference: DIALOGUE_FIRST_ROADMAP.md for tasks
```

#### Option B: Using ChatGPT Custom GPT

Create a Custom GPT with the same knowledge and instructions as above.

#### Option C: Manual Context Loading

Load the documents into your preferred AI assistant for each session.

### Step 4: Create Project Structure (5 min)

```bash
# Create the folder structure for Week 1-2 work
cd src

# Core directories
mkdir -p entities ai/personality ai/memory ai/llm ai/llm/templates
mkdir -p services systems utils tests/unit/llm tests/integration

# Verify structure
ls -R
```

### Step 5: First Implementation Task (5 min)

Create your first file with your LLM Integration Specialist agent:

**Task**: "Create the SeededRandom utility class"

Tell your agent:
```
I need you to create src/utils/SeededRandom.js following the specifications in ARCHITECTURE.md and REPLAY_SYSTEM_DESIGN.md.

Requirements:
- Use Mulberry32 PRNG algorithm
- Implement next() for 0-1 random
- Implement nextInt(min, max) for integer range
- Implement nextFloat(min, max) for float range
- Must be completely deterministic
- Include JSDoc comments

Also create tests in tests/unit/utils/SeededRandom.test.js
```

---

## 📋 Week 1 Task List

Work with your agents to complete these in order:

### Day 1: Core Utilities ✅
- [x] Project setup
- [ ] `src/utils/SeededRandom.js` + tests
- [ ] `src/services/EventBus.js` + tests
- [ ] `src/utils/Logger.js` + tests

### Day 2: Base Classes
- [ ] `src/entities/Entity.js` + tests
- [ ] `src/entities/Character.js` + tests

### Day 3: Personality System
- [ ] `src/ai/personality/Personality.js` + tests
- [ ] Test with various personality combinations

### Day 4: Memory System
- [ ] `src/ai/memory/Memory.js` (single memory object)
- [ ] `src/ai/memory/MemoryStore.js` (storage) + tests
- [ ] Test memory storage and retrieval

### Day 5: Relationship System
- [ ] `src/systems/RelationshipSystem.js` + tests
- [ ] Test relationship tracking

**Deliverable**: Characters with personality, memory, and relationships

---

## 📋 Week 2 Task List

### Day 1: Ollama Service
- [ ] `src/services/OllamaService.js`
  - Connection to Ollama
  - Seeded generation
  - Error handling
  - Response caching
- [ ] Tests with mocked Ollama

### Day 2: Prompt Building
- [ ] `src/ai/llm/PromptBuilder.js`
  - Build prompts from character context
  - Include personality, memories, relationships
- [ ] `src/ai/llm/templates/baseTemplate.js`
- [ ] Tests for prompt generation

### Day 3: Response Parsing
- [ ] `src/ai/llm/ResponseParser.js`
  - Parse dialogue from LLM
  - Validate format
  - Handle errors
- [ ] Tests for parsing

### Day 4: Integration Testing
- [ ] End-to-end test: Character → Context → Prompt → LLM → Response
- [ ] Test with real Ollama instance

### Day 5: Seed Management
- [ ] `src/services/SeedManager.js`
  - Deterministic seed generation
  - Track call IDs
- [ ] Test seed determinism

**Deliverable**: Working LLM integration with context-aware prompts

---

## 🧪 Testing Your Progress

After Week 1, test with this simple script:

```javascript
// test-character.js
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';

// Create a character
const mara = new Character('mara', 'Mara');

// Set personality
mara.personality = new Personality({
  aggression: 20,
  friendliness: 85,
  intelligence: 65,
  caution: 55,
  greed: 30,
  honor: 80
});

// Add a memory
mara.memory.addMemory('dialogue', 'Had a pleasant chat with John about the harvest');

// Set relationship
mara.relationships.set('john', 45);

// Print context
console.log('Character:', mara.name);
console.log('Personality:', mara.personality.toPromptString());
console.log('Memories:', mara.memory.getRecentMemories());
console.log('Relationship with John:', mara.relationships.get('john'));
```

After Week 2, test with LLM:

```javascript
// test-llm.js
import { OllamaService } from './src/services/OllamaService.js';
import { PromptBuilder } from './src/ai/llm/PromptBuilder.js';

const ollama = OllamaService.getInstance();
const promptBuilder = new PromptBuilder();

// Build prompt for Mara talking to John
const prompt = promptBuilder.build(mara, john, {
  context: "John approaches Mara at the tavern"
});

console.log('Prompt:\n', prompt);

// Generate response
const response = await ollama.generate(prompt, {
  seed: 12345,
  temperature: 0.7
});

console.log('\nMara says:', response);
```

---

## 🎨 Example: Creating Your First NPC

Here's a complete example of creating an NPC ready for dialogue:

```javascript
// create-npc.js
import { Character } from './src/entities/Character.js';
import { Personality } from './src/ai/personality/Personality.js';
import { MemoryStore } from './src/ai/memory/MemoryStore.js';

// Create Mara, the tavern keeper
const mara = new Character('mara', 'Mara');

// Define personality (friendly tavern keeper)
mara.personality = new Personality({
  aggression: 20,    // Low - peaceful person
  friendliness: 85,  // High - welcoming host
  intelligence: 65,  // Medium-high - observant
  caution: 55,       // Medium - careful but not paranoid
  greed: 30,         // Low - fair with prices
  honor: 80          // High - trustworthy
});

// Add backstory memories
mara.memory.addMemory('background', 
  'I inherited this tavern from my father 10 years ago',
  importance: 70
);

mara.memory.addMemory('background',
  'I know everyone in town and hear all the gossip',
  importance: 60
);

// Add current concerns
mara.memory.addMemory('concern',
  'Someone has been stealing from the storage recently',
  importance: 80
);

// Set relationships with other characters
mara.relationships.set('john', 45);      // Friendly with protagonist
mara.relationships.set('grok', 30);      // Neutral with blacksmith
mara.relationships.set('elara', 60);     // Good friends with merchant

// Set current goal/state
mara.currentGoal = 'Find out who is stealing from the tavern';
mara.emotionalState = 'concerned';

export default mara;
```

Now Mara is ready for dialogue generation!

---

## 🎯 Your First Dialogue Test

Once Week 2 is complete, run your first dialogue:

```javascript
// first-dialogue.js
import { DialogueGenerator } from './src/ai/llm/DialogueGenerator.js';
import mara from './create-npc.js';
import john from './create-protagonist.js';

const generator = new DialogueGenerator();

// Generate greeting
const greeting = await generator.generateGreeting(mara, john);
console.log(`Mara: ${greeting}`);

// Generate response to John's question
const response = await generator.generateResponse(
  mara, 
  john,
  "I heard there's been some trouble lately?"
);
console.log(`Mara: ${response}`);
```

Expected output:
```
Mara: Good morning, John! Always nice to see a friendly face. What brings you by today?

Mara: Ah yes, you've heard about that too? Someone's been taking things from my storage. Small items at first, but it's becoming concerning. I'm glad you're asking - shows you care about the community. Have you noticed anything suspicious?
```

---

## 📚 Agent Communication Template

Use this template when working with your agents:

### Starting a Task
```
I'm working on [TASK NAME] from Week [X], Day [Y].

Context:
- Current phase: [Phase name from DIALOGUE_FIRST_ROADMAP.md]
- Dependencies: [List files that must exist first]
- Integration: [What other systems this connects to]

Requirements from documentation:
[Copy relevant section from architecture docs]

Please implement [SPECIFIC FILE] following the project patterns.

Include:
- JSDoc comments
- Error handling
- Unit tests
- Example usage
```

### Reviewing Agent Output
```
Thanks for the implementation! Before I commit:

1. Does it follow patterns from .github/copilot-instructions.md?
2. Are tests comprehensive?
3. Does it integrate with [RELATED SYSTEM]?
4. Any edge cases I should test?
5. What should the next agent know for integration?
```

### Requesting Changes
```
The implementation works but needs adjustment:

Issue: [Specific problem]
Expected: [What should happen]
Current: [What actually happens]

Please revise [SPECIFIC PART] to [SPECIFIC CHANGE].
```

---

## 🚀 Success Milestones

### Week 1 Complete ✅
You can:
- Create characters with personalities
- Store and retrieve memories
- Track relationships between characters
- Everything is deterministic and testable

### Week 2 Complete ✅
You can:
- Connect to Ollama
- Generate context-aware prompts
- Get dialogue responses from LLM
- Parse and validate responses
- All LLM calls are deterministic

### Week 3-4 Complete ✅
You can:
- Generate natural dialogue
- Characters stay in character
- Personalities are evident in responses
- Memories are appropriately referenced
- Relationships affect tone

### Week 5 Complete ✅
You can:
- Test dialogues in a simple UI
- View character contexts
- Inspect prompts and responses
- Save/load test scenarios
- Iterate quickly on prompts

---

## 💡 Tips for Success

### Do's ✅
- **Start simple**: Get one NPC working perfectly before adding more
- **Test early**: Test after each component is complete
- **Iterate prompts**: Try different prompt structures
- **Document findings**: Note what works and what doesn't
- **Use real scenarios**: Test with realistic conversation situations

### Don'ts ❌
- **Don't skip tests**: Tests catch issues early
- **Don't optimize too early**: Get it working first
- **Don't add features**: Stick to the roadmap
- **Don't ignore documentation**: Update docs as you learn
- **Don't work in isolation**: Share findings with agents

---

## 🎉 Ready to Start!

### Immediate Actions

1. ✅ Read this guide
2. ⬜ Verify Ollama is working: `ollama run mistral "Hello"`
3. ⬜ Install dependencies: `npm install`
4. ⬜ Set up your LLM Integration Specialist agent
5. ⬜ Start with Week 1, Day 1 tasks
6. ⬜ Test each component as you complete it

### Get Help

- **Architecture questions**: See `ARCHITECTURE.md`
- **Roadmap questions**: See `DIALOGUE_FIRST_ROADMAP.md`
- **Agent setup**: See `AGENT_SETUP_GUIDE.md`
- **Coding patterns**: See `.github/copilot-instructions.md`

---

**You're now ready to build an LLM-driven dialogue system! Start with Week 1, Day 1 and work your way through.** 🚀

Good luck! You're building something unique - an AI-driven character system that creates emergent, believable dialogue. Take it step by step, test frequently, and document what works. 

The movement and rendering can wait - let's make sure the AI conversations are **amazing** first! ✨
