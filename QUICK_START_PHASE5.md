# Quick Start - Phase 5 Features

## 🚀 What's New

You now have **two major new features**:

### 1. Enhanced Quest Detection
Quests now emerge naturally from conversation without explicit requests.

### 2. Group Conversations
3+ characters can talk in one conversation with smart turn-taking.

---

## ⚡ Quick Usage

### Enhanced Quest Detection

```javascript
// Quests auto-detect from natural dialogue
const session = new GameSession({
  autoDetectQuests: true  // Default: true
});

// Just talk naturally
await session.startConversation(npcId);
await session.addConversationTurn(convId, npcId, "How are things?");
// If NPC mentions problems → Quest created automatically!
```

### Group Conversations

```javascript
// Start a group conversation (3+ participants)
const groupId = await session.startGroupConversation(
  ['mara', 'aldric', 'finn', 'player'],
  { situation: 'Discussing thefts at the tavern' }
);

// Add turns
await session.addGroupConversationTurn(groupId, 'player', "What happened?");
await session.addGroupConversationTurn(groupId, 'mara', "Supplies are missing...");

// Get next speaker suggestion
const nextSpeaker = session.suggestNextSpeaker(groupId, 'mara');

// End when done
session.endGroupConversation(groupId);
```

---

## 🧪 Testing

```bash
# Test enhanced quest detection
node test-enhanced-quest-detection.js

# Test group conversations
node test-group-conversations.js

# Play interactively
node play-advanced.js
```

---

## 📊 What Changed

### New Systems
- `QuestDetector` - Pattern + LLM quest detection
- `QuestContextBuilder` - Quest memory for NPCs
- `GroupConversation` - Multi-party dialogue
- `ConversationManager` - Unified conversation handling

### Enhanced Systems
- `GameSession` - New methods for group conversations
- `PromptBuilder` - Quest context injection

### API Additions

#### Quest Detection (Auto-enabled)
- `checkForQuestInDialogueEnhanced()` - Better detection
- Quest context automatically added to prompts
- NPCs remember quests they gave

#### Group Conversations
- `startGroupConversation(participantIds, options)`
- `addGroupConversationTurn(groupId, speakerId, input)`
- `addParticipantToConversation(groupId, characterId)`
- `removeParticipantFromConversation(groupId, characterId)`
- `getGroupConversation(groupId)`
- `suggestNextSpeaker(groupId, currentSpeakerId)`
- `endGroupConversation(groupId)`

---

## 🎮 Examples

### Example 1: Natural Quest Discovery

```javascript
// Before: Required explicit offer
Player: "You look worried"
NPC: "Yes, I have a problem"
Player: "How can I help?" ← MUST say this
→ Quest created

// Now: Natural detection
Player: "How are things?"
NPC: "Well, supplies have been missing lately..."
→ Quest AUTO-DETECTED! (80% confidence)
```

### Example 2: Quest Memory

```javascript
// First conversation
Player: "What's wrong?"
NPC: "Someone stole from my tavern"
→ Quest created

// Later conversation
Player returns to NPC
NPC: "How's it going with finding the thief?"
→ NPC remembers the quest!
```

### Example 3: Group Conversation

```javascript
// Start group
const group = await session.startGroupConversation(
  ['mara', 'aldric', 'finn', 'player']
);

// Everyone talks
Player: "Mara, tell us about the thefts"
Mara: "Well, supplies keep disappearing..."
Aldric: "We're investigating this"
Finn: "I saw some suspicious people..."
→ Natural group dynamics
→ Quests can be detected
→ All relationships update
```

---

## 🔑 Key Features

### Enhanced Quest Detection
✅ Natural discovery (no explicit request)  
✅ 60%+ confidence threshold  
✅ Pattern + LLM hybrid detection  
✅ Quest context in all dialogue  
✅ NPCs remember quests

### Group Conversations
✅ 3+ participants supported  
✅ Smart turn-taking  
✅ Speaker suggestions  
✅ Quest detection works  
✅ Relationship updates for all

---

## 📖 Documentation

- **PHASE_5_PROGRESS.md** - Technical details
- **SESSION_SUMMARY_NOV19_FINAL.md** - Complete summary
- **CURRENT_PRIORITIES.md** - Updated roadmap
- **WHATS_NEW_NOV19.md** - User-friendly changes

---

## 🚦 Status

| Phase | Status | Time |
|-------|--------|------|
| 5.1 Enhanced Quest Detection | ✅ Complete | 2 hours |
| 5.2 Group Conversations | ✅ Complete | 2 hours |
| 5.3 NPC Gossip Network | ⏳ Next | 2-3 hours |
| 5.4 Enhanced Context | 📋 Planned | 2-3 hours |

---

## 💡 Tips

1. **Quest Detection**: Just talk naturally - quests emerge
2. **Group Size**: 2-6 participants works best
3. **Turn Rotation**: System prevents speaker domination
4. **Quest Context**: NPCs automatically aware of active quests
5. **Relationships**: Small increments in groups (+0.5)

---

## ⚠️ Notes

- Quest detection requires Ollama running
- Confidence threshold is 60% (configurable)
- Max 3 consecutive turns per speaker in groups
- All features backwards compatible
- Can disable auto-detect: `autoDetectQuests: false`

---

## 🎯 Next Steps

Ready to continue? Implement **Phase 5.3: NPC Gossip Network**

- NPCs share information with each other
- Reputation tracking
- Gossip propagation
- Rumor system

---

**Quick Start Complete!** 🎮

Run `node test-enhanced-quest-detection.js` or `node test-group-conversations.js` to see it in action!
