import { OllamaService } from '../../services/OllamaService.js';

/**
 * Quest Generator - Uses LLM to generate quests from dialogue
 */
export class QuestGenerator {
  constructor(options = {}) {
    this.ollama = OllamaService.getInstance();
    this.model = options.model || 'granite4:3b';
    this.temperature = options.temperature || 0.7;
    this.seedManager = options.seedManager;
  }

  async detectQuestInDialogue(npc, dialogue, context = {}) {
    const prompt = this.buildQuestDetectionPrompt(npc, dialogue, context);
    
    const seed = this.seedManager?.getNextSeed(npc.id, 'quest_detect', context.frame) || undefined;
    
    try {
      const response = await this.ollama.generate(prompt, {
        model: this.model,
        temperature: 0.3,
        seed
      });

      return this.parseQuestDetection(response);
    } catch (error) {
      console.error('Quest detection failed:', error.message);
      return { hasQuest: false };
    }
  }

  async generateQuestFromContext(npc, dialogue, context = {}) {
    const prompt = this.buildQuestGenerationPrompt(npc, dialogue, context);
    
    const seed = this.seedManager?.getNextSeed(npc.id, 'quest_gen', context.frame) || undefined;
    
    try {
      const response = await this.ollama.generate(prompt, {
        model: this.model,
        temperature: this.temperature,
        seed
      });

      return this.parseQuestGeneration(response, npc);
    } catch (error) {
      console.error('Quest generation failed:', error.message);
      return this.generateFallbackQuest(npc, dialogue);
    }
  }

  buildQuestDetectionPrompt(npc, dialogue, context) {
    return `You are analyzing a conversation to detect if a quest is being offered.

Character: ${npc.name} (${npc.occupation})
Recent dialogue: "${dialogue}"

Does this dialogue indicate the NPC is asking for help, offering a task, or presenting a problem the player could solve?

Respond ONLY with JSON:
{
  "hasQuest": true/false,
  "reason": "brief explanation",
  "urgency": "low/medium/high" (if hasQuest is true)
}`;
  }

  buildQuestGenerationPrompt(npc, dialogue, context) {
    const relationship = context.relationship || 'neutral';
    const memories = context.memories || [];
    const personalityText = npc.personality ? npc.personality.toPromptString() : 'Unknown personality';
    
    return `You are creating a quest based on a conversation.

Character: ${npc.name} (${npc.occupation})
${personalityText}
Relationship: ${relationship}
Recent memories: ${memories.map(m => m.content).join('; ')}

Dialogue that triggered quest: "${dialogue}"

Create a quest with:
- A clear, engaging title (3-6 words)
- A brief description (1-2 sentences)
- 1-3 concrete objectives the player can complete
- Appropriate rewards

Respond ONLY with JSON:
{
  "title": "Quest Title",
  "description": "What the quest is about",
  "objectives": [
    {
      "description": "What player needs to do",
      "type": "talk/investigate/find/deliver",
      "target": "who/what is involved"
    }
  ],
  "rewards": {
    "relationship": 10,
    "description": "What player gets"
  }
}`;
  }

  parseQuestDetection(text) {
    try {
      const cleaned = this.cleanJsonResponse(text);
      const data = JSON.parse(cleaned);
      
      return {
        hasQuest: data.hasQuest === true,
        reason: data.reason || '',
        urgency: data.urgency || 'medium'
      };
    } catch (error) {
      return { hasQuest: false };
    }
  }

  parseQuestGeneration(text, npc) {
    try {
      const cleaned = this.cleanJsonResponse(text);
      const data = JSON.parse(cleaned);
      
      return {
        title: data.title || 'Untitled Quest',
        description: data.description || 'Help the NPC.',
        giver: npc.id,
        objectives: data.objectives || [],
        rewards: data.rewards || { relationship: 5 },
        metadata: {
          generatedAt: Date.now(),
          npcName: npc.name
        }
      };
    } catch (error) {
      console.error('Failed to parse quest:', error.message);
      return this.generateFallbackQuest(npc);
    }
  }

  generateFallbackQuest(npc, dialogue = '') {
    const concern = npc.memory?.getMemoriesByType('concern')[0]?.content || 'a personal matter';
    
    return {
      title: `Help ${npc.name}`,
      description: `${npc.name} has asked for your help with ${concern}.`,
      giver: npc.id,
      objectives: [
        {
          description: 'Talk to people and gather information',
          type: 'investigate',
          target: 'general'
        }
      ],
      rewards: {
        relationship: 10,
        description: `${npc.name}'s gratitude`
      },
      metadata: {
        fallback: true,
        npcName: npc.name
      }
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

  async analyzeQuestCompletion(quest, context = {}) {
    const prompt = `A player is attempting to complete a quest.

Quest: ${quest.title}
Description: ${quest.description}
Objectives: ${quest.objectives.map(o => o.description).join(', ')}

Player's recent actions: ${context.recentActions || 'talked to NPCs'}
Current conversation: "${context.currentDialogue || ''}"

Has the player completed the quest objectives? Consider if they've gathered the information or completed the tasks.

Respond ONLY with JSON:
{
  "completed": true/false,
  "objectivesCompleted": ["objective descriptions that are done"],
  "reason": "why it's complete or not"
}`;

    try {
      const response = await this.ollama.generate(prompt, {
        model: this.model,
        temperature: 0.3
      });

      const cleaned = this.cleanJsonResponse(response);
      return JSON.parse(cleaned);
    } catch (error) {
      return { completed: false, reason: 'Unable to determine' };
    }
  }
}

export default QuestGenerator;
