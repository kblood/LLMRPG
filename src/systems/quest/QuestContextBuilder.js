/**
 * Quest Context Builder
 * Builds context about quests to inject into NPC dialogue prompts
 */
export class QuestContextBuilder {
  constructor(questManager) {
    this.questManager = questManager;
  }

  /**
   * Build quest context for an NPC's dialogue
   */
  buildContextForNPC(npc, protagonist, options = {}) {
    const activeQuests = this.questManager.getActiveQuests();
    const completedQuests = this.questManager.getCompletedQuests();
    
    // Quests this NPC gave
    const givenQuests = activeQuests.filter(q => q.giver === npc.id);
    const givenCompleted = completedQuests.filter(q => q.giver === npc.id);
    
    // Quests that involve this NPC
    const involvedQuests = this.getQuestsInvolvingNPC(activeQuests, npc.id);
    
    // Build context text
    let context = '';
    
    if (givenQuests.length > 0) {
      context += '\n\n=== QUESTS YOU GAVE ===\n';
      givenQuests.forEach(quest => {
        const progress = quest.getProgress();
        context += `\nQuest: "${quest.title}"\n`;
        context += `Status: Active (${progress.completed}/${progress.total} objectives)\n`;
        context += `Description: ${quest.description}\n`;
        
        // List objectives and their status
        quest.objectives.forEach(obj => {
          const status = obj.completed ? '✓ DONE' : '○ TODO';
          context += `  ${status} ${obj.description}\n`;
        });
        
        // Add suggestion for how to reference it
        if (progress.percentage === 0) {
          context += `→ You can ask if they've started working on it\n`;
        } else if (progress.percentage < 100) {
          context += `→ You can ask about their progress\n`;
        } else {
          context += `→ They've completed it! You should acknowledge and thank them\n`;
        }
      });
    }
    
    if (givenCompleted.length > 0) {
      context += '\n\n=== QUESTS YOU GAVE (COMPLETED) ===\n';
      givenCompleted.slice(-3).forEach(quest => {
        context += `- "${quest.title}" (completed recently)\n`;
      });
    }
    
    if (involvedQuests.length > 0) {
      context += '\n\n=== QUESTS INVOLVING YOU ===\n';
      involvedQuests.forEach(quest => {
        context += `\nQuest: "${quest.title}" (given by ${quest.metadata?.npcName || 'someone'})\n`;
        
        // Check if any objectives mention this NPC
        const relevantObjectives = quest.objectives.filter(obj => 
          obj.target?.includes(npc.id) || 
          obj.target?.includes(npc.name.toLowerCase())
        );
        
        if (relevantObjectives.length > 0) {
          context += `Objectives involving you:\n`;
          relevantObjectives.forEach(obj => {
            const status = obj.completed ? '✓' : '○';
            context += `  ${status} ${obj.description}\n`;
          });
          
          context += `→ The player may ask you about this quest\n`;
        }
      });
    }
    
    // General quest awareness
    const otherQuests = activeQuests.filter(q => 
      q.giver !== npc.id && !involvedQuests.includes(q)
    );
    
    if (otherQuests.length > 0 && options.includeGeneralAwareness) {
      context += '\n\n=== OTHER ACTIVE QUESTS ===\n';
      context += `The player has ${otherQuests.length} other active quest(s).\n`;
      context += `You may be aware of some rumors or have opinions about their activities.\n`;
    }
    
    return context;
  }

  /**
   * Get quests that involve this NPC as a target
   */
  getQuestsInvolvingNPC(quests, npcId) {
    return quests.filter(quest => {
      return quest.objectives.some(obj => {
        const target = obj.target?.toLowerCase() || '';
        return target.includes(npcId) || target === npcId;
      });
    });
  }

  /**
   * Build short summary for prompt injection
   */
  buildShortSummary(npc, protagonist) {
    const activeQuests = this.questManager.getActiveQuests();
    const givenQuests = activeQuests.filter(q => q.giver === npc.id);
    
    if (givenQuests.length === 0) {
      return '';
    }
    
    const summaries = givenQuests.map(quest => {
      const progress = quest.getProgress();
      if (progress.percentage === 0) {
        return `You asked them to help with "${quest.title}" but they haven't started yet`;
      } else if (progress.percentage < 100) {
        return `They're working on "${quest.title}" (${progress.completed}/${progress.total} done)`;
      } else {
        return `They completed "${quest.title}"! You should thank them`;
      }
    });
    
    return '\nCurrent Quest Status:\n' + summaries.join('\n');
  }

  /**
   * Check if dialogue should mention quest progress
   */
  shouldMentionQuest(quest, context = {}) {
    // Don't mention too frequently
    if (context.lastQuestMention && 
        Date.now() - context.lastQuestMention < 30000) {
      return false;
    }
    
    const progress = quest.getProgress();
    
    // Mention if just completed
    if (progress.percentage === 100 && !quest.acknowledged) {
      return { mention: true, reason: 'completed', priority: 'high' };
    }
    
    // Mention if no progress in a while
    const timeSinceCreation = Date.now() - quest.createdAt;
    if (progress.percentage === 0 && timeSinceCreation > 60000) {
      return { mention: true, reason: 'no_progress', priority: 'low' };
    }
    
    // Mention if partial progress
    if (progress.percentage > 0 && progress.percentage < 100) {
      return { mention: true, reason: 'in_progress', priority: 'medium' };
    }
    
    return { mention: false };
  }

  /**
   * Generate natural quest reference for dialogue
   */
  generateQuestReference(quest, mentionType) {
    const progress = quest.getProgress();
    
    const references = {
      completed: [
        `By the way, thank you for helping with ${quest.title}. I really appreciate it.`,
        `I heard you completed the task I mentioned. Well done!`,
        `You've taken care of that matter for me. I'm grateful.`
      ],
      in_progress: [
        `How's it going with ${quest.title}?`,
        `Making any progress on that task I mentioned?`,
        `Any luck with the matter we discussed?`
      ],
      no_progress: [
        `By the way, about ${quest.title}... whenever you have time.`,
        `No pressure, but that issue I mentioned is still bothering me.`,
        `If you get a chance, I could still use help with that problem.`
      ]
    };
    
    const options = references[mentionType] || [];
    return options[Math.floor(Math.random() * options.length)] || '';
  }

  /**
   * Build context for quest completion check
   */
  buildCompletionContext(quest, conversationHistory = []) {
    const recentActions = conversationHistory
      .slice(-5)
      .map(turn => turn.output)
      .join('\n');
    
    return {
      questTitle: quest.title,
      objectives: quest.objectives,
      progress: quest.getProgress(),
      recentDialogue: recentActions,
      objectiveDescriptions: quest.objectives.map(o => o.description)
    };
  }

  /**
   * Extract quest-relevant information from dialogue
   */
  extractQuestProgress(dialogue, quest) {
    const mentions = {
      objectives: [],
      keywords: []
    };
    
    const lower = dialogue.toLowerCase();
    
    quest.objectives.forEach(obj => {
      // Check if objective keywords are mentioned
      const objWords = obj.description.toLowerCase().split(' ');
      const relevantWords = objWords.filter(word => 
        word.length > 3 && !['the', 'and', 'with', 'from', 'that'].includes(word)
      );
      
      relevantWords.forEach(word => {
        if (lower.includes(word)) {
          mentions.objectives.push(obj.id);
          mentions.keywords.push(word);
        }
      });
      
      // Check target mentions
      if (obj.target && lower.includes(obj.target.toLowerCase())) {
        mentions.objectives.push(obj.id);
        mentions.keywords.push(obj.target);
      }
    });
    
    return {
      mentionsQuest: mentions.objectives.length > 0,
      mentionedObjectives: [...new Set(mentions.objectives)],
      keywords: [...new Set(mentions.keywords)]
    };
  }
}

export default QuestContextBuilder;
