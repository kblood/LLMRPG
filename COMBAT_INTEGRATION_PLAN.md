# Combat & Travel Integration Plan

## Summary

Combat systems exist but aren't integrated. Need to:
1. Initialize combat systems in GameBackendIntegrated
2. Add combat methods to GameService
3. Wire combat into StandaloneAutonomousGame
4. Add combat AI to protagonist
5. Test end-to-end

## Files To Modify

### 1. electron/ipc/GameBackendIntegrated.js
**Add imports** (DONE):
- CombatEncounterSystem
- CombatSystem
- CombatAI
- GameMaster
- ThemeEngine

**Add to initialize()** (after creating GameService):
```javascript
// Initialize theme for game master
const themeEngine = new ThemeEngine();
themeEngine.setTheme(options.theme || 'fantasy');
const theme = themeEngine.getTheme();

// Initialize GameMaster
this.gameMaster = new GameMaster(this.ollama, null, theme);

// Initialize Combat Systems
this.combatEncounterSystem = new CombatEncounterSystem(this.gameSession, {
  baseEncounterChance: 0.3 // 30% chance for testing
});

this.combatSystem = new CombatSystem(this.gameMaster, this.gameSession, {
  pauseBetweenRounds: 0 // No pause in autonomous mode
});

// Add combat AI to protagonist
protagonist.combatAI = new CombatAI({ behavior: 'balanced' });

// Pass combat systems to GameService
this.gameService.setCombatSystems(this.combatEncounterSystem, this.combatSystem);
```

### 2. src/services/GameService.js
**Add combat methods**:
```javascript
/**
 * Set combat systems (called by GameBackendIntegrated)
 */
setCombatSystems(encounterSystem, combatSystem) {
  this.combatEncounterSystem = encounterSystem;
  this.combatSystem = combatSystem;
}

/**
 * Check if combat should occur at current location
 */
shouldCheckForCombat(location) {
  if (!this.combatEncounterSystem) return false;
  if (!location) return false;
  
  const timeOfDay = this.gameSession.getTimeOfDay();
  return this.combatEncounterSystem.shouldSpawnEnemy(location, timeOfDay);
}

/**
 * Generate combat encounter
 */
async generateCombatEncounter(location) {
  if (!this.combatEncounterSystem) {
    throw new Error('Combat system not initialized');
  }
  
  const timeOfDay = this.gameSession.getTimeOfDay();
  return this.combatEncounterSystem.generateCombatEncounter(
    this.gameSession.protagonist,
    location,
    timeOfDay
  );
}

/**
 * Execute combat
 */
async executeCombat(enemies, encounterData) {
  if (!this.combatSystem) {
    throw new Error('Combat system not initialized');
  }
  
  return await this.combatSystem.executeCombat(
    this.gameSession.protagonist,
    enemies,
    encounterData
  );
}
```

**Modify _executeTravel** to return encounter info:
```javascript
async _executeTravel(data) {
  // ... existing code ...
  
  this.gameSession.visitLocation(resolvedId, location.name);
  const travelTime = this._calculateTravelTime(location);
  this.tick(travelTime);
  
  // NEW: Check for combat encounter
  let encounter = null;
  if (this.shouldCheckForCombat(location)) {
    encounter = await this.generateCombatEncounter(location);
  }
  
  return {
    success: true,
    location,
    timeSpent: travelTime,
    encounter // Return encounter if one was generated
  };
}
```

### 3. src/services/StandaloneAutonomousGame.js
**Replace _checkForCombat()** with real implementation:
```javascript
async _checkForCombat(action, frame, actionResult) {
  // If travel returned an encounter, execute it
  if (actionResult?.encounter) {
    const encounter = actionResult.encounter;
    
    this._emitEvent('combat_started', {
      frame,
      trigger: action.type,
      enemies: encounter.enemies.map(e => e.name),
      location: this.gameService.getCurrentLocation()?.name
    });

    statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.COMBAT_STARTED, {
      trigger: action.type,
      enemies: encounter.enemies.map(e => e.name),
      location: this.gameService.getCurrentLocation()?.name
    });

    try {
      // Execute real combat!
      const combatResult = await this.gameService.executeCombat(
        encounter.enemies,
        encounter
      );

      this._emitEvent('combat_ended', {
        frame,
        outcome: combatResult.outcome,
        rounds: combatResult.rounds,
        xpGained: combatResult.xpGained || 0,
        goldGained: combatResult.goldGained || 0
      });

      statePublisher.publish(this.gameService.getGameState(), EVENT_TYPES.COMBAT_ENDED, {
        outcome: combatResult.outcome,
        rounds: combatResult.rounds,
        xpGained: combatResult.xpGained,
        goldGained: combatResult.goldGained
      });
      
      return combatResult;
    } catch (error) {
      console.error('[StandaloneAutonomousGame] Combat error:', error);
      this._emitEvent('error', {
        frame,
        error: error.message,
        context: 'combat'
      });
    }
  }
  
  return null;
}
```

**Modify _handleAction()** to pass result to combat check:
```javascript
async _handleAction(action, frame) {
  // ... existing code ...
  
  const result = await this.gameService.executeAction(action);
  
  // ... emit events ...
  
  // Check for combat after action (pass the result)
  await this._checkForCombat(action, frame, result);
  
  // ... rest of code ...
}
```

## Testing Requirements

After implementation, test should show:
1. ✅ Protagonist travels to locations
2. ✅ Combat encounter generated (~30% of travels)
3. ✅ Enemies spawned with stats
4. ✅ Combat executes with rounds
5. ✅ Damage dealt to both sides
6. ✅ Victory/defeat outcomes
7. ✅ XP and gold rewards
8. ✅ Combat events sent to UI

## Estimated Lines of Code
- GameBackendIntegrated: +30 lines
- GameService: +80 lines
- StandaloneAutonomousGame: +50 lines (replacing placeholder)
- **Total**: ~160 lines

## Priority: HIGH
This is core gameplay - without it, there's no real game, just conversations.
