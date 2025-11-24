# 🎮 Autonomous Mode Refactoring Plan

## 🎯 **Goal**

Make tests use the **exact same autonomous gameplay code** that the UI uses, including:
- ✅ Themed world generation
- ✅ AI-driven conversations
- ✅ **Combat encounters**
- ✅ Action system (travel, investigate, search)
- ✅ Fallback logging

---

## 📊 **Current State**

### **UI Autonomous Mode** (`electron/ipc/GameBackend.js`)

**Full Implementation** (lines 900-1600):
```
✅ World generation
✅ AI decides actions (talk, travel, investigate, search)
✅ Combat encounters during actions
✅ Dialogue with NPCs
✅ Quest system integration
✅ Time progression
✅ Location tracking
✅ Replay logging
```

**Combat Integration** (lines 1040-1080):
```javascript
// Check for combat encounter when investigating, traveling, or searching
const encounter = this.combatEncounterSystem.generateCombatEncounter(
  this.player,
  location,
  timeOfDay
);

if (encounter) {
  // Execute combat
  const combatResult = await this.combatSystem.executeCombat(
    this.player,
    encounter.enemies,
    encounter
  );
}
```

### **Test Autonomous Mode** (`test-autonomous-themed-game.js`)

**Partial Implementation**:
```
✅ Themed world generation (NOW SHARED)
✅ Dialogue with NPCs
❌ NO combat encounters
❌ NO action system
❌ NO travel/investigate
❌ Only conversation loops
```

---

## ❌ **The Problem**

**Tests don't use UI's autonomous mode code!**

1. **UI has a full autonomous loop**: `_runAutonomousLoop()`
   - Decides actions via AI
   - Triggers combat encounters
   - Handles travel between locations
   - Integrates quest system

2. **Test has custom conversation loop**: `runAutonomousConversation()`
   - Only does dialogue
   - No combat
   - No action decisions
   - Incomplete gameplay

3. **Result**: **Tests don't validate UI behavior**
   - UI could break without tests detecting it
   - Combat system never tested in autonomous mode
   - Fallback logging not tested for combat

---

## ✅ **Solution: Create Shared Autonomous Mode Service**

### **Step 1: Extract UI's Autonomous Loop**

Create `src/services/AutonomousGameService.js`:

```javascript
/**
 * AutonomousGameService - Shared autonomous gameplay logic
 * Used by both UI and tests
 */
export class AutonomousGameService {
  constructor(config) {
    this.session = config.session;
    this.player = config.player;
    this.npcs = config.npcs;
    this.gameMaster = config.gameMaster;
    this.actionSystem = config.actionSystem;
    this.combatSystem = config.combatSystem;
    this.combatEncounterSystem = config.combatEncounterSystem;
    this.replayLogger = config.replayLogger;
    this.ollama = config.ollama;
    this.eventBus = config.eventBus;
    this.onEvent = config.onEvent || (() => {});
  }

  /**
   * Main autonomous game loop
   * Decides actions, handles conversations, triggers combat
   */
  async runGameLoop(options = {}) {
    const maxIterations = options.maxIterations || 20;
    
    for (let i = 0; i < maxIterations; i++) {
      // 1. Decide next action (AI)
      const action = await this._decideNextAction();
      
      // 2. Execute action
      if (action.type === 'talk') {
        await this._runConversation(action.targetNPC);
      } else {
        await this._executeAction(action);
      }
      
      // 3. Check for combat encounter
      if (this._shouldTriggerCombat(action)) {
        await this._handleCombatEncounter(action);
      }
      
      // 4. Update time
      this.session.tick(action.timeAdvanced || 10);
      
      // 5. Emit event
      this.onEvent('iteration_complete', { iteration: i, action });
    }
  }

  async _decideNextAction() {
    // AI decides: talk, travel, investigate, or search
    // (Extract from GameBackend._decideNextAction)
  }

  async _runConversation(npc) {
    // Run AI vs AI conversation
    // (Extract from GameBackend._runAutonomousConversation)
  }

  async _executeAction(action) {
    // Execute non-conversation actions
    // (Extract from GameBackend autonomous loop)
  }

  async _handleCombatEncounter(action) {
    // Generate and execute combat
    // (Extract from GameBackend combat encounter logic)
  }

  _shouldTriggerCombat(action) {
    // Check if combat should occur
    return ['travel', 'investigate', 'search'].includes(action.type);
  }
}
```

### **Step 2: Refactor GameBackend to Use Service**

```javascript
// electron/ipc/GameBackend.js

async _runAutonomousLoop() {
  // Create service
  const autonomousService = new AutonomousGameService({
    session: this.session,
    player: this.player,
    npcs: this.npcs,
    gameMaster: this.gameMaster,
    actionSystem: this.actionSystem,
    combatSystem: this.combatSystem,
    combatEncounterSystem: this.combatEncounterSystem,
    replayLogger: this.replayLogger,
    ollama: this.ollama,
    eventBus: this.eventBus,
    onEvent: (event, data) => this._sendToUI(`autonomous:${event}`, data)
  });

  // Run game loop
  await autonomousService.runGameLoop({
    maxIterations: 100 // UI keeps running
  });
}
```

### **Step 3: Update Test to Use Service**

```javascript
// test-autonomous-themed-game.js

// Generate world (already using shared service)
const worldData = await worldGenerator.generateMinimalThemedWorld({...});

// Initialize game systems
const actionSystem = new ActionSystem(...);
const combatSystem = new CombatSystem(...);
const combatEncounterSystem = new CombatEncounterSystem(...);

// Create autonomous service (SAME AS UI!)
const autonomousService = new AutonomousGameService({
  session: session,
  player: worldData.player,
  npcs: worldData.npcs,
  gameMaster: worldData.gameMaster,
  actionSystem: actionSystem,
  combatSystem: combatSystem,
  combatEncounterSystem: combatEncounterSystem,
  replayLogger: replayLogger,
  ollama: ollama,
  eventBus: eventBus,
  onEvent: (event, data) => {
    console.log(chalk.cyan(`[${event}]`), data);
  }
});

// Run game loop (SAME AS UI!)
await autonomousService.runGameLoop({
  maxIterations: 10 // Tests run fixed iterations
});
```

---

## 📦 **What Gets Extracted**

### **From GameBackend.js → AutonomousGameService.js**

| Method | Lines | Purpose |
|--------|-------|---------|
| `_runAutonomousLoop()` | 900-1088 | Main game loop |
| `_decideNextAction()` | 850-900 | AI action decision |
| `_runAutonomousConversation()` | 1090-1200 | Conversation handling |
| `_protagonistDecideResponse()` | 1306-1383 | Protagonist AI |
| `_executeAction()` | 1000-1075 | Action execution + combat |

**Total**: ~400 lines → Shared service

---

## ✨ **Benefits**

### **1. Code Reuse**
- ✅ UI and tests use **identical** autonomous logic
- ✅ 400 lines of code shared
- ✅ No duplication

### **2. Testing**
- ✅ Tests validate **actual UI behavior**
- ✅ Combat tested in autonomous mode
- ✅ Action system tested
- ✅ Fallback logging tested for combat

### **3. Maintainability**
- ✅ Fix bugs once, fixes everywhere
- ✅ Add features once, available everywhere
- ✅ Easier to understand

### **4. Consistency**
- ✅ UI and tests behave identically
- ✅ Same AI decision logic
- ✅ Same combat encounter rates
- ✅ Same time progression

---

## 🔧 **Implementation Steps**

### **Phase 1: Extract Service** (2-3 hours)

1. Create `src/services/AutonomousGameService.js`
2. Move `_runAutonomousLoop` logic to service
3. Move action decision logic
4. Move conversation handling
5. Move combat encounter handling
6. Add event emitter for UI updates

### **Phase 2: Refactor GameBackend** (1 hour)

1. Import `AutonomousGameService`
2. Replace `_runAutonomousLoop` with service call
3. Keep UI-specific methods (`_sendToUI`)
4. Test UI still works

### **Phase 3: Update Tests** (1 hour)

1. Update `test-autonomous-themed-game.js`
2. Initialize combat systems
3. Create `AutonomousGameService` instance
4. Run game loop
5. Verify combat encounters occur
6. Check fallback logging for combat

### **Phase 4: Verify** (30 min)

1. Run UI autonomous mode
2. Run test autonomous mode
3. Confirm identical behavior
4. Check fallback logging works

---

## 🧪 **Expected Test Output**

### **After Refactoring:**

```bash
node test-autonomous-themed-game.js
```

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║  AUTONOMOUS THEMED GAME TEST                               ║
║  Using UI autonomous game loop (shared service)            ║
╚════════════════════════════════════════════════════════════╝

✓ Theme set: Fantasy
✓ World generated with 5 NPCs
✓ Autonomous service initialized

═══ Game Loop Starting ═══

[Iteration 1]
  Action: talk to Kaelith Sunshadow
  ✓ Conversation completed (8 turns)
  
[Iteration 2]
  Action: investigate village
  ⚔️ Combat encounter! (2 Bandits)
  ✓ Combat victory
  ✓ Gained 50 gold, 120 XP
  
[Iteration 3]
  Action: travel to forest
  ⚔️ Combat encounter! (1 Wolf)
  ✓ Combat victory
  
[Iteration 4]
  Action: talk to Kaelvyr Shadowstride
  ✓ Conversation completed (6 turns)
  
[Iteration 5]
  Action: search for items
  ✓ Found: Iron Dagger
  
═══ Game Loop Complete ═══

Session Statistics:
  Theme: fantasy
  Iterations: 5
  Conversations: 2
  Combat encounters: 2
  Actions: 5
  
Combat Statistics:
  Total combats: 2
  Victories: 2
  Defeats: 0
  Gold earned: 75
  XP earned: 180
  
Fallback Statistics:
  Total fallbacks: 0
  ✓ No fallbacks used - all LLM generations successful!
  
✓ THEMED AUTONOMOUS GAME TEST COMPLETE!

This test uses the SAME code as the UI:
• Shared ThemedWorldGenerator
• Shared AutonomousGameService
• Complete gameplay loop (dialogue + combat)
• Combat encounter system
• Action decision AI
• Fallback logging
```

---

## 📚 **Files to Create/Modify**

### **New Files:**
1. `src/services/AutonomousGameService.js` - Shared autonomous logic

### **Modified Files:**
1. `electron/ipc/GameBackend.js` - Use shared service
2. `test-autonomous-themed-game.js` - Use shared service
3. `SHARED_THEMED_WORLD_GENERATOR.md` - Update with autonomous service

---

## 🎯 **Success Criteria**

✅ UI and tests use identical autonomous game loop  
✅ Combat occurs in both UI and tests  
✅ Fallback logging works for combat  
✅ Tests validate actual UI behavior  
✅ No code duplication  
✅ Both modes produce identical gameplay  

---

## 💡 **Additional Benefits**

1. **Headless Testing**: Tests can run full games without UI
2. **Benchmark Testing**: Measure game loop performance
3. **AI Testing**: Test different AI strategies
4. **Regression Testing**: Detect when gameplay changes
5. **Combat Balance**: Tune combat encounter rates

---

## ⚠️ **Important Notes**

### **What the Service Should NOT Include:**

- ❌ UI rendering (`_sendToUI`)
- ❌ Electron window management
- ❌ UI state updates
- ❌ Frontend-specific logic

### **What the Service SHOULD Include:**

- ✅ Game logic (actions, combat, dialogue)
- ✅ AI decision making
- ✅ State management
- ✅ Event emitters (for UI to listen to)
- ✅ Replay logging

### **Event-Driven Architecture:**

```javascript
// Service emits events
service.onEvent('action_decided', { action });
service.onEvent('combat_started', { enemies });
service.onEvent('conversation_started', { npc });

// UI listens and updates UI
service.onEvent = (event, data) => {
  this._sendToUI(`autonomous:${event}`, data);
};

// Test listens and logs
service.onEvent = (event, data) => {
  console.log(chalk.cyan(`[${event}]`), data);
};
```

---

## 🚀 **Next Steps**

1. **Review this plan** - Confirm approach
2. **Phase 1**: Extract `AutonomousGameService`
3. **Phase 2**: Refactor `GameBackend`
4. **Phase 3**: Update test
5. **Phase 4**: Verify and document

**Estimated Time**: 4-5 hours total

---

## 📝 **Summary**

**Current Situation:**
- ✅ UI has full autonomous mode with combat
- ❌ Tests only have dialogue
- ❌ No code sharing between UI and tests

**After Refactoring:**
- ✅ UI and tests use shared `AutonomousGameService`
- ✅ Tests include combat, actions, full gameplay
- ✅ Complete code reuse
- ✅ Tests validate actual UI behavior

**The test will use the exact same autonomous gameplay code as the UI!**
