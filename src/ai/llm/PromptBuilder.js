/**
 * Prompt Builder for LLM interactions
 * Builds context-aware prompts from character state
 * 
 * @class PromptBuilder
 */
export class PromptBuilder {
  constructor() {
    this.maxMemories = 5;
    this.maxRelationships = 5;
  }

  /**
   * Build dialogue prompt for a character
   * @param {Character} speaker - Character speaking
   * @param {Character} listener - Character being spoken to
   * @param {Object} context - Additional context
   * @returns {string} Complete prompt
   */
  buildDialoguePrompt(speaker, listener, context = {}) {
    const parts = [];

    // Character identity
    parts.push(`You are ${speaker.name}${speaker.occupation ? `, a ${speaker.occupation}` : ''}.`);

    if (speaker.backstory) {
      parts.push(`\nBackground: ${speaker.backstory}`);
    }

    // Personality
    parts.push('\n' + speaker.personality.toPromptString());

    // Current emotional state
    if (speaker.emotionalState && speaker.emotionalState !== 'neutral') {
      parts.push(`\nCurrent emotional state: ${speaker.emotionalState}`);
    }

    // Current mood and concern (Phase 1C enhancement)
    if (speaker.mood && speaker.mood !== 'neutral') {
      parts.push(`\nCurrent mood: ${speaker.mood}`);
    }

    if (speaker.currentConcern) {
      parts.push(`\nCurrent concern: ${speaker.currentConcern}`);
    }

    // NPC Knowledge (Phase 1C enhancement)
    if (speaker.knowledge && context.includeKnowledge !== false) {
      if (speaker.knowledge.specialties && speaker.knowledge.specialties.length > 0) {
        parts.push(`\nYou are knowledgeable about: ${speaker.knowledge.specialties.join(', ')}`);
      }

      if (speaker.knowledge.rumors && speaker.knowledge.rumors.length > 0) {
        parts.push('\nRumors you have heard:');
        speaker.knowledge.rumors.forEach((rumor, i) => {
          parts.push(`  ${i + 1}. ${rumor}`);
        });
      }

      if (speaker.knowledge.secrets && speaker.knowledge.secrets.length > 0) {
        parts.push('\nSecrets you know (be careful who you tell):');
        speaker.knowledge.secrets.forEach((secret, i) => {
          parts.push(`  ${i + 1}. ${secret}`);
        });
      }
    }

    // Memories
    const relevantMemories = this.getRelevantMemories(speaker, listener);
    if (relevantMemories.length > 0) {
      parts.push('\nRecent memories:');
      relevantMemories.forEach((mem, i) => {
        parts.push(`${i + 1}. ${mem.toPromptString()}`);
      });
    }

    // Relationship
    if (listener) {
      const relationship = speaker.relationships.getRelationship(listener.id);
      const relationshipLevel = speaker.relationships.getRelationshipLevel(listener.id);
      parts.push(`\nYour relationship with ${listener.name}: ${relationshipLevel} (${relationship > 0 ? '+' : ''}${relationship})`);
    }

    // Current goal
    if (speaker.currentGoal) {
      parts.push(`\nCurrent goal: ${speaker.currentGoal}`);
    }

    // Quest context (PHASE 5 enhancement)
    if (context.questContext) {
      parts.push(context.questContext);
    }

    // Conversation context
    if (context.situation) {
      parts.push(`\nSituation: ${context.situation}`);
    }

    if (context.previousDialogue && context.previousDialogue.length > 0) {
      parts.push('\nConversation so far:');
      context.previousDialogue.forEach(line => {
        parts.push(`- ${line}`);
      });
    }

    // The actual prompt
    if (context.input) {
      parts.push(`\n${listener ? listener.name : 'Someone'} says: "${context.input}"`);
      parts.push(`\nRespond naturally as ${speaker.name} would, in one or two sentences. Stay in character.`);
      parts.push('If they ask about something you know, share your knowledge.');
      parts.push('Reference your concerns when relevant.');
      if (context.questContext) {
        parts.push('If relevant, naturally reference any quests or tasks you mentioned.');
      }
    } else {
      parts.push(`\nGreet ${listener ? listener.name : 'them'} naturally as ${speaker.name} would, considering your personality and relationship. Keep it brief and natural.`);
      parts.push('You may reference your current concern if appropriate.');
      if (context.questContext) {
        parts.push('If you asked them for help before, you might briefly mention it.');
      }
    }

    return parts.join('\n');
  }

  /**
   * Build greeting prompt
   * @param {Character} speaker - Character speaking
   * @param {Character} listener - Character being greeted
   * @param {Object} context - Additional context
   * @returns {string} Prompt for greeting
   */
  buildGreetingPrompt(speaker, listener, context = {}) {
    return this.buildDialoguePrompt(speaker, listener, {
      ...context,
      situation: context.situation || 'You encounter this person'
    });
  }

  /**
   * Build thought generation prompt
   * @param {Character} character - Character thinking
   * @param {Object} context - Context for thought
   * @returns {string} Prompt for internal thought
   */
  buildThoughtPrompt(character, context = {}) {
    const parts = [];

    parts.push(`You are ${character.name}. What are you thinking right now?`);
    
    if (context.situation) {
      parts.push(`\nSituation: ${context.situation}`);
    }

    if (character.currentGoal) {
      parts.push(`Your current goal: ${character.currentGoal}`);
    }

    // Recent events from memory
    const recentMemories = character.memory.getRecentMemories(3);
    if (recentMemories.length > 0) {
      parts.push('\nRecent events:');
      recentMemories.forEach((mem, i) => {
        parts.push(`${i + 1}. ${mem.content}`);
      });
    }

    parts.push('\nExpress your internal thought in one brief sentence, showing your personality and concerns.');

    return parts.join('\n');
  }

  /**
   * Build goal generation prompt
   * @param {Character} character - Character needing a goal
   * @param {Object} context - World context
   * @returns {string} Prompt for goal generation
   */
  buildGoalPrompt(character, context = {}) {
    const parts = [];

    parts.push(`You are ${character.name}${character.occupation ? `, a ${character.occupation}` : ''}.`);
    
    // Personality summary
    const dominantTraits = character.personality.getDominantTraits();
    if (dominantTraits.length > 0) {
      parts.push(`\nYour personality: ${dominantTraits.map(t => t.description).join(', ')}`);
    }

    // Current concerns from memories
    const concerns = character.memory.getMemoriesByType('concern', 3);
    if (concerns.length > 0) {
      parts.push('\nYour current concerns:');
      concerns.forEach((mem, i) => {
        parts.push(`${i + 1}. ${mem.content}`);
      });
    }

    // Relationships
    const friends = character.relationships.getFriends();
    const enemies = character.relationships.getEnemies();
    if (friends.length > 0 || enemies.length > 0) {
      parts.push('\nImportant relationships:');
      if (friends.length > 0) parts.push(`Friends: ${friends.join(', ')}`);
      if (enemies.length > 0) parts.push(`Enemies: ${enemies.join(', ')}`);
    }

    // Time of day
    if (context.timeOfDay) {
      parts.push(`\nTime: ${context.timeOfDay}`);
    }

    parts.push('\nWhat would you want to do next? State ONE clear, specific goal in a simple sentence.');
    parts.push('Example: "Visit the tavern to hear gossip" or "Talk to the blacksmith about repairs"');

    return parts.join('\n');
  }

  /**
   * Get relevant memories for conversation
   * @param {Character} speaker - Speaking character
   * @param {Character} listener - Listening character
   * @returns {Memory[]} Relevant memories
   */
  getRelevantMemories(speaker, listener) {
    if (!listener) {
      return speaker.memory.getRecentMemories(this.maxMemories);
    }

    // Get memories about this character
    const aboutListener = speaker.memory.getMemoriesAbout(listener.id, 3);
    
    // Get other recent relevant memories
    const otherRecent = speaker.memory.getRecentMemories(this.maxMemories)
      .filter(m => !m.involvesCharacter(listener.id));

    // Combine, prioritizing memories about the listener
    return [...aboutListener, ...otherRecent].slice(0, this.maxMemories);
  }

  /**
   * Build context object for character
   * @param {Character} character - Character
   * @returns {Object} Context object
   */
  buildContext(character) {
    return {
      name: character.name,
      occupation: character.occupation,
      personality: character.personality.toPromptString(),
      dominantTraits: character.personality.getDominantTraits(),
      memories: character.memory.getRecentMemories(this.maxMemories),
      relationships: character.relationships.getAll(),
      currentGoal: character.currentGoal,
      emotionalState: character.emotionalState
    };
  }

  /**
   * Format conversation history
   * @param {Array} history - Array of {speaker, text} objects
   * @returns {string[]} Formatted dialogue lines
   */
  formatConversationHistory(history) {
    return history.map(entry => `${entry.speaker}: ${entry.text}`);
  }
}

export default PromptBuilder;
