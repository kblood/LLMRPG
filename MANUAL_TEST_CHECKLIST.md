# Manual Test Checklist - Phase 3 Verification

## Pre-Test Setup

1. **Ensure Ollama is running**
   ```bash
   # In a separate terminal
   ollama serve
   ```

2. **Verify granite4:3b model is available**
   ```bash
   ollama list | grep granite4
   ```

3. **Open DevTools for debugging**
   - Run the app: `npm run dev`
   - Press F12 when UI loads
   - Switch to Console tab
   - Keep it visible during testing

## Test Session: 5-Minute Autonomous Run

### Phase 1: Game Startup (0-30 seconds)

**Actions**:
- [ ] Click "Start New Game"
- [ ] Enter player name (e.g., "TestHero")
- [ ] Select theme (sci-fi recommended for testing)
- [ ] Click "Start"
- [ ] Click "Start Autonomous Mode"

**Expected Results**:
- [ ] Loading screen appears
- [ ] World generation completes
- [ ] Game screen shows
- [ ] "Autonomous mode started" message in game log
- [ ] Character list shows protagonist + NPCs (right sidebar)
- [ ] Time starts at 08:00 (bottom left)
- [ ] Frame counter starts incrementing (bottom right)

**Console Check**:
```
Look for:
✅ [GameBackendIntegrated] Initialization complete
✅ [GameBackendIntegrated] Starting autonomous mode...
✅ [StandaloneAutonomousGame] Running frame N
```

**Issues to Watch For**:
❌ "Protagonist not found"
❌ "Ollama not available"
❌ JavaScript errors in console

---

### Phase 2: Initial Dialogue & Quests (30-90 seconds)

**Expected Results**:
- [ ] Game log shows dialogue between protagonist and NPCs
- [ ] Narrator messages appear (from "The Chronicler")
- [ ] Quests are created (check console for "[Quest] Created: ...")
- [ ] **Quest panel (right side) shows 1-3 active quests**
- [ ] Each quest has a title and description
- [ ] Quests are color-coded (gold for main, blue for side)

**Console Check**:
```
Look for:
✅ [Quest] Created: [Quest Title]
✅ [App] updateQuestsDisplay called with: Array(N)
✅ [App] Active quests: N
✅ [App] Rendering N active quests
✅ [App] Quest list updated with HTML
```

**UI Elements to Check**:
- [ ] Right sidebar has "⚡ Active Quests" panel
- [ ] Panel is NOT showing "No active quests"
- [ ] Quest titles are visible and readable
- [ ] Quest descriptions are present

**Take a Screenshot**: `quests-working.png` or `quests-broken.png`

**If Quests Don't Show**:
1. Check console - Are quests being created?
2. Check console - Is `updateQuestsDisplay()` being called?
3. Check Elements tab - Does `#quest-list` exist?
4. Check Elements tab - Does it have content or is it empty?

---

### Phase 3: Travel & Exploration (90-180 seconds)

**Expected Results**:
- [ ] Protagonist decides to travel
- [ ] "🛤️ Traveled from [X] to [Y]" message in game log
- [ ] **World Map panel (right side) shows discovered locations**
- [ ] At least 2 locations visible
- [ ] Current location marked with ➤ symbol
- [ ] Location names and danger levels displayed
- [ ] Visited locations have different color than undiscovered

**Console Check**:
```
Look for:
✅ [GameSession] Visited location: [Location Name]
✅ [GameSession] Discovered location: [Location Name]
✅ [App] updateLocationsDisplay called with: {...}
✅ [App] Discovered locations: N
✅ [App] World locations updated with HTML
```

**UI Elements to Check**:
- [ ] Right sidebar has "🗺️ World Map" panel
- [ ] Panel is NOT showing "Exploring..."
- [ ] Location names are visible
- [ ] Current location is marked
- [ ] Danger levels shown (safe/low/medium/high)

**Take a Screenshot**: `locations-working.png` or `locations-broken.png`

**If Locations Don't Show**:
1. Check console - Are locations being discovered?
2. Check console - Is `updateLocationsDisplay()` being called?
3. Check console - How many locations in database?
4. Check Elements tab - Does `#world-locations` exist?

---

### Phase 4: Combat Encounter (180-300 seconds)

**Expected Results**:
- [ ] "⚔️ Combat! Encountered [Enemy]" message in game log
- [ ] Combat narration appears
- [ ] Combat executes (watch frame counter continue)
- [ ] Combat resolves in < 20 rounds
- [ ] "⚔️ Combat ended in victory!" or similar message
- [ ] If victory: "💰 Combat victory! Gained X XP" message
- [ ] Protagonist HP bar may decrease
- [ ] Time advances during combat

**Console Check**:
```
Look for:
✅ [CombatEncounterSystem] Enemy encounter triggered at [Location]
✅ [CombatSystem] Starting combat: [Hero] vs [Enemy]
✅ [CombatSystem] Combat Round 1
✅ [CombatSystem] Combat Round 2
... (should NOT reach Round 20 every time)
✅ [GameService] Combat ended: victory/defeat
```

**Combat Outcome Check**:
- [ ] Combat ends in **victory** (best case)
- [ ] Combat ends in **defeat** (acceptable)
- [ ] Combat ends in **timeout** (needs fixing if happens every time)

**If Combat Always Timeouts**:
1. Check console - Are both combatants alive after 20 rounds?
2. This means damage is too low or HP too high
3. Needs balance tuning (see QUICK_FIX_GUIDE.md)

**Take a Screenshot**: `combat-working.png` or `combat-timeout.png`

---

### Phase 5: Continued Play (300+ seconds)

**Let the game continue running**:
- [ ] More dialogue
- [ ] More travel
- [ ] More quests created
- [ ] More combat encounters
- [ ] No crashes or freezes
- [ ] Frame counter continues incrementing
- [ ] Time advances (morning → afternoon → evening)

**Watch For**:
- Memory usage increasing significantly
- Console errors
- UI becoming unresponsive
- Game log filling up and slowing down

---

## Post-Test Checklist

### UI Verification

**Left Sidebar (Player Stats)**:
- [ ] Player name visible
- [ ] HP bar present and updates
- [ ] Stamina bar present
- [ ] Magic bar present
- [ ] XP bar present
- [ ] Level shown
- [ ] Gold amount shown

**Right Sidebar (World Info)**:
- [ ] **Active Quests panel populated** ⭐
- [ ] **World Map panel populated** ⭐
- [ ] Character list shows NPCs
- [ ] All panels have content (not empty)

**Center Area (Game Log)**:
- [ ] Dialogue messages visible
- [ ] Action messages visible (travel, rest, etc.)
- [ ] Combat messages visible
- [ ] Narrator messages visible
- [ ] Messages are scrollable
- [ ] Auto-scrolls to bottom

**Bottom Status Bar**:
- [ ] Time display (left) - HH:MM format
- [ ] Time of day (left) - Morning/Afternoon/etc.
- [ ] Session info (center) - Shows seed or day
- [ ] Frame counter (right) - Incrementing number

### Data Verification

**Check Final State**:
1. How many quests are active? (Should be 1-5)
2. How many locations discovered? (Should be 2-4)
3. How many combat encounters? (Should be 1-3)
4. Did protagonist travel? (Should visit 2+ locations)
5. Did any combats end in victory? (Should be yes)

### Console Errors

**Review Console Tab**:
- [ ] No RED error messages
- [ ] No "Cannot find..." errors
- [ ] No "undefined is not a function" errors
- [ ] No "Failed to..." errors

If errors exist, copy them to a file for debugging.

---

## Test Results Form

**Date**: _____________
**Tester**: _____________
**Duration**: _____ minutes

### Overall Status
- [ ] PASS - Everything works as expected
- [ ] PARTIAL - Some features work, some don't
- [ ] FAIL - Major issues prevent testing

### Feature Results

| Feature | Status | Notes |
|---------|--------|-------|
| Game startup | ☐ Pass ☐ Fail | |
| Autonomous mode | ☐ Pass ☐ Fail | |
| Dialogue system | ☐ Pass ☐ Fail | |
| Quest creation | ☐ Pass ☐ Fail | |
| **Quest UI display** | ☐ Pass ☐ Fail | **CRITICAL** |
| Travel system | ☐ Pass ☐ Fail | |
| **Location UI display** | ☐ Pass ☐ Fail | **CRITICAL** |
| Combat encounters | ☐ Pass ☐ Fail | |
| Combat resolution | ☐ Pass ☐ Fail | |
| Combat outcome | ☐ Victory ☐ Timeout ☐ Defeat | |
| UI responsiveness | ☐ Pass ☐ Fail | |
| No crashes | ☐ Pass ☐ Fail | |

### Critical Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Minor Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Screenshots Taken

- [ ] quests-panel.png
- [ ] locations-panel.png
- [ ] combat-log.png
- [ ] console-logs.png
- [ ] full-ui.png

### Recommendations

Priority 1 (Must Fix):
- _______________________________________________

Priority 2 (Should Fix):
- _______________________________________________

Priority 3 (Nice to Have):
- _______________________________________________

---

## Quick Reference: Where to Look

**For Quest Issues**:
- Console: Search for "updateQuestsDisplay"
- Elements: Find `#quest-list` element
- Code: `ui/app.js` lines 608-651

**For Location Issues**:
- Console: Search for "updateLocationsDisplay"
- Elements: Find `#world-locations` element
- Code: `ui/app.js` lines 653-697

**For Combat Issues**:
- Console: Search for "Combat"
- Code: `src/systems/combat/CombatSystem.js`
- Logs: Look for round counts

**For State Issues**:
- Console: Search for "[App] Handling state update"
- Code: `ui/app.js` lines 424-502
- Test: Run `node tests/diagnose-ui-issues.js`

---

## After Testing

1. **Save console logs**:
   - Right-click in console
   - "Save as..." → `test-console-logs.txt`

2. **Take screenshots** of:
   - Full UI showing all panels
   - DevTools console with relevant logs
   - Any error messages

3. **Update test results** in this document

4. **If issues found**, reference:
   - `QUICK_FIX_GUIDE.md` for solutions
   - `IMPLEMENTATION_STATUS.md` for context
   - `PHASE_3_STATUS.md` for detailed status

5. **If everything works**, celebrate! 🎉
   - Phase 3 is complete
   - All three phases done
   - Game is ready for next steps

