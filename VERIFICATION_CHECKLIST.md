# UI Verification Checklist

## How to Verify the Fixes

### 1. Start the Application
```bash
npm start
```

### 2. Open DevTools
Press `Ctrl+Shift+I` (or `Cmd+Option+I` on Mac) to open Developer Tools

### 3. Check Browser Console for Errors
Look for any JavaScript errors in the console. Common issues:
- ❌ `Cannot read property 'X' of undefined`
- ❌ `Element with id 'X' not found`
- ✅ `[App] Game update #X received`
- ✅ `[App] Handling state update: ...`

### 4. Start Autonomous Mode
Click "Watch AI Play" button and observe:

#### Expected Console Logs (Browser Console):
```
[App] Game update #1 received: state_update game_started
[App] Handling state update: game_started Frame: 0
[App] State structure: { hasTime: true, hasProtagonist: true, ... }
[App] Game update #2 received: state_update frame_update
[App] updateQuestsDisplay called with: [...]
[App] Active quests: X
[App] Rendering X active quests
[App] Quest list updated with HTML
[App] updateLocationsDisplay called with: {...}
[App] Discovered locations: X
```

#### Expected UI Updates:
1. **Bottom Right Corner**: Frame count increasing (e.g., "Running... Frame 15")
2. **Quests Panel**: 
   - Title shows "⚡ Active Quests **5**" (number increases)
   - Quest list shows quest titles and descriptions
3. **World Map Panel**:
   - Title shows "🗺️ World Map **7**" (number of discovered locations)
   - Location names listed
4. **Game Log** (middle area):
   - Dialogue lines: "Captain Harris: Hello there..."
   - Travel actions: "📍 Traveled to Noctropolis Central"
   - Combat: "⚔️ Combat started" / "⚔️ Combat ended: victory"
   - Quests: "📜 New Quest: Investigate the Anomaly"
   - Rest: "😴 Rested and recovered"

### 5. Check Electron Main Console
The terminal where you ran `npm start` should show:

```
[Main] Sending UI update #1: state_update game_started
[Main] Sending UI update #2: state_update frame_update
[GameBackendIntegrated] State update #3: dialogue_line, Frame: 3
[Quest] Created: Anomaly Investigation
[GameSession] Visited location: Aetherium Prime
```

## Troubleshooting

### Issue: No Console Logs in Browser Console
**Problem**: The browser console is completely empty or only shows initial loading messages.

**Solution**:
1. Check if DevTools is open (press Ctrl+Shift+I)
2. Make sure you're on the "Console" tab, not "Elements" or "Network"
3. Try clicking "Clear console" button and restart autonomous mode

### Issue: Console Shows "Cannot read property 'status' of undefined"
**Problem**: Quest objects don't have status field.

**Solution**: This should be fixed now. If you still see it:
1. Make sure you saved `src/systems/quest/QuestManager.js`
2. Restart the Electron app
3. Check if the QuestManager fix is present:
```javascript
status: q.state, // Map state to status for UI
```

### Issue: Console Shows "Cannot find element with id 'quest-count'"
**Problem**: HTML elements for counts are missing.

**Solution**: This should be fixed now. If you still see it:
1. Make sure you saved `ui/index.html`
2. Hard reload the page (Ctrl+Shift+R)
3. Check if the HTML has `<span id="quest-count" class="count-badge">0</span>`

### Issue: Quests/Locations Count Shows "0" But Console Shows Data
**Problem**: Data is being received but not displayed.

**Possible Causes**:
1. CSS issue - count badge might be hidden or not styled
2. JavaScript error preventing update
3. Element selector is wrong

**Debug Steps**:
1. In DevTools Console, type: `document.getElementById('quest-count')`
2. Should return: `<span id="quest-count" class="count-badge">0</span>`
3. Try manually updating: `document.getElementById('quest-count').textContent = '5'`
4. If that works, the issue is in the JavaScript update logic

### Issue: Game Log (Dialogue Area) Is Empty
**Problem**: Dialogue and actions aren't being added to the log.

**Check**:
1. Browser console for errors in `addMessageToHistory()` or `addEventToLog()`
2. Try typing in console: `document.getElementById('dialogue-history')`
3. Should return a `<div>` element, not `null`

### Issue: State Updates Stop After a Few Frames
**Problem**: The autonomous game stops updating after initial frames.

**Possible Causes**:
1. LLM error (Ollama not responding)
2. JavaScript error breaking the event loop
3. Combat system timeout

**Check**:
1. Browser console for errors
2. Electron main console for error messages
3. Look for messages like:
   - `[StandaloneAutonomousGame] Error: ...`
   - `[GameService] Failed to execute action: ...`
   - `[CombatSystem] Combat ended: timeout`

## Success Criteria

✅ **All of these should work:**
1. Quest count badge updates as quests are created
2. Quest panel shows quest titles in a list
3. Location count badge updates as locations are discovered
4. World Map panel shows location names
5. Game log shows dialogue lines with speaker names
6. Game log shows travel actions ("📍 Traveled to...")
7. Game log shows combat events ("⚔️ Combat started/ended")
8. Frame counter updates in bottom right
9. Time display updates (top right)
10. No JavaScript errors in console

## Advanced Debugging

### Enable Verbose Logging
To see every state update structure, check the console for:
```
[App] State structure: {
  hasTime: true,
  hasCharacters: true,
  hasProtagonist: true,
  hasQuests: true,
  hasQuestsActive: true,
  questsCount: 5,
  hasLocation: true,
  locationDiscovered: 7
}
```

This tells you exactly what data is in each state update.

### Inspect State Object
In browser console, after a few updates, type:
```javascript
// This will show you the last state update structure
console.log(JSON.stringify(lastState, null, 2))
```

(You'll need to modify app.js to store `this.lastState = state` in `handleStateUpdate` method)

### Check Quest Structure
Type in browser console:
```javascript
// Should show array of quests with status field
state.quests.active.forEach(q => console.log(q.title, q.status, q.type))
```

## Summary

The fixes implemented:
1. ✅ Added `status` field to quest serialization
2. ✅ Added `quest-count` and `location-count` HTML elements
3. ✅ Added CSS styling for count badges
4. ✅ Added comprehensive logging for debugging

If you follow this checklist and still see issues, note:
- Exact error message from browser console
- Screenshot of UI showing what's missing
- Contents of Electron main console logs
- Whether you can see any data at all in browser DevTools > Elements tab
