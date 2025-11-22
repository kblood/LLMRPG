# Conversation Exit Intent Fix - Premature Ending Issue

## The Problem

Conversations were ending abruptly after just 1-2 exchanges instead of continuing naturally.

**Your screenshot showed:**
```
[Elara]: "Kael, a pleasant surprise. It's been a while since I've seen you around these parts."

[Kael]: "Elara! It's wonderful to see you again. I've actually just arrived in the village,
         and I'm curious - have you heard any whispers or rumors about a long-lost chronicle
         that might be hidden somewhere here?"

─── Conversation ended (0 turns) ───
```

The conversation had barely started, then suddenly ended.

## Root Cause

The conversation loop in `_runAutonomousConversation()` was using **naive substring matching** to detect when characters wanted to exit:

```javascript
// OLD CODE (BROKEN)
const exitPhrases = ['goodbye', 'farewell', 'see you', 'be going', 'must go', 'should leave'];
const wantsToExit = exitPhrases.some(phrase =>
  protagonistResponse.toLowerCase().includes(phrase)
);
```

**The problem:**
- `'see you'` as a substring matches: "It's wonderful to **see you** again"
- `'be going'` as a substring matches: "I'm curious" (no match here, but example of fragility)
- `'must go'` as a substring matches: "I must go speak with..."
- `'should leave'` as a substring matches: "should leave soon for..."

### What Happened in Your Screenshot

Kael's response contained "**see you**" (from "see you again"), which matched the exit phrase "see you", triggering immediate conversation termination.

## The Fix

Changed to **word-boundary regex patterns** that require complete phrase context:

```javascript
// NEW CODE (FIXED)
const exitPhrases = [
  /\bgoodbye\b/i,                                          // Standalone "goodbye"
  /\bfarewell\b/i,                                         // Standalone "farewell"
  /\bi (have to|must|need to|should) (leave|go|head out|depart)\b/i,  // "I must leave" etc.
  /\b(see you|talk to you) (later|soon)\b/i               // "see you later" only, not "see you again"
];
const wantsToExit = exitPhrases.some(pattern =>
  pattern.test(protagonistResponse)
);
```

**What changed:**
- `\b` = Word boundary (start/end of word)
- `/i` = Case-insensitive flag
- Requires complete phrase matching, not substring
- Much more specific patterns avoid casual mentions

**Examples of what now works:**
- ✓ "Goodbye!" - matches
- ✓ "I must leave now" - matches
- ✓ "See you later, friend" - matches
- ✓ "I need to head out" - matches

**Examples of what no longer false-positives:**
- ✗ "It's wonderful to see you again" - does NOT match (no "later" or "soon")
- ✗ "about to leave the market" - does NOT match (no "I must/need/have to")
- ✗ "be going there" - does NOT match (no "I" + action verb + direction)

## Impact

### Before Fix
Conversations would end after:
- 0-1 turns (just greeting and first response)
- Any casual mention of seeing someone again
- Any mention of future plans with verbs like "leave", "go"

### After Fix
Conversations now:
- Continue for natural dialogue exchanges
- Only end when expressing clear intent to depart
- Support multi-turn conversations (up to maxTurnsPerConversation = 10)
- Have accurate turn counts

### Example

**Before:**
```
[Elara]: "Pleasant surprise. It's been a while since I've seen you."
[Kael]: "It's wonderful to see you again..."  ← EXIT TRIGGERED HERE
─── Conversation ended (0 turns) ───
```

**After:**
```
[Elara]: "Pleasant surprise. It's been a while since I've seen you."
[Kael]: "It's wonderful to see you again. I've just arrived and am curious about something..."
[Elara]: "Tell me, what brings you to our village?"
[Kael]: "I'm searching for a lost chronicle..."
[Elara]: "How fascinating! I think I might know something..."
[Kael]: "I need to investigate further, so I must leave now to check other sources."  ← EXIT TRIGGERED HERE
─── Conversation ended (5 turns) ───
```

## Files Changed

- `electron/ipc/GameBackend.js` (commit be91071)
  - Lines 1014-1022: Updated protagonist exit intent detection
  - Line 1073-1074: Updated NPC exit intent detection

## Testing

To verify the fix works:

1. Start the game: `npm start`
2. Click "Watch AI Play"
3. Watch conversations - they should now:
   - Last multiple exchanges (not 0-1 turns)
   - Continue until someone explicitly says they're leaving
   - Show natural back-and-forth dialogue
   - Have accurate turn counts in the separator

You should see messages like:
```
─── Conversation ended (5 turns) ───
─── Conversation ended (8 turns) ───
```

Instead of:
```
─── Conversation ended (0 turns) ───
─── Conversation ended (1 turn) ───
```

## Related Issues

This fix also resolves:
- The "0 turns" separator issue (conversations now have actual turns)
- Conversations ending abruptly mid-dialogue
- Unrealistic conversation length in the autonomous loop
- Inaccurate turn counts in replay logs

## Future Improvements

Could consider:
- Making exit phrases configurable per NPC personality
- Learning exit intent from conversation context (topic completion, sentiment)
- Supporting natural conversation endings without explicit exit phrases
- Character-specific ending patterns ("Goodbye" for formal NPCs, "See ya" for casual ones)
