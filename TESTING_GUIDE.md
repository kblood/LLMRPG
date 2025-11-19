# OllamaRPG UI Testing Guide

## Prerequisites

1. **Ollama Service Running:**
   ```bash
   ollama serve
   ```

2. **Model Installed:**
   ```bash
   ollama pull llama3.1:8b
   ```

3. **Dependencies Installed:**
   ```bash
   npm install
   ```

---

## Starting the Application

```bash
npm start
```

This will:
1. Launch the Electron app
2. Initialize the game backend
3. Load 10 NPCs
4. Show the mode selection screen

---

## Test Cases

### ✅ Test 1: UI Loads Correctly

**Expected Result:**
- Window opens with dark fantasy theme
- Welcome screen shows two mode options:
  - "🕹️ Manual Mode - You control the protagonist"
  - "🤖 Autonomous Mode - Watch AI characters interact"
- Status bar shows "Ollama: Connected ✓"
- NPCs panel shows 10 characters
- Quests panel shows "No active quests"

**Pass Criteria:** All UI elements visible and styled correctly

---

### ✅ Test 2: Manual Mode Start

**Steps:**
1. Click "Play Manually" button

**Expected Result:**
- Welcome screen hides
- Conversation panel appears
- Player stats panel appears in sidebar showing:
  - Name: "Kael"
  - Level: "Lv 1"
  - HP: 100/100 (red bar)
  - Stamina: 100/100 (orange bar)
  - Magic: 100/100 (blue bar)
  - XP: 0/100 (purple bar)
- GM narration shows: "Welcome, adventurer! Click on any character to start a conversation."
- NPCs become clickable (cursor changes)
- Manual input area appears at bottom (text box + Send button)
- Status shows: "Manual mode started - Click on an NPC to talk"

**Pass Criteria:** All elements appear, player stats are correct

---

### ✅ Test 3: Start Conversation (Manual Mode)

**Steps:**
1. Start manual mode (Test 2)
2. Click on any NPC (e.g., "Garrett Ironforge")

**Expected Result:**
- NPC name appears in conversation header: "Garrett Ironforge"
- NPC role appears: "Village Blacksmith"
- GM narration updates with contextual description
- Relationship badge shows value (initially 0)
- Empty dialogue history
- Input box is focused and ready
- Status shows: "Talking to Garrett Ironforge"

**Pass Criteria:** Conversation UI updates correctly

---

### ✅ Test 4: Send Message (Manual Mode)

**Steps:**
1. Start conversation with an NPC (Test 3)
2. Type a message: "Hello! How are you today?"
3. Press Enter or click Send

**Expected Result:**
- Input clears immediately
- Player message appears in dialogue history (right-aligned, blue border)
- Input and Send button disable briefly
- Status shows: "Waiting for response..."
- NPC response appears after 2-3 seconds (left-aligned, gray border)
- Input re-enables
- Status shows: "Your turn"
- Relationship value may change
- Conversation continues smoothly

**Pass Criteria:** Message flow works, no errors in console

---

### ✅ Test 5: End Conversation (Manual Mode)

**Steps:**
1. Have an active conversation (Test 4)
2. Click "End Conversation" button

**Expected Result:**
- GM narration updates: "The conversation ends. Click on another character to continue your adventure."
- Input box clears
- Status shows: "Conversation ended - Click on an NPC to talk"
- Can start new conversation immediately

**Pass Criteria:** Clean conversation ending

---

### ✅ Test 6: Multiple Conversations (Manual Mode)

**Steps:**
1. Talk to NPC #1, send 2-3 messages, end conversation
2. Talk to NPC #2, send 2-3 messages, end conversation
3. Talk to NPC #1 again

**Expected Result:**
- Each conversation is independent
- GM narration adapts to context
- Relationship values persist between conversations
- No memory leaks or UI glitches

**Pass Criteria:** Can talk to multiple NPCs sequentially

---

### ✅ Test 7: Autonomous Mode Start

**Steps:**
1. Refresh/restart app
2. Click "Watch AI Play" button

**Expected Result:**
- Mode selector hides
- "Stop Autonomous Mode" button appears
- Status shows: "Autonomous mode started - AI characters are interacting..."
- After a few seconds, conversation panel appears
- AI protagonist chooses an NPC automatically
- Dialogue appears automatically (both protagonist and NPC)
- Turns advance every 2 seconds
- After 5-10 turns, conversation ends
- New conversation starts automatically

**Pass Criteria:** Autonomous mode works (no regression from manual mode addition)

---

### ✅ Test 8: Stop Autonomous Mode

**Steps:**
1. Start autonomous mode (Test 7)
2. Let it run for 10-20 seconds
3. Click "Stop Autonomous Mode" button

**Expected Result:**
- Autonomous mode stops
- Conversation panel hides
- Welcome screen reappears with mode selector
- Replay is saved to ./replays directory
- Status notification: "Replay saved: autonomous_game_[timestamp]_[seed].json"

**Pass Criteria:** Clean shutdown, replay file created

---

### ✅ Test 9: Character Stats Display

**Steps:**
1. Start manual mode
2. Observe player stats panel

**Expected Result:**
- HP bar: 100% filled, red gradient
- Stamina bar: 100% filled, orange gradient
- Magic bar: 100% filled, blue gradient
- XP bar: 0% filled (empty), purple gradient when filled
- Text values match bar percentages
- Smooth CSS transitions on bar width changes

**Pass Criteria:** All bars render correctly with proper colors

---

### ✅ Test 10: DevTools Console Check

**Steps:**
1. Open DevTools (automatically opens)
2. Check Console tab during:
   - App initialization
   - Starting manual mode
   - Sending messages
   - Starting autonomous mode

**Expected Result:**
- No errors (red messages)
- Info logs show:
  - `[App] Initializing OllamaRPG`
  - `[App] Game initialized: {success: true, ...}`
  - `[App] Starting manual mode`
  - `[App] Starting conversation with [npcId]`
  - etc.
- Warnings (yellow) are acceptable for minor issues

**Pass Criteria:** No critical errors

---

## Known Working Features

### ✅ Working Features
- [x] Ollama connection check
- [x] Game initialization
- [x] NPC loading (10 NPCs)
- [x] Mode selection UI
- [x] Manual mode activation
- [x] NPC click to start conversation
- [x] Player message input (text + Enter key)
- [x] NPC AI responses
- [x] GM narration generation
- [x] Relationship tracking
- [x] Conversation end flow
- [x] Character stats display (HP, Stamina, Magic, XP)
- [x] Autonomous mode (existing functionality)
- [x] Replay system (existing functionality)
- [x] Replay viewer (existing functionality)

### ⏳ Not Yet Implemented (Expected Errors)
- [ ] Inventory display (panel exists but no data yet)
- [ ] Equipment display (panel exists but no data yet)
- [ ] Abilities panel (not added yet)
- [ ] Combat system (not added yet)
- [ ] Quest tracker details (panel exists but not functional)
- [ ] World map / navigation (not added yet)
- [ ] Time/weather updates (header shows static "Evening")

---

## Common Issues & Solutions

### Issue: "Ollama: Disconnected ✗"
**Solution:**
1. Make sure Ollama is running: `ollama serve`
2. Check if port 11434 is available
3. Restart the app

### Issue: NPCs not clickable
**Solution:**
1. Make sure you clicked "Play Manually" first
2. Check if `manualMode` is true in DevTools console: `app.manualMode`

### Issue: "Failed to start conversation"
**Solution:**
1. Check DevTools console for specific error
2. Make sure NPC ID exists
3. Try a different NPC

### Issue: Messages not sending
**Solution:**
1. Check if conversation is active
2. Look for network errors in DevTools
3. Verify Ollama is responding: `curl http://localhost:11434/api/version`

### Issue: Player stats show default values
**Solution:**
1. This is expected - backend returns default stats structure
2. Stats are initialized correctly in `GameBackend.js`
3. Values will update when combat/abilities are implemented

---

## Performance Benchmarks

### Expected Performance
- **App Launch:** < 3 seconds
- **Game Initialization:** < 2 seconds
- **Start Conversation:** < 1 second
- **NPC Response:** 2-5 seconds (depends on Ollama)
- **UI Transitions:** < 300ms

### Memory Usage
- **Initial Load:** ~100-150 MB
- **After 10 conversations:** ~200-250 MB
- **Memory Leaks:** None expected

---

## Regression Testing Checklist

After each new feature added, verify:

- [ ] Manual mode still works
- [ ] Autonomous mode still works
- [ ] Replay viewer still works
- [ ] Mode selection works
- [ ] Character stats display correctly
- [ ] No console errors
- [ ] UI animations smooth
- [ ] Ollama connection stable

---

## Next Features to Test (Once Implemented)

### Inventory & Equipment
- [ ] Inventory grid displays items
- [ ] Equipment slots show equipped items
- [ ] Drag-and-drop works
- [ ] Item tooltips appear
- [ ] Equip/unequip updates stats

### Combat System
- [ ] Combat starts when encountering enemy
- [ ] Turn-based actions work
- [ ] HP updates in real-time
- [ ] Victory/defeat screens appear
- [ ] XP rewarded on victory

### Abilities
- [ ] Ability bar shows learned abilities
- [ ] Cooldowns work correctly
- [ ] Resource costs deducted
- [ ] Abilities can be used in combat

---

## Reporting Issues

When reporting bugs, include:
1. **Steps to reproduce**
2. **Expected result**
3. **Actual result**
4. **Console errors** (DevTools → Console tab)
5. **System info** (OS, Node version, Electron version)

---

## Success Criteria

**The UI integration is successful when:**
1. ✅ Manual mode allows full player control
2. ✅ Character stats display correctly
3. ⏳ Inventory/equipment management works
4. ⏳ Combat system is playable
5. ⏳ Abilities can be used
6. ⏳ Quests are trackable
7. ⏳ World navigation works
8. ⏳ Time/weather updates
9. ⏳ Replay system captures all events
10. ⏳ No critical bugs or crashes

**Current Status:** 2/10 complete (20%)

---

*Last Updated: 2025-11-18*
*For issues, check INTEGRATION_PROGRESS.md*
