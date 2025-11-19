# Dialogue-First Development Roadmap

This is an alternative roadmap that prioritizes LLM integration and dialogue testing over movement and rendering. The goal is to quickly test how well context works for NPCs and the protagonist in conversations.

## 🎯 Core Goal

Test and iterate on:
- LLM prompt engineering for character dialogue
- Context building from personality, memories, relationships
- Dialogue quality and coherence
- Character consistency across conversations

## 📋 Modified Phase Plan

### Phase 1: Minimal Foundation (Week 1)
**Goal**: Just enough infrastructure to support dialogue generation

**Tasks**:
1. ✅ Documentation complete
2. Create minimal base classes:
   - `Entity` (base class)
   - `Character` (extends Entity)
   - `Personality` (trait system)
   - `Memory` (basic storage)
   - `Relationship` (tracking)
3. Create utilities:
   - `SeededRandom` (for determinism)
   - `EventBus` (for events)
   - `Logger` (for debugging)
4. Setup test infrastructure:
   - Vitest configuration
   - Mock Ollama service

**Deliverable**: Basic character entities with personality and memory

---

### Phase 2: LLM Integration Core (Week 2)
**Goal**: Get Ollama working with seeded calls and context building

**Lead Agent**: LLM Integration Specialist

**Tasks**:
1. Implement `OllamaService`:
   - Connection to Ollama API
   - Seeded generation calls
   - Error handling and fallbacks
   - Response caching
2. Implement `PromptBuilder`:
   - Build prompts from character context
   - Include personality traits
   - Include memories
   - Include relationships
3. Implement `ResponseParser`:
   - Parse LLM dialogue responses
   - Validate output format
   - Handle malformed responses
4. Write comprehensive tests:
   - Mock Ollama for testing
   - Test prompt building
   - Test response parsing

**Deliverable**: Working LLM service with context-aware prompts

---

### Phase 3: Character Systems (Week 3)
**Goal**: Rich character state for context generation

**Lead Agent**: Character Systems Architect

**Tasks**:
1. Enhance `Personality` system:
   - 6-trait system (aggression, friendliness, intelligence, caution, greed, honor)
   - Trait influence on dialogue tone
   - Personality descriptions for prompts
2. Enhance `Memory` system:
   - Store dialogue exchanges
   - Time-based relevance scoring
   - Query memories by topic/character
   - Format memories for prompts
3. Enhance `Relationship` system:
   - Track relationship levels (-100 to +100)
   - Relationship change events
   - Relationship descriptions for prompts
4. Create `CharacterContext`:
   - Aggregates personality, memories, relationships
   - Provides formatted context for LLM

**Deliverable**: Characters with rich internal state

---

### Phase 4: Dialogue System (Week 4)
**Goal**: Structured dialogue generation and management

**Lead Agent**: LLM Integration Specialist + Character Systems Architect

**Tasks**:
1. Implement `DialogueGenerator`:
   - Generate greetings based on relationship
   - Generate responses based on context
   - Generate NPC personality-driven dialogue
   - Generate protagonist dialogue options
2. Implement `DialogueManager`:
   - Manage conversation state
   - Track conversation history
   - Handle turn-taking
   - End conversations gracefully
3. Implement dialogue prompts:
   - Greeting prompt template
   - Response prompt template
   - Thought generation template
4. Create dialogue tests:
   - Test various personality combinations
   - Test relationship influence
   - Test memory integration

**Deliverable**: Complete dialogue generation system

---

### Phase 5: Text-Based Testing Interface (Week 5)
**Goal**: Simple text UI to test dialogues

**Lead Agent**: React UI Developer

**Tasks**:
1. Create minimal React UI:
   - Character info display
   - Dialogue log viewer
   - Memory inspector
   - Relationship viewer
   - Context inspector (see what LLM sees)
2. Create dialogue testing interface:
   - Select characters for conversation
   - Trigger dialogue generation
   - View conversation history
   - Inspect prompts and responses
   - Manually advance conversation
3. Create scenario builder:
   - Set up test scenarios
   - Pre-configure character states
   - Load/save test scenarios

**Deliverable**: Text-based dialogue testing interface

---

### Phase 6: Replay Integration (Week 6)
**Goal**: Record and replay dialogues for comparison

**Lead Agent**: Replay System Engineer

**Tasks**:
1. Implement `ReplayLogger`:
   - Log dialogue events
   - Log LLM calls with seeds
   - Log character state changes
2. Implement deterministic seeding:
   - Seed manager for LLM calls
   - Guarantee same prompts → same responses
3. Create replay viewer:
   - Load recorded dialogue sessions
   - Step through conversation
   - View exact prompts and responses
   - Compare different runs

**Deliverable**: Deterministic dialogue recording and playback

---

### Phase 7: Advanced Context Features (Week 7)
**Goal**: Test advanced context features

**Lead Agent**: LLM Integration Specialist + Character Systems Architect

**Tasks**:
1. Implement `KnowledgeGraph`:
   - Store world facts
   - Query relevant facts for context
   - Include in prompts
2. Implement `EmotionalState`:
   - Track NPC emotions
   - Emotions influence dialogue
   - Include in prompts
3. Implement `Goals` (simple version):
   - Characters have current goals
   - Goals influence what they talk about
   - Include in prompts
4. Test context variations:
   - Test with/without memories
   - Test with/without relationships
   - Test with/without goals
   - Measure dialogue quality

**Deliverable**: Rich context system with quality metrics

---

### Phase 8: Multi-Character Testing (Week 8)
**Goal**: Test group conversations and complex scenarios

**Tasks**:
1. Implement group conversations:
   - 3+ character dialogues
   - Turn-taking logic
   - Context includes all participants
2. Create test scenarios:
   - Tavern conversation (3-4 NPCs)
   - Confrontation (opposing personalities)
   - Alliance (friendly characters)
   - Gossip chain (information spreading)
3. Performance optimization:
   - Parallel LLM calls when possible
   - Cache frequent responses
   - Optimize prompt length

**Deliverable**: Multi-character dialogue system

---

### Phase 9: Content Creation (Week 9)
**Goal**: Create diverse NPCs for testing

**Lead Agent**: Game Content Designer

**Tasks**:
1. Create 10+ unique NPCs:
   - Diverse personalities
   - Different backstories
   - Varied relationships
   - Different goals
2. Create test scenarios:
   - Meet stranger (neutral relationship)
   - Meet friend (positive relationship)
   - Meet enemy (negative relationship)
   - Return after long time (memory decay)
3. Document findings:
   - What context works best?
   - What prompt templates are most effective?
   - What personality combinations create interesting dialogue?

**Deliverable**: Rich NPC roster with test results

---

### Phase 10: Polish and Documentation (Week 10)
**Goal**: Finalize dialogue system before adding movement

**Tasks**:
1. Optimize prompts based on testing
2. Create prompt library (best templates)
3. Document best practices
4. Create example dialogues
5. Prepare for integration with movement system

**Deliverable**: Production-ready dialogue system

---

## 🧪 Testing Strategy

### Test Levels

**1. Unit Tests**
- OllamaService connection
- Prompt building
- Response parsing
- Memory storage/retrieval
- Relationship tracking

**2. Integration Tests**
- Full dialogue generation
- Context aggregation
- Multi-turn conversations

**3. Manual Tests**
- Dialogue quality assessment
- Character consistency
- Context effectiveness
- Edge cases

**4. Replay Tests**
- Determinism verification
- Seed consistency
- Response caching

### Test Scenarios

Create test scenarios for:

1. **First Meeting**
   - Characters don't know each other
   - Neutral relationship
   - No shared memories

2. **Friend Conversation**
   - Positive relationship (+60)
   - Shared memories
   - Comfortable tone

3. **Hostile Encounter**
   - Negative relationship (-40)
   - Past conflicts in memory
   - Tense dialogue

4. **After Long Absence**
   - Old memories (low relevance)
   - Relationship decay
   - Catching up

5. **Personality Extremes**
   - Very aggressive NPC
   - Very cautious NPC
   - Very friendly NPC
   - Opposite personalities interacting

6. **Goal-Driven Dialogue**
   - NPC wants information
   - NPC trying to convince
   - NPC avoiding topic

---

## 🎨 Minimal UI Features

For text-based testing, we need:

### Character Selector
```
┌─ Characters ─────────────────┐
│ ○ Protagonist (John)         │
│ ○ Mara (Tavern Keeper)       │
│ ○ Grok (Blacksmith)          │
│ ○ Elara (Merchant)           │
└──────────────────────────────┘
```

### Conversation Panel
```
┌─ Conversation ───────────────────────────────┐
│ Mara: Good morning! What brings you here?   │
│                                              │
│ You: I heard there's been some trouble...   │
│                                              │
│ Mara: Ah yes, someone's been stealing       │
│       from the storage. Very concerning.    │
└──────────────────────────────────────────────┘
```

### Context Inspector
```
┌─ Context Sent to LLM ────────────────────────┐
│ Character: Mara                              │
│ Personality:                                 │
│   Friendliness: 75 (High)                    │
│   Caution: 60 (Medium)                       │
│   Honor: 80 (High)                           │
│                                              │
│ Relationship with John: +45 (Friendly)       │
│                                              │
│ Recent Memories:                             │
│   - John helped with bandits (Day 2)         │
│   - Pleasant chat about harvest (Day 1)      │
│                                              │
│ Current Goal: Gather information about theft │
└──────────────────────────────────────────────┘
```

### Prompt Viewer
```
┌─ Actual Prompt Sent ─────────────────────────┐
│ You are Mara, a tavern keeper in Millbrook. │
│                                              │
│ Personality:                                 │
│ - Friendliness: High (75/100)                │
│ - Caution: Medium (60/100)                   │
│ - Honor: High (80/100)                       │
│                                              │
│ You are talking to John, whom you consider   │
│ a friend (+45). You remember:                │
│ - He helped defend against bandits           │
│ - You had a pleasant chat recently           │
│                                              │
│ Your current concern: Recent thefts          │
│                                              │
│ John says: "I heard there's been trouble..." │
│                                              │
│ Respond naturally as Mara would.             │
└──────────────────────────────────────────────┘
```

### Response Inspector
```
┌─ LLM Response ───────────────────────────────┐
│ Model: mistral                               │
│ Temperature: 0.7                             │
│ Seed: 1234567890                             │
│ Response Time: 2.3s                          │
│                                              │
│ "Ah yes, someone's been stealing from the    │
│ storage. Very concerning. I'm glad you're    │
│ asking - shows you care about the community. │
│ Have you noticed anything suspicious?"       │
└──────────────────────────────────────────────┘
```

---

## 🔧 Implementation Order

### Week 1: Foundation
```javascript
// Implement these in order:
1. src/entities/Entity.js
2. src/entities/Character.js
3. src/ai/personality/Personality.js
4. src/ai/memory/Memory.js
5. src/ai/memory/MemoryStore.js
6. src/systems/RelationshipSystem.js
7. src/utils/SeededRandom.js
8. src/services/EventBus.js
9. src/utils/Logger.js
```

### Week 2: LLM Core
```javascript
// Implement these:
1. src/services/OllamaService.js
2. src/ai/llm/PromptBuilder.js
3. src/ai/llm/ResponseParser.js
4. src/ai/llm/templates/baseTemplate.js
5. tests/unit/llm/OllamaService.test.js
6. tests/unit/llm/PromptBuilder.test.js
```

### Week 3: Character Systems
```javascript
// Enhance these:
1. src/ai/personality/Personality.js (add descriptions)
2. src/ai/memory/MemoryRetrieval.js
3. src/ai/memory/MemoryDecay.js
4. src/systems/RelationshipSystem.js (add descriptions)
5. src/ai/CharacterContext.js (NEW - aggregator)
```

### Week 4: Dialogue System
```javascript
// Implement these:
1. src/systems/DialogueSystem.js
2. src/ai/llm/DialogueGenerator.js
3. src/ai/llm/templates/dialogueTemplate.js
4. src/ai/llm/templates/greetingTemplate.js
5. tests/integration/dialogue-flow.test.js
```

### Week 5: Testing UI
```jsx
// Implement these:
1. src/ui/components/DialogueTester.jsx
2. src/ui/components/CharacterSelector.jsx
3. src/ui/components/ConversationLog.jsx
4. src/ui/components/ContextInspector.jsx
5. src/ui/components/PromptViewer.jsx
6. src/state/dialogueStore.js
```

---

## 🎯 Success Metrics

### Dialogue Quality
- [ ] Characters stay in character
- [ ] Personalities are distinguishable
- [ ] Memories are appropriately referenced
- [ ] Relationships influence tone
- [ ] Conversations feel natural

### Context Effectiveness
- [ ] Relevant memories are included
- [ ] Irrelevant memories are excluded
- [ ] Relationship level is clear in dialogue
- [ ] Personality traits are evident
- [ ] Goals influence topics

### Technical
- [ ] LLM calls are deterministic
- [ ] Responses can be replayed exactly
- [ ] Prompt length is optimized
- [ ] Response time < 5 seconds
- [ ] No crashes or errors

### Testing
- [ ] 10+ NPCs with unique personalities
- [ ] 20+ test scenarios
- [ ] 100+ recorded dialogue exchanges
- [ ] Documented best practices

---

## 📝 Documentation Deliverables

Create these documents:

1. **PROMPT_ENGINEERING.md**
   - Best prompt templates
   - Context building strategies
   - Tips for different scenarios

2. **CHARACTER_GUIDE.md**
   - How to create believable NPCs
   - Personality trait combinations
   - Memory and relationship guidelines

3. **DIALOGUE_TESTING.md**
   - How to use the testing interface
   - Test scenario creation
   - Quality assessment criteria

4. **LLM_INTEGRATION_NOTES.md**
   - Ollama configuration
   - Model selection advice
   - Temperature and seed management
   - Performance optimization

---

## 🚀 Getting Started

### Immediate Next Steps

1. **Set up Ollama** (if not already):
   ```bash
   # Install Ollama
   # Visit https://ollama.ai/
   
   # Pull a model
   ollama pull mistral
   
   # Test it works
   ollama run mistral "Hello, how are you?"
   ```

2. **Create agent for LLM Integration**:
   - See `AGENT_SETUP_GUIDE.md` for detailed instructions
   - Start with LLM Integration Specialist agent
   - Also create Character Systems Architect agent

3. **Implement Week 1 tasks**:
   - Create base Entity and Character classes
   - Implement Personality system
   - Implement basic Memory system
   - Set up testing infrastructure

4. **Move to Week 2**:
   - Start implementing OllamaService
   - Build prompt templates
   - Test LLM integration

---

## 💡 Why This Approach?

### Benefits

1. **Early Validation**: Test LLM integration early before building complex systems
2. **Iterate Quickly**: Adjust prompts and context without rewriting game logic
3. **Focus on Quality**: Ensure dialogue is good before adding movement/rendering
4. **Learn and Document**: Discover what works, document best practices
5. **Parallel Work**: UI can be simple while focusing on AI quality

### What We Skip (For Now)

- ❌ Phaser rendering
- ❌ Movement and pathfinding
- ❌ GOAP planning system
- ❌ Map and buildings
- ❌ Full game loop

### What We Add Later

After dialogue system is solid:
- Add movement (Week 11+)
- Add GOAP for autonomous behavior (Week 12+)
- Add Phaser rendering (Week 13+)
- Integrate with dialogue system (Week 14+)

---

## 🎉 End Goal (Week 10)

By the end of Week 10, you will have:

✅ Production-ready dialogue system
✅ Rich character context generation
✅ Deterministic LLM integration
✅ 10+ unique NPCs with personalities
✅ Text-based testing interface
✅ Replay system for dialogues
✅ Comprehensive documentation
✅ Best practices and templates

**Then** you can add movement, rendering, and GOAP with confidence that the dialogue system works well.

---

Ready to start? Begin with `AGENT_SETUP_GUIDE.md` to set up your LLM Integration Specialist agent!
