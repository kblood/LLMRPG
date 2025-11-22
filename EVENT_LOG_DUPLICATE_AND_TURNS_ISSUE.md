# Event Log Issues - Duplicate Entries & Zero Turns

## Issue 1: Duplicate "Starting Conversation" Events

### Problem
You noticed two identical "💬 Starting conversation with [NPC]" entries appearing in the event log whenever a conversation began.

### Root Cause
Two different listeners were both logging the conversation start event:

**onAutonomousAction() - Line 432:**
```javascript
if (data.type === 'npc_chosen') {
  this.addEventToLog(`💬 Starting conversation with ${data.npcName}`, 'action');
}
```

**showConversationPanel() - Line 612:**
```javascript
this.addEventToLog(`💬 Starting conversation with ${conversationData.npc.name}`, 'conversation-start');
```

Event flow:
```
Backend: autonomousAction event (npc_chosen)
  ↓
onAutonomousAction() fires → Adds "Starting conversation" #1

Backend: autonomousConversationStart event
  ↓
onAutonomousConversationStart() calls showConversationPanel()
  ↓
showConversationPanel() → Adds "Starting conversation" #2 (DUPLICATE)
```

### Fix
Removed the event logging from `onAutonomousAction()` since `showConversationPanel()` (called from the proper `onAutonomousConversationStart()` listener) is the correct place to log it.

**After Fix:**
- Only one "💬 Starting conversation with [NPC]" event appears
- It comes from the authoritative source (showConversationPanel)

---

## Issue 2: Conversations Ending with 0 Turns

### Problem
You observed conversations ending immediately with "─── Conversation ended (0 turns) ───" despite having messages exchanged.

### Root Cause Analysis
The turn count comes from `this.currentConversation.turns.length` in the backend's `endConversation()` method:

```javascript
// GameBackend.js endConversation()
const summary = {
  npcId: this.currentConversation.npcId,
  turns: this.currentConversation.turns.length,  // ← Source of turn count
  finalRelationship: this.currentConversation.npc.relationships.getRelationshipLevel(this.player.id)
};
```

A turn count of 0 means `this.currentConversation.turns` is an empty array, which indicates one of these:

1. **Conversation object never recorded any turns** - Messages were processed but not added to the turns array
2. **Turns array was cleared before ending** - The conversation started but the turns weren't preserved
3. **Conversation ended prematurely** - Some error caused immediate termination
4. **Backend timing issue** - The autonomous action loop ended the conversation before processing messages

### Current Behavior
Even with 0 turns, the UI correctly shows:
- The conversation messages in the event log (because they were sent via `onAutonomousMessage`)
- A separator showing "Conversation ended (0 turns)"
- The next action in the sequence

So from the UI perspective, the messages are visible. The 0 turns counter is a backend tracking issue.

### What This Means
- **For Users**: They can still see the conversation messages in the event log
- **For Logging**: The turn count in replays may be inaccurate
- **For Status**: The separator shows (0 turns) which looks abrupt but doesn't affect visibility

### Potential Backend Issues to Investigate
The backend's autonomous conversation loop in `runAutonomousConversation()` might:
- Not be properly accumulating turns as messages are exchanged
- Have a race condition where the conversation ends before all messages are added to the turns array
- Have different definitions of "turn" between what the conversation tracks and what the UI displays

## Summary

**Issue 1 - FIXED:**
✓ Duplicate "Starting conversation" entries removed
✓ Event now logged only once from the proper source
✓ Clean event log without duplicates

**Issue 2 - IDENTIFIED:**
⚠️ Conversations ending with 0 turns is a backend issue
✓ UI still shows messages correctly (they arrive via separate events)
✓ Users can see the conversation content despite 0 turn count
⚠️ Turn counter in the separator may not reflect actual conversation length
⚠️ Replay logs may have inaccurate turn counts

### Files Changed
- `ui/app.js` (commit 79d2ce5): Removed duplicate event from onAutonomousAction()

### Recommendation for Issue 2
Investigate the backend's `runAutonomousConversation()` and `_parseConversationMessage()` to ensure:
1. The `turns` array is properly accumulated during conversation
2. Turns are added BEFORE the conversation ends
3. The definition of "turn" is consistent throughout the conversation system
