import { OllamaService } from '../../services/OllamaService.js';

/**
 * Quest Detector - Enhanced quest detection from natural dialogue
 * Detects quest opportunities with higher accuracy and sensitivity
 */
export class QuestDetector {
  constructor(options = {}) {
    this.ollama = OllamaService.getInstance();
    this.model = options.model || 'granite4:3b';
    this.seedManager = options.seedManager;
    this.detectionPatterns = this.initializePatterns();
  }

  initializePatterns() {
    return {
      // Keywords that often indicate quest opportunities
      problemKeywords: [
        'problem', 'trouble', 'worried', 'concern', 'missing', 'stolen', 
        'lost', 'need', 'help', 'dangerous', 'threat', 'bandits', 'thieves',
        'mysterious', 'strange', 'wrong', 'bad', 'worse', 'terrible'
      ],
      requestKeywords: [
        'could you', 'would you', 'can you', 'will you', 'please',
        'need you to', 'looking for someone', 'perhaps you could',
        'might you', 'able to help', 'do me a favor'
      ],
      offerKeywords: [
        'reward', 'pay', 'gold', 'help you', 'grateful', 'owe you',
        'in return', 'repay', 'worth your while'
      ]
    };
  }

  /**
   * Quick pattern-based check before LLM analysis
   */
  hasQuestIndicators(dialogue) {
    const lower = dialogue.toLowerCase();
    
    const hasProblem = this.detectionPatterns.problemKeywords.some(word => 
      lower.includes(word)
    );
    const hasRequest = this.detectionPatterns.requestKeywords.some(word => 
      lower.includes(word)
    );
    const hasOffer = this.detectionPatterns.offerKeywords.some(word => 
      lower.includes(word)
    );
    
    return {
      hasProblem,
      hasRequest,
      hasOffer,
      shouldAnalyze: hasProblem || hasRequest || hasOffer
    };
  }

  /**
   * Analyze dialogue for quest opportunities
   */
  async analyzeDialogue(npc, dialogue, context = {}) {
    // Quick pattern check first
    const indicators = this.hasQuestIndicators(dialogue);
    
    if (!indicators.shouldAnalyze) {
      return {
        hasQuest: false,
        confidence: 0,
        reason: 'No quest indicators detected'
      };
    }

    // Use LLM for detailed analysis
    return await this.llmQuestDetection(npc, dialogue, context, indicators);
  }

  async llmQuestDetection(npc, dialogue, context, indicators) {
    const prompt = this.buildDetectionPrompt(npc, dialogue, context, indicators);
    
    const seed = this.seedManager?.getNextSeed(npc.id, 'quest_detect', context.frame) || undefined;
    
    try {
      const response = await this.ollama.generate(prompt, {
        model: this.model,
        temperature: 0.2,
        seed
      });

      return this.parseDetectionResponse(response);
    } catch (error) {
      console.error('LLM quest detection failed:', error.message);
      // Fallback to pattern-based detection
      return this.patternBasedDetection(indicators);
    }
  }

  buildDetectionPrompt(npc, dialogue, context, indicators) {
    const personalityText = npc.personality ? npc.personality.toPromptString() : 'Unknown';
    const concerns = npc.memory?.getMemoriesByType?.('concern')?.slice(0, 3) || [];
    const relationship = context.relationship || 0;

    return `Analyze this dialogue to detect if it contains a quest opportunity.

NPC: ${npc.name} (${npc.occupation || 'unknown occupation'})
Personality: ${personalityText}
Known Concerns: ${concerns.map(c => c.content).join('; ') || 'None'}
Relationship with player: ${relationship}

NPC's Dialogue: "${dialogue}"

Pattern Analysis:
- Mentions a problem: ${indicators.hasProblem ? 'YES' : 'NO'}
- Contains a request: ${indicators.hasRequest ? 'YES' : 'NO'}  
- Offers something: ${indicators.hasOffer ? 'YES' : 'NO'}

Does this dialogue indicate:
1. The NPC has a problem that needs solving
2. The NPC is asking for help (directly or indirectly)
3. The NPC is offering a task or mission
4. There's an opportunity for the player to help

Consider:
- NPCs may hint at problems without directly asking for help
- A worried tone about something can be a quest hook
- Mentioning ongoing issues can be an invitation to help
- Not every problem is a quest - only those the player could reasonably solve

Respond ONLY with JSON:
{
  "hasQuest": true/false,
  "confidence": 0-100 (how certain you are),
  "questType": "help/investigate/find/rescue/deliver/talk/other",
  "urgency": "low/medium/high",
  "reason": "brief explanation of why this is/isn't a quest"
}`;
  }

  parseDetectionResponse(text) {
    try {
      const cleaned = this.cleanJsonResponse(text);
      const data = JSON.parse(cleaned);
      
      return {
        hasQuest: data.hasQuest === true && data.confidence >= 50,
        confidence: data.confidence || 0,
        questType: data.questType || 'help',
        urgency: data.urgency || 'medium',
        reason: data.reason || ''
      };
    } catch (error) {
      console.error('Failed to parse detection response:', error.message);
      return { hasQuest: false, confidence: 0 };
    }
  }

  patternBasedDetection(indicators) {
    // Fallback when LLM fails
    let confidence = 0;
    let questType = 'help';
    
    if (indicators.hasProblem) confidence += 40;
    if (indicators.hasRequest) confidence += 40;
    if (indicators.hasOffer) confidence += 20;
    
    const hasQuest = confidence >= 50;
    
    return {
      hasQuest,
      confidence,
      questType,
      urgency: 'medium',
      reason: hasQuest 
        ? 'Pattern-based detection: dialogue contains quest indicators'
        : 'Insufficient quest indicators'
    };
  }

  cleanJsonResponse(text) {
    text = text.trim();
    text = text.replace(/```json\s*/gi, '');
    text = text.replace(/```\s*/g, '');
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }
    
    return text;
  }

  /**
   * Check conversation history for quest opportunities
   */
  analyzeConversationHistory(conversation, npc) {
    const recentTurns = conversation.history.slice(-5);
    const npcDialogues = recentTurns
      .filter(turn => turn.speakerId === npc.id)
      .map(turn => turn.output);
    
    const combinedDialogue = npcDialogues.join(' ');
    return this.hasQuestIndicators(combinedDialogue);
  }

  /**
   * Generate context for quest from conversation
   */
  extractQuestContext(conversation, npc) {
    const history = conversation.history || [];
    const recentTurns = history.slice(-10);
    
    const topics = [];
    const concerns = [];
    
    recentTurns.forEach(turn => {
      if (turn.speakerId === npc.id) {
        const lower = turn.output.toLowerCase();
        
        // Extract mentioned concerns
        this.detectionPatterns.problemKeywords.forEach(word => {
          if (lower.includes(word)) {
            concerns.push(turn.output);
          }
        });
      }
    });
    
    return {
      topics,
      concerns: [...new Set(concerns)],
      conversationLength: history.length,
      relationship: conversation.context?.relationship || 0
    };
  }
}

export default QuestDetector;
