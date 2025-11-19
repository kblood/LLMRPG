# 🚀 Quick Start Guide - OllamaRPG

## What You Have

✅ **10 unique NPCs** with distinct personalities  
✅ **Dialogue system** powered by Ollama LLM  
✅ **Memory & relationship tracking**  
✅ **6 emergent quest storylines**  
✅ **Tested & working** long conversations

---

## Getting Started (5 Minutes)

### 1. Make Sure Ollama is Running
```bash
# Check if Ollama is available
ollama list

# If not running, start it
ollama serve

# Make sure you have the model
ollama pull llama3.1:8b
```

### 2. Run the NPC Showcase
```bash
node test-npc-cast.js
```

This will show you:
- All 10 NPCs with their personalities
- Relationship web (who likes/dislikes whom)
- 6 potential quest lines
- Live dialogue examples with 3 NPCs

**Expected time**: 2-3 minutes

---

## What Each Test Does

### `test-npc-cast.js` ⭐ START HERE
**Shows**: All NPCs, relationships, quest possibilities  
**Time**: 2-3 minutes  
**LLM Calls**: 3 (quick personality tests)
```bash
node test-npc-cast.js
```

### `test-phase1-comprehensive.js`
**Shows**: Long conversation (13+ turns) with Mara  
**Time**: 5-7 minutes  
**LLM Calls**: 13 (full conversation)
```bash
node test-phase1-comprehensive.js
```

### `test-real-dialogue.js`
**Shows**: Basic dialogue system test  
**Time**: 1-2 minutes  
**LLM Calls**: 4 (greeting + 3 responses)
```bash
node test-real-dialogue.js
```

### `test-dialogue-system.js`
**Shows**: Dialogue system internals  
**Time**: 1-2 minutes  
**LLM Calls**: 5 (system integration test)
```bash
node test-dialogue-system.js
```

---

## The 10 NPCs

### Good Guys
1. **Mara** (Tavern Keeper) - Friendly, honest, victim of thefts
2. **Aldric** (Town Guard) - Dutiful, honorable, fights corruption
3. **Brother Marcus** (Priest) - Compassionate, counselor, high honor

### Complex Characters
4. **Grok** (Blacksmith) - Gruff but honorable, former adventurer
5. **Elara** (Merchant) - Clever, cautious, competes with Roderick
6. **Sienna** (Herbalist) - Wise, knows illegal potions
7. **Lady Cordelia** (Noble) - Kind but trapped by debt

### Troubled Souls
8. **Finn** (Street Urchin) - Smart kid, greedy, knows everything
9. **Thom** (Drunk) - Former hero, sealed ancient evil, regrets

### The Villain
10. **Roderick** (Merchant Lord) - Greedy (95!), manipulative, mastermind

---

## Key Quest Lines

### 1. The Tavern Thief ⭐ MAIN PLOT
- **Start**: Talk to Mara about storage thefts
- **Clue**: Finn saw someone (wants payment)
- **Twist**: Roderick is behind it
- **Stakes**: Help Mara or side with Roderick

### 2. Shadows from the Past ⭐ DARK STORYLINE
- **Start**: Get Thom drunk enough to talk
- **Secret**: Sealed ruins beneath town
- **Danger**: Seals are weakening
- **Allies**: Grok knows truth, Sienna senses it

### 3. The Debt Collector
- **Start**: Overhear Cordelia and Marcus
- **Problem**: Roderick controls her through debt
- **Choice**: Help her or exploit the situation

---

## Understanding Personalities

### Personality Traits (0-100)
- **Friendliness**: How warm/welcoming
- **Intelligence**: Problem solving ability
- **Caution**: Risk aversion
- **Honor**: Moral code strength
- **Greed**: Desire for wealth
- **Aggression**: Hostility level

### Examples
**Finn** (Greed: 70, Caution: 80):
- Wants money for information
- Careful about who he trusts
- Realistic dialogue: "That's worth a few coins, don't it?"

**Roderick** (Greed: 95, Honor: 25):
- Extremely greedy, low morals
- Gives evasive, political answers
- The antagonist

**Marcus** (Honor: 95, Friendliness: 85):
- Highly moral, very kind
- Offers compassionate counsel
- The moral compass

---

## Project Structure

```
OllamaRPG/
├── src/
│   ├── data/
│   │   └── npcs-expanded.js          ← 10 NPCs defined here
│   ├── entities/
│   │   └── Character.js              ← Base character class
│   ├── ai/
│   │   ├── personality/
│   │   │   └── Personality.js        ← 6-trait system
│   │   └── memory/
│   │       └── Memory.js             ← Memory storage
│   ├── systems/
│   │   └── dialogue/
│   │       └── DialogueSystem.js    ← Dialogue management
│   └── services/
│       └── OllamaService.js         ← LLM integration
├── test-npc-cast.js                  ← Run this first!
├── test-phase1-comprehensive.js      ← Long conversation test
├── WHATS_NEXT.md                     ← Options for next steps
└── README_SESSION_SUMMARY.md         ← What was accomplished
```

---

## Quick Reference Commands

### Run Tests
```bash
# Best showcase (start here!)
node test-npc-cast.js

# Long conversation example
node test-phase1-comprehensive.js

# Basic dialogue test
node test-real-dialogue.js
```

### Check Status
```bash
# See if Ollama is running
ollama list

# Check what models you have
ollama list
```

### Development
```bash
# Run any test
node [filename].js

# Install dependencies (if needed)
npm install

# Run project tests (unit tests)
npm test
```

---

## Common Issues & Solutions

### Issue: "Ollama not available"
**Solution**: 
```bash
ollama serve
```
Then run test again.

### Issue: "Model not found"
**Solution**:
```bash
ollama pull llama3.1:8b
```

### Issue: "Cannot find module"
**Solution**:
```bash
npm install
```

### Issue: Slow responses
**Normal**: LLM responses take 2-3 seconds  
**If longer**: Check Ollama is running locally, not overloaded

---

## What to Do Next

### Quick (30-60 minutes)
1. **Add More NPCs**: Create 2-3 additional characters
2. **Gossip System**: NPCs share information with each other
3. **Time Awareness**: Morning vs evening greetings

### Medium (2-3 hours)
1. **Multi-NPC Conversations**: 3+ characters talking
2. **Location System**: Multiple places to explore
3. **Enhanced Demo**: Better interface

### Big (3-4 hours)
1. **Quest System**: Implement "The Tavern Thief" quest
2. **Complete Vertical Slice**: Quests + locations + polish

**See `WHATS_NEXT.md` for detailed options!**

---

## Understanding the Output

### When you run `test-npc-cast.js`:

1. **NPC Roster Section**: Shows each NPC's personality traits and key concerns
2. **Relationship Web Section**: Shows who likes/dislikes whom
3. **Personality Tests Section**: Live LLM-generated dialogue from 3 NPCs
4. **Quest Lines Section**: 6 emergent storylines explained

### Good Signs
✅ Each NPC has distinct speaking style  
✅ Personalities match their trait values  
✅ Dialogue feels natural and in-character  
✅ Responses are contextually appropriate  

---

## Tips for Experimentation

### Modify NPCs
Edit `src/data/npcs-expanded.js`:
- Change personality values
- Add new memories
- Modify relationships
- Create new NPCs

### Test Different Scenarios
Create your own test file:
```javascript
import { createAllNPCs } from './src/data/npcs-expanded.js';
import { DialogueSystem } from './src/systems/dialogue/DialogueSystem.js';

// Your test code here
```

### Adjust LLM Settings
In DialogueSystem initialization:
```javascript
const dialogueSystem = new DialogueSystem({
  model: 'llama3.1:8b',      // Change model
  temperature: 0.8,          // 0.0-1.0 (higher = more creative)
  timeout: 60000             // Milliseconds
});
```

---

## Performance Notes

### Expected Performance
- **Response Time**: 2-3 seconds per LLM call
- **Context Length**: Handles 13+ conversation turns
- **Memory Usage**: < 200MB typically
- **Consistency**: Very high (personalities stable)

### Optimization Tips
- Lower temperature (0.5-0.7) for more consistent responses
- Shorter prompts = faster responses
- Cache repeated queries when possible

---

## Documentation Reference

### Read These Next
1. **README_SESSION_SUMMARY.md** - What was built this session
2. **WHATS_NEXT.md** - Detailed options for next steps
3. **OPTION_A_PLAN.md** - Complete roadmap (Phases 1-6)
4. **SESSION_PROGRESS.md** - Detailed technical progress

### Architecture
- **ARCHITECTURE.md** - System design
- **CURRENT_STATUS.md** - Overall project status

---

## Support & Resources

### If Something Breaks
1. Check Ollama is running: `ollama serve`
2. Check model is available: `ollama list`
3. Check dependencies: `npm install`
4. Look at error message - usually clear

### Learning More
- Ollama docs: https://ollama.ai
- Check existing test files for examples
- Modify and experiment!

---

## Success Criteria

You'll know it's working when:
- ✅ Tests run without errors
- ✅ Each NPC has a distinct voice
- ✅ Dialogue feels natural and contextual
- ✅ Personalities are consistent
- ✅ Response time is reasonable (2-4 seconds)

---

## Have Fun! 🎮

This is a **dialogue-first RPG** where stories emerge from rich NPC interactions. The system is designed for:
- Emergent storytelling
- Dynamic conversations
- Personality-driven dialogue
- Consequence-based gameplay

**Experiment, explore, and see what stories emerge!**

---

**Quick Start Checklist:**
- [ ] Ollama running (`ollama serve`)
- [ ] Model available (`ollama pull llama3.1:8b`)
- [ ] Dependencies installed (`npm install`)
- [ ] Run showcase (`node test-npc-cast.js`)
- [ ] Read `WHATS_NEXT.md` for next steps

**Ready to go!** 🚀
