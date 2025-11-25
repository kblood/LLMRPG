# Action Plan - Complete Phase 3

## Immediate Next Steps (In Order)

### Step 1: Manual Test (15 minutes) 🔍

**Goal**: Verify what's working and what needs fixes

**Actions**:
1. Open `MANUAL_TEST_CHECKLIST.md`
2. Start Ollama: `ollama serve`
3. Run game: `npm run dev`
4. Follow checklist step-by-step
5. Take screenshots of:
   - Quest panel (right sidebar)
   - World map panel (right sidebar)
   - Console logs
   - Any errors

**Expected Outcomes**:
- Know if quest panel works
- Know if location panel works
- Know combat timeout frequency
- Have evidence for debugging

**Time**: 15 minutes

---

### Step 2: Fix Quest Panel (if broken) 🔧

**Only if**: Quest panel is empty during test

**Debug Process**:
1. Check console for: `[App] updateQuestsDisplay called with: Array(N)`
2. If N > 0 but panel empty:
   ```javascript
   // In DevTools console:
   document.getElementById('quest-list').innerHTML
   // Should show HTML, not empty
   ```
3. If still empty, check `ui/app.js` line 620:
   ```javascript
   if (questListEl && quests.length > 0) {
   ```
   Add before this:
   ```javascript
   console.log('[DEBUG] questListEl:', questListEl);
   console.log('[DEBUG] quests:', quests);
   ```

**Likely Fix**:
- Quest status might be !== 'active'
- Quest type field missing
- Element not found (wrong ID)

**Fallback Fix**:
```javascript
// In app.js, replace line 622:
const activeQuests = quests.filter(q => q.status === 'active');
// With:
const activeQuests = quests; // Show all quests regardless of status
```

**Time**: 30-60 minutes

---

### Step 3: Fix Location Panel (if broken) 🗺️

**Only if**: World map panel shows "Exploring..." after travel

**Debug Process**:
1. Check console for: `[App] updateLocationsDisplay called with: {...}`
2. Check: `[App] Discovered locations: N` (should be > 0)
3. If N > 0 but panel empty:
   ```javascript
   // In DevTools console:
   document.getElementById('world-locations').innerHTML
   ```

**Likely Fix**:
- Location database not populated
- Discovered array empty
- Element rendering issue

**Fallback Fix**:
```javascript
// In app.js updateLocationsDisplay, add at start:
console.log('[DEBUG] locationState:', JSON.stringify(locationState, null, 2));
// This will show exactly what data is available
```

**Time**: 30-60 minutes

---

### Step 4: Verify Fixes (10 minutes) ✅

**Actions**:
1. Restart game: `npm run dev`
2. Run test again
3. Verify quest panel now shows quests
4. Verify world map now shows locations
5. Take "after" screenshots

**Success Criteria**:
- Quest panel populated
- World map populated
- No console errors

**Time**: 10 minutes

---

### Step 5: Combat Balance (if needed) ⚔️

**Only if**: Combat timeouts > 50% of encounters

**Diagnosis**:
1. Add logging to `src/systems/combat/CombatManager.js` line 241:
   ```javascript
   console.log('[Combat] Damage:', {
     attacker: attacker.name,
     damage: damageResult.damageDealt,
     targetHP: target.character.stats.currentHP
   });
   ```
2. Run game and watch combat
3. Check if damage is being dealt

**Quick Fixes**:

**Option A: Increase Damage**
```javascript
// src/systems/combat/CombatManager.js line 230
const baseDamage = weapon?.stats?.attack || 10; // Was 5
```

**Option B: Reduce Max Rounds**
```javascript
// src/systems/combat/CombatSystem.js line 45
maxRounds: options.maxRounds || 10, // Was 20
```

**Option C: Increase Hit Chance**
```javascript
// src/systems/combat/CombatManager.js around line 215
const hitChance = Math.min(0.95, 0.65 + (attackerDex - targetDex) * 0.05);
// Was 0.5 base, now 0.65
```

**Time**: 30-60 minutes

---

### Step 6: Final Integration Test (15 minutes) 🧪

**Goal**: Verify everything works together

**Actions**:
1. Clean start: Close everything, restart Ollama
2. Fresh game session
3. Let run for 10 minutes
4. Verify all checkboxes in `README_PHASE3.md`:
   - [ ] Quests display
   - [ ] Locations display
   - [ ] Combat resolves correctly
   - [ ] No crashes
   - [ ] UI responsive

**Success Criteria**:
- All items checked ✅
- No critical bugs
- Screenshots show working UI

**Time**: 15 minutes

---

### Step 7: Optional - Combat Round Display (60-90 minutes) 🎨

**Only if**: Have extra time and Steps 1-6 complete

**Goal**: Show individual combat rounds in game log

**Implementation**:

**Add to `ui/app.js` setupAutonomousListeners()**:
```javascript
// After line 800, add:
this.gameAPI.onCombatRound((data) => {
  const round = data.roundNumber;
  const actions = data.actions || [];
  
  actions.forEach(action => {
    let message = `Round ${round}: ${action.character} ${action.action}`;
    if (action.target) {
      message += ` ${action.target}`;
    }
    if (action.damage) {
      message += ` for ${action.damage} damage`;
    }
    this.addEventToLog(message, 'combat-action');
  });
});
```

**Add to `electron/GameBackendIntegrated.js`**:
```javascript
// Subscribe to combat turn events
this.eventBus.on('combat:turn_executed', (data) => {
  if (this.uiCallback) {
    this.uiCallback({
      type: 'combat_round',
      data
    });
  }
});
```

**Add to `electron/preload.js`**:
```javascript
onCombatRound: (callback) => {
  ipcRenderer.on('game:combat-round', (event, data) => {
    callback(data);
  });
},
```

**Time**: 60-90 minutes

---

## Summary Timeline

### Minimum Path (Phase 3 Complete)
1. Manual test: 15 min
2. Fix quest panel: 30-60 min (if needed)
3. Fix location panel: 30-60 min (if needed)
4. Verify fixes: 10 min
5. Combat balance: 30-60 min (if needed)
6. Final test: 15 min

**Total: 2-4 hours**

### Full Path (With Combat Rounds)
- Minimum path: 2-4 hours
- Combat round display: 60-90 min

**Total: 3-5.5 hours**

---

## Decision Tree

```
START
  ↓
Manual Test (15min)
  ↓
  ├─ Quests work? ─ NO → Fix quests (30-60min) ┐
  │                                              │
  ↓ YES                                          │
  ├─ Locations work? ─ NO → Fix locations (30-60min) ┐
  │                                                    │
  ↓ YES                                                │
  ←───────────────────────────────────────────────────┘
  ↓
Verify Fixes (10min)
  ↓
  ├─ Combat timeouts > 50%? ─ YES → Balance combat (30-60min)
  │
  ↓ NO
Final Test (15min)
  ↓
  ├─ All working? ─ YES → PHASE 3 COMPLETE! 🎉
  │
  ↓ NO
Iterate (back to debug)

If time permits:
  ↓
Add Combat Rounds (60-90min)
  ↓
FULLY COMPLETE! 🚀
```

---

## Quick Reference

### Files to Edit (if fixes needed)

**Quest Panel**:
- `ui/app.js` lines 608-651

**Location Panel**:
- `ui/app.js` lines 653-697

**Combat Balance**:
- `src/systems/combat/CombatSystem.js` line 45 (maxRounds)
- `src/systems/combat/CombatManager.js` line 230 (baseDamage)
- `src/systems/combat/CombatManager.js` ~line 215 (hitChance)

**Combat Rounds**:
- `ui/app.js` (add listener)
- `electron/GameBackendIntegrated.js` (add event)
- `electron/preload.js` (add API)

### Commands to Remember

```bash
# Start Ollama
ollama serve

# Run game
npm run dev

# Test state publisher
node tests/diagnose-ui-issues.js

# Full integration test
node tests/test-state-publisher-integration.js
```

### Console Searches

```
updateQuestsDisplay    → Check quest rendering
updateLocationsDisplay → Check location rendering
[Quest] Created        → Quest generation
[GameSession] Visited  → Location changes
CombatSystem          → Combat execution
Error                 → Find errors
```

---

## Success Indicators

**You're done when**:
1. ✅ Quest panel shows active quests
2. ✅ World map shows discovered locations
3. ✅ Combat resolves (not always timeout)
4. ✅ 10-minute test completes without crashes
5. ✅ Console has no critical errors
6. ✅ All Phase 3 criteria met (see `PHASE_3_STATUS.md`)

**Celebrate! 🎉** All three phases complete!

---

## If You Get Stuck

1. **Check** `QUICK_FIX_GUIDE.md` for specific solutions
2. **Review** console logs for error messages
3. **Test** individual components with diagnostic scripts
4. **Verify** data flow: StatePublisher → IPC → UI
5. **Simplify** by testing one feature at a time
6. **Document** what you find for future reference

---

## After Completion

### Update Documentation
- [ ] Mark Phase 3 as complete in `PHASE_3_STATUS.md`
- [ ] Update `README.md` with current status
- [ ] Document any edge cases found
- [ ] Note any combat balance values used

### Create Release
- [ ] Tag version (e.g., v0.3.0)
- [ ] Create save file for demo
- [ ] Take screenshots/video of working game
- [ ] Write release notes

### Plan Next Steps
- Content expansion (more locations, quests, NPCs)
- UI polish (animations, effects, sounds)
- Balance tuning (based on playtesting)
- Additional features (crafting, skills, etc.)

---

**Remember**: The foundation is solid. You're in the polish phase now!

**Let's get it done!** 💪🚀

