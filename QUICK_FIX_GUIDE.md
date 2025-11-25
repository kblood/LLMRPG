# Quick Fix Guide - UI Issues

## Problem Summary

The game is running correctly and state is being published properly. The StatePublisher diagnostic confirms all data is present and formatted correctly. The issue is in the UI rendering.

## Verified Working ✅
- State Publisher sends complete data
- Quest objects have title, status, type, description
- Location objects have id, name, dangerLevel
- Protagonist data is complete
- IPC bridge forwards updates

## Issues in UI Layer 🔧

### Issue 1: Quests Not Displaying

**Root Cause**: The `updateQuestsDisplay()` function is being called, but either:
1. The quests array is empty when it reaches the UI
2. The HTML element (#quest-list) is being cleared by another function
3. The quest filter (status === 'active') is removing all quests

**Debug Steps**:
1. Open DevTools Console in Electron app
2. Look for: `[App] updateQuestsDisplay called with:`
3. Check if quests array has items
4. Check if `questListEl` is found
5. Check if activeQuests filter returns items

**Fix Applied**:
```javascript
// Already added in app.js lines 608-651
// Added comprehensive logging
// Added quest tracking to avoid duplicate log entries
// Will show in console what's happening
```

**Manual Test**:
1. Run `npm run dev`
2. Start game
3. Watch console for:
   - `[App] updateQuestsDisplay called with: [...]`
   - `[App] Active quests: N`
   - `[App] Rendering N active quests`
4. If you see quests in console but not in UI, check HTML rendering

### Issue 2: Locations Not Displaying

**Root Cause**: `updateLocationsDisplay()` was incomplete - only updated count, not the actual list.

**Fix Applied**:
```javascript
// Already implemented in app.js lines 653-697
// Now renders full location list with:
// - Current location marked with ➤
// - Visited vs unvisited styling
// - Danger level display
```

**Manual Test**:
1. Run app
2. Check "#world-locations" element
3. Should show discovered locations
4. Console will log: `[App] World locations updated with HTML`

### Issue 3: Combat Timeouts

**Likely Causes**:
1. Both combatants have high defense, most attacks miss
2. Damage is too low relative to HP
3. RNG is causing all attacks to miss
4. Equipment/stats are unbalanced

**Investigation Needed**:
Add logging to CombatManager.js `_processAttack()`:
```javascript
// Around line 240
console.log('[Combat] Attack:', {
  attacker: attacker.name,
  target: target.character.name,
  baseDamage,
  attackBonus,
  totalDamage: damage,
  targetHPBefore: target.character.stats.currentHP,
  targetHPAfter: target.character.stats.currentHP - damageResult.damageDealt,
  hit: true,
  critical: isCritical
});
```

**Quick Fix** (if needed):
```javascript
// In CombatEncounterSystem.js enemy generation
// Reduce enemy HP or increase player damage
// Or reduce maxRounds in CombatSystem.js from 20 to 10
```

## How to Verify Fixes

### 1. Run with Console Open
```bash
npm run dev
```
Then press F12 to open DevTools

### 2. Watch for These Logs
```
[App] updateQuestsDisplay called with: [...]
[App] Active quests: 1
[App] Rendering 1 active quests
[App] Quest list updated with HTML

[App] updateLocationsDisplay called with: {...}
[App] Discovered locations: 2
[App] World locations updated with HTML
```

### 3. Check UI Elements

**Quest Panel** (right side):
- Should show "⚡ Active Quests"
- Should list quests with titles and descriptions
- Each quest should have colored border (main = gold, side = blue)

**World Map Panel** (right side):
- Should show "🗺️ World Map"
- Should list discovered locations
- Current location marked with ➤
- Visited locations have different color

### 4. Check State in Console

In DevTools console, run:
```javascript
// This won't work directly but shows what to check
// Look for these in the logs instead
```

## If Quests Still Don't Show

### Check 1: Element Exists
In DevTools Elements tab, search for `id="quest-list"`
- Should be in right sidebar
- Should not be hidden or display:none

### Check 2: CSS Not Hiding
Check if `.quest-item` has `display: none` or `visibility: hidden`

### Check 3: Timing Issue
The quest might be created before UI is ready.
- Check if `handleStateUpdate()` is called AFTER UI elements are created
- Verify `document.getElementById('quest-list')` returns an element

### Check 4: Data Structure
Quest objects MUST have:
```javascript
{
  id: 'quest_1',
  title: 'Quest Title',
  description: 'Quest description',
  type: 'main' or 'side',
  status: 'active'
}
```

## Combat Balance Tuning

If combat always times out:

### Option 1: Increase Damage
```javascript
// src/systems/combat/CombatManager.js line 230
const baseDamage = weapon?.stats?.attack || 10; // Was 5, now 10
```

### Option 2: Reduce Enemy HP
```javascript
// src/systems/combat/CombatEncounterSystem.js
// In _generateEnemy(), reduce HP multiplier
```

### Option 3: Increase Hit Chance
```javascript
// src/systems/combat/CombatManager.js around line 212
// Adjust hit calculation to favor hits more
const hitChance = Math.min(0.95, 0.6 + (attackerDex - targetDex) * 0.05);
```

### Option 4: Reduce Max Rounds (Temporary)
```javascript
// src/systems/combat/CombatSystem.js line 45
maxRounds: options.maxRounds || 10, // Was 20
```

## Expected Behavior After Fixes

1. **Start Game**: See starting location in World Map
2. **Frame 1-5**: Protagonist talks to NPCs, quests are created
3. **Quest appears**: Quest panel shows 1-2 quests with titles
4. **Travel**: Protagonist moves to new location
5. **New location**: World Map shows 2 locations, current one marked with ➤
6. **Combat**: Encounter message, combat resolves in 5-10 rounds
7. **Victory**: "Combat victory! Gained X XP" message
8. **Continue**: More quests, more locations, more combat

## Testing Checklist

- [ ] Quests appear in quest panel
- [ ] Locations appear in world map
- [ ] Current location is marked
- [ ] Combat resolves within 10 rounds
- [ ] Combat victory gives rewards
- [ ] Time updates (bottom left)
- [ ] Frame count updates (bottom right)
- [ ] Game log shows dialogue
- [ ] Game log shows actions (travel, rest)
- [ ] Player stats update (HP bar, etc.)

## If Still Broken

### Last Resort Debug
Add this to start of `handleStateUpdate()` in app.js:
```javascript
console.log('[App] FULL STATE:', JSON.stringify(state, null, 2));
```

This will dump the entire state to console. Check:
1. Is quests.active populated?
2. Is location.database populated?
3. Is characters.protagonist there?

If yes to all 3 but UI still doesn't update:
- Problem is in HTML rendering
- Check browser console for JavaScript errors
- Check if elements exist in DOM
- Check if CSS is hiding elements

### Nuclear Option
If nothing works, try commenting out these lines in app.js:
```javascript
// Around line 1476 and 1564
// These might be clearing the panels at wrong time
// document.getElementById('quest-list').innerHTML = '';
// document.getElementById('world-locations').innerHTML = '';
```

## Success Criteria

You'll know it's working when:
1. Quest panel shows at least 1 quest within first 30 seconds
2. World map shows at least 2 locations within first minute
3. Combat happens and resolves (not timeout) within 2 minutes
4. Game log actively shows dialogue and actions
5. All UI panels update in real-time as game progresses

## Console Output to Look For

**Good:**
```
[App] updateQuestsDisplay called with: Array(1)
[App] Active quests: 1
[App] Rendering 1 active quests
[App] Quest list updated with HTML
```

**Bad:**
```
[App] updateQuestsDisplay called with: Array(0)
[App] Active quests: 0
```

Or no logs at all (means function not being called).

