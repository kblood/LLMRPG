# Phase 3 Quick Reference

## 🎯 Current Status: 85% Complete

### ✅ What's Working
- Game runs autonomously without UI
- Combat system fully functional
- Exploration and travel working
- Quests are created and tracked
- Locations are discovered
- State updates reach UI via IPC
- Replay system complete

### ⚠️ Needs Verification
- Quest panel display in UI
- World map panel display in UI
- Combat balance (timeout frequency)

### 🔧 Not Yet Implemented
- Combat round-by-round display in UI

## 📋 Quick Start Guide

### To Test Everything:
```bash
# 1. Make sure Ollama is running
ollama serve

# 2. Run the game
npm run dev

# 3. Start a game and enable autonomous mode
# 4. Watch console (F12) for logs
# 5. Check right sidebar for quests and locations
```

### To Debug Issues:
```bash
# Test state publisher
node tests/diagnose-ui-issues.js

# Test full integration
node tests/test-state-publisher-integration.js
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `MANUAL_TEST_CHECKLIST.md` | Step-by-step testing guide |
| `QUICK_FIX_GUIDE.md` | Debug and fix common issues |
| `PHASE_3_STATUS.md` | Detailed status and next steps |
| `IMPLEMENTATION_STATUS.md` | Architecture overview |
| `WORK_SUMMARY.md` | Complete session summary |
| `README_PHASE3.md` | This quick reference |

## 🔍 Key Things to Check

### Quest Panel (Right Sidebar)
**Location**: UI right sidebar, "⚡ Active Quests" section
**Expected**: 1-3 quests with titles and descriptions
**Console logs**: Search for "updateQuestsDisplay"

### World Map (Right Sidebar)
**Location**: UI right sidebar, "🗺️ World Map" section
**Expected**: 2+ locations, current marked with ➤
**Console logs**: Search for "updateLocationsDisplay"

### Combat
**Location**: Game log (center)
**Expected**: "⚔️ Combat!" followed by victory/defeat
**Console logs**: Search for "CombatSystem"
**Issue**: If always "timeout", needs balance tuning

## 🐛 Common Issues & Fixes

### Quest Panel Empty
1. Check console: Are quests being created? (`[Quest] Created:`)
2. Check console: Is `updateQuestsDisplay()` called?
3. Check DevTools Elements: Does `#quest-list` exist?
4. **Fix**: See `QUICK_FIX_GUIDE.md` → "Quest Panel Not Updating"

### Location Panel Empty
1. Check console: Are locations discovered? (`[GameSession] Discovered:`)
2. Check console: Is `updateLocationsDisplay()` called?
3. Check DevTools Elements: Does `#world-locations` exist?
4. **Fix**: See `QUICK_FIX_GUIDE.md` → "Location Panel Not Updating"

### Combat Always Timeouts
1. Check console: Does combat reach round 20?
2. This means damage too low or HP too high
3. **Fix**: See `QUICK_FIX_GUIDE.md` → "Combat Timeout Issue"

## 🎮 Expected Behavior

### First 30 seconds
- ✅ Game starts, world generated
- ✅ Autonomous mode begins
- ✅ Protagonist talks to NPCs
- ⚠️ Quests appear in quest panel
- ✅ Time advances (08:00 → 08:30)

### Next 1-2 minutes
- ✅ Protagonist decides to travel
- ✅ Travel to new location
- ⚠️ New location appears in world map
- ✅ Combat encounter triggered
- ⚠️ Combat resolves (not timeout)
- ✅ More quests created

### After 5 minutes
- ✅ Multiple locations visited
- ✅ 2-3 combat encounters
- ✅ 3-5 quests active
- ✅ Continuous progression
- ✅ No crashes or errors

## 📊 Test Results Template

```
Date: __________
Duration: ______ minutes

✅/❌ Game starts successfully
✅/❌ Autonomous mode works
✅/❌ Dialogue appears in log
✅/❌ Quests appear in quest panel      ← CRITICAL
✅/❌ Locations appear in world map     ← CRITICAL
✅/❌ Travel between locations works
✅/❌ Combat encounters occur
✅/❌ Combat resolves (not timeout)     ← IMPORTANT
✅/❌ No console errors
✅/❌ UI remains responsive

Critical Issues:
1. ___________________________
2. ___________________________

Minor Issues:
1. ___________________________
2. ___________________________
```

## 🚀 Next Steps

1. **Run manual test** (use `MANUAL_TEST_CHECKLIST.md`)
2. **Document results** (use template above)
3. **Fix critical issues** (use `QUICK_FIX_GUIDE.md`)
4. **Verify fixes work** (run test again)
5. **Move to polish phase** (if everything works)

## 💡 Pro Tips

### Debug with Console
```javascript
// In DevTools console while game is running:

// Check if quest panel exists
document.getElementById('quest-list')

// Check if it has content
document.getElementById('quest-list').innerHTML

// Check if locations panel exists
document.getElementById('world-locations')

// Check its content
document.getElementById('world-locations').innerHTML
```

### Watch the Right Logs
- `[Quest] Created:` → Quests being generated ✅
- `[App] updateQuestsDisplay` → UI function called ✅
- `[App] Quest list updated` → HTML rendered ✅
- `[GameSession] Discovered location` → Location found ✅
- `[App] updateLocationsDisplay` → UI function called ✅
- `[App] World locations updated` → HTML rendered ✅

### Take Screenshots
When testing, capture:
- Full UI showing all panels
- Console with relevant logs
- Any error messages
- Quest panel (empty or full)
- World map panel (empty or full)

## ⏱️ Time Estimates

- Manual test: 10-15 minutes
- Fix quest UI (if broken): 30-60 minutes
- Fix location UI (if broken): 30-60 minutes
- Fix combat balance (if needed): 30-60 minutes
- Add combat rounds to UI: 60-90 minutes
- Final polish: 30-60 minutes

**Total remaining: 2-4 hours**

## 🎯 Success Criteria

Phase 3 is complete when:
- [ ] Quests display in quest panel
- [ ] Locations display in world map
- [ ] Combat resolves correctly (not always timeout)
- [ ] Protagonist travels to 3+ locations
- [ ] No critical bugs or errors
- [ ] 5-minute test run completes successfully

## 📞 Need Help?

1. Check `QUICK_FIX_GUIDE.md` for solutions
2. Check `IMPLEMENTATION_STATUS.md` for architecture
3. Check `PHASE_3_STATUS.md` for detailed status
4. Check `MANUAL_TEST_CHECKLIST.md` for test procedure
5. Check console logs for errors

## 🎉 When Complete

Once Phase 3 is done:
- All three phases complete ✅
- Game fully autonomous ✅
- Combat and exploration working ✅
- UI displaying all state ✅
- Ready for content expansion 🚀

---

**Remember**: The hard part is done! The architecture is solid, the systems work, and the data flows correctly. The remaining work is just verification and polish.

**You've got this!** 💪

