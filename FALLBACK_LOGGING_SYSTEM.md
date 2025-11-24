## ⚠️ Fallback Logging System - Complete Visibility

**Problem Solved**: Fallbacks were being used silently without any warning or logging, making it unclear when LLM generation failed.

**Solution**: Comprehensive fallback detection, logging, and visibility system.

---

## 🎯 Features

### 1. **Automatic Fallback Detection**
Every fallback usage is now:
- ✅ Logged to console with prominent warnings
- ✅ Tracked with statistics
- ✅ Emitted as events for replay system
- ✅ Available for UI display

### 2. **Console Visibility**
Clear, prominent warnings when fallbacks are used:

```
================================================================================
⚠️  FALLBACK USED
================================================================================
System:    DialogueGenerator
Operation: greeting
Reason:    LLM_TIMEOUT
Timestamp: 2025-11-23T16:35:20.789Z
Context:   {
  "speaker": "Mara",
  "listener": "Player",
  "friendliness": 85,
  "relationship": 45
}
Error:     Ollama request timed out
Fallback:  "Hello Player! Good to see you."
================================================================================
```

### 3. **Event Bus Integration**
All fallbacks emit events:
- `fallback:used` - Generic fallback event
- `fallback:dialoguegenerator` - System-specific events
- `fallback:gamemaster` - System-specific events
- etc.

### 4. **Replay Integration**
Fallback events are logged to replay files, so you can:
- See exactly when fallbacks occurred
- Understand why LLM generation failed
- Replay with full context of what went wrong

### 5. **UI Warnings**
User-friendly messages for display:
- `"⚠️ Using basic greeting (LLM unavailable)"`
- `"⚠️ Using standard narration (LLM unavailable)"`
- `"⚠️ Using pre-built locations (LLM unavailable)"`

---

## 📊 Systems Enhanced

### **OllamaService**
Logs fallbacks for:
- LLM_TIMEOUT - Generation took too long
- LLM_UNAVAILABLE - Ollama not reachable
- LLM_ERROR - Generation failed

Context logged:
- Model name
- Temperature
- Prompt length
- Whether seed was used
- Full error details

### **DialogueGenerator**
Logs fallbacks for:
- Greeting generation
- Response generation

Context logged:
- Speaker name
- Listener name
- Personality traits (friendliness)
- Relationship level
- Player input (truncated)

### **GameMaster** (Ready to integrate)
Will log fallbacks for:
- Scene narration
- Opening narration
- Victory narration
- Combat narration
- Action narration

### **WorldGenerator** (Ready to integrate)
Will log fallbacks for:
- Location generation
- NPC generation
- Quest generation

---

## 🔧 API Reference

### FallbackLogger

**Log a fallback:**
```javascript
import { FallbackLogger } from './src/services/FallbackLogger.js';

const logger = FallbackLogger.getInstance();

logger.logFallback({
  system: 'MySystem',           // Which system is using fallback
  operation: 'myOperation',     // What operation failed
  reason: 'LLM_TIMEOUT',        // Why fallback was used
  fallbackValue: 'Fallback text', // The fallback content
  context: {                    // Additional context
    param1: 'value1',
    param2: 42
  },
  error: originalError          // Optional: the error that triggered fallback
});
```

**Get statistics:**
```javascript
const stats = logger.getStats();
// {
//   total: 10,
//   bySystem: { DialogueGenerator: 5, GameMaster: 3, ... },
//   byReason: { LLM_TIMEOUT: 6, LLM_ERROR: 4 },
//   firstOccurrence: timestamp,
//   lastOccurrence: timestamp,
//   recentFallbacks: [...]
// }
```

**Get UI warning message:**
```javascript
const warning = logger.getUIWarning('DialogueGenerator', 'greeting');
// "⚠️ Using basic greeting (LLM unavailable)"
```

**Check fallback rate:**
```javascript
const rate = logger.getFallbackRate(60000); // per minute in last 60 seconds
if (rate > 5) {
  console.warn('High fallback rate! LLM may be down.');
}
```

**Generate report:**
```javascript
const report = logger.generateReport();
console.log(report);
// Complete formatted report with all statistics
```

### FallbackReplayIntegration

**Initialize with replay system:**
```javascript
import { FallbackReplayIntegration } from './src/services/FallbackReplayIntegration.js';

FallbackReplayIntegration.initialize(replayLogger);
// Now all fallbacks are automatically logged to replay
```

**Add indicator to messages:**
```javascript
const message = FallbackReplayIntegration.addFallbackIndicator(
  "Hello there!",
  true // wasFallback
);
// "⚠️ Hello there! [FALLBACK]"
```

**Get status for UI:**
```javascript
const status = FallbackReplayIntegration.getFallbackStatus();
// {
//   hasRecentFallbacks: true,
//   fallbackRate: "2.00",
//   totalFallbacks: 10,
//   mostCommonSystem: "DialogueGenerator",
//   mostCommonReason: "LLM_TIMEOUT",
//   warning: "High fallback rate detected - LLM may be unavailable"
// }
```

---

## 🎮 Integration Examples

### Example 1: Dialogue with Fallback Indicator

```javascript
// In game UI code
const greeting = await dialogueGenerator.generateGreeting(npc, player, {});

if (greeting.error) {
  // Show warning to player
  const warning = fallbackLogger.getUIWarning('DialogueGenerator', 'greeting');
  displayWarning(warning);
}

// Add indicator to message if it was a fallback
const displayText = FallbackReplayIntegration.addFallbackIndicator(
  greeting.text,
  greeting.valid === false
);

addToEventLog(displayText);
```

### Example 2: Status Display in UI

```javascript
// In game status bar
function updateFallbackStatus() {
  const status = FallbackReplayIntegration.getFallbackStatus(60000); // Last minute
  
  if (status.hasRecentFallbacks) {
    statusElement.innerHTML = `
      <div class="fallback-warning">
        ⚠️ ${status.totalFallbacks} fallbacks (${status.fallbackRate}/min)
        <br>
        <small>${status.mostCommonReason} - Check Ollama connection</small>
      </div>
    `;
  } else {
    statusElement.innerHTML = '✓ LLM Connected';
  }
}

// Update every 10 seconds
setInterval(updateFallbackStatus, 10000);
```

### Example 3: Replay with Fallback Visibility

```javascript
// When playing a replay
eventBus.on('fallback:used', (data) => {
  // Show in replay viewer
  addReplayAnnotation({
    timestamp: data.timestamp,
    type: 'fallback',
    message: `⚠️ Fallback: ${data.system}.${data.operation}`,
    details: `Reason: ${data.reason}\nPreview: ${data.fallbackPreview}`
  });
});
```

### Example 4: Alert on High Fallback Rate

```javascript
// Monitor fallback rate
setInterval(() => {
  const rate = fallbackLogger.getFallbackRate(60000);
  
  if (rate > 10) {
    console.error('🚨 CRITICAL: High fallback rate detected!');
    console.error('Ollama may be down or unresponsive');
    
    // Show UI alert
    showAlert({
      title: 'LLM Connection Issues',
      message: `High fallback rate: ${rate.toFixed(2)}/min\nGame is using pre-built content.`,
      type: 'warning'
    });
  }
}, 30000); // Check every 30 seconds
```

---

## 📈 Statistics & Monitoring

### Available Metrics

1. **Total Fallbacks**: Count of all fallbacks used
2. **By System**: Breakdown by which system used fallbacks
3. **By Reason**: Breakdown by why fallbacks were used
4. **Fallback Rate**: Fallbacks per minute in time window
5. **Recent History**: Last N fallbacks with full context

### Common Reasons

- **LLM_TIMEOUT**: Generation took too long (>120 seconds)
- **LLM_UNAVAILABLE**: Ollama service not reachable
- **LLM_ERROR**: Generation failed for other reasons
- **PARSE_ERROR**: Response couldn't be parsed
- **TEST_REASON**: Used in testing

### Monitoring Best Practices

1. **Check rate every minute**: Alert if > 5 fallbacks/min
2. **Log to file**: Save fallback reports for debugging
3. **UI indicators**: Show status in game UI
4. **Replay analysis**: Review replays to find patterns
5. **Alert users**: Let them know when using fallback content

---

## 🧪 Testing

### Run the test:
```bash
npm run test:fallback
```

### Test coverage:
- ✅ Direct fallback logging
- ✅ OllamaService fallbacks
- ✅ DialogueGenerator fallbacks
- ✅ Event emission
- ✅ Statistics tracking
- ✅ UI warning generation
- ✅ Fallback rate calculation
- ✅ Report generation

---

## 🎨 UI Examples

### Dialogue Message with Fallback Indicator

```html
<div class="dialogue-message fallback">
  <span class="speaker">Mara:</span>
  <span class="text">⚠️ Hello there! [FALLBACK]</span>
  <span class="fallback-warning">Using basic greeting - LLM unavailable</span>
</div>
```

### Status Bar with Fallback Warning

```html
<div class="status-bar">
  <div class="fallback-status warning">
    <span class="icon">⚠️</span>
    <span class="text">3 fallbacks (1.5/min)</span>
    <span class="reason">LLM_TIMEOUT - Check Ollama</span>
  </div>
</div>
```

### Replay Event Marker

```html
<div class="replay-event fallback">
  <span class="marker">⚠️</span>
  <span class="timestamp">15:32.5</span>
  <span class="description">
    Fallback: DialogueGenerator.greeting<br>
    <small>Reason: LLM_TIMEOUT</small>
  </span>
</div>
```

---

## 📝 CSS Styling Suggestions

```css
/* Fallback warning in dialogue */
.dialogue-message.fallback {
  border-left: 3px solid #ff9800;
  background-color: #fff3e0;
}

.dialogue-message.fallback .fallback-warning {
  font-size: 0.85em;
  color: #f57c00;
  font-style: italic;
  margin-top: 4px;
  display: block;
}

/* Status bar fallback indicator */
.fallback-status.warning {
  background-color: #fff3e0;
  border: 1px solid #ff9800;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
}

.fallback-status.warning .icon {
  color: #f57c00;
}

/* Replay fallback marker */
.replay-event.fallback {
  background-color: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 8px;
  margin: 4px 0;
}

.replay-event.fallback .marker {
  font-size: 1.2em;
  color: #f57c00;
}
```

---

## 🚀 Next Steps

### Immediate
- [x] Add FallbackLogger service
- [x] Integrate with OllamaService
- [x] Integrate with DialogueGenerator
- [x] Add event emission
- [x] Create test suite

### In Progress
- [ ] Add GameMaster fallback logging
- [ ] Add WorldGenerator fallback logging
- [ ] Add ActionSystem fallback logging
- [ ] Integrate with replay system

### Future
- [ ] Add fallback indicators to UI
- [ ] Display fallback status in game
- [ ] Show fallback events in replay viewer
- [ ] Add fallback alerts for high rates
- [ ] Generate fallback reports per session

---

## 💡 Benefits

### For Developers
- **Debugging**: See exactly when and why LLM fails
- **Monitoring**: Track fallback rates and patterns
- **Testing**: Verify fallback behavior works correctly

### For Players
- **Transparency**: Know when using pre-built content
- **Context**: Understand why responses seem generic
- **Troubleshooting**: Can report LLM connection issues

### For Production
- **Reliability**: Game works even when LLM fails
- **Visibility**: Issues are immediately apparent
- **Analytics**: Can track LLM service quality

---

## 🎉 Summary

The fallback logging system ensures that:

1. ✅ **No silent fallbacks** - Every fallback is logged
2. ✅ **Full visibility** - Console, events, and UI
3. ✅ **Complete context** - Know why fallback was used
4. ✅ **Replay integration** - Fallbacks visible in replays
5. ✅ **Monitoring** - Track rates and patterns
6. ✅ **User-friendly** - Clear warnings for players

**All fallbacks are now visible, trackable, and reportable!**

---

**Test it**: `npm run test:fallback`

**Files**:
- `src/services/FallbackLogger.js` - Core logging service
- `src/services/FallbackReplayIntegration.js` - Replay integration
- `test-fallback-logging.js` - Test suite
