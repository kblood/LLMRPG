import { GroupConversation } from './GroupConversation.js';
import { DialogueGenerator } from '../../ai/llm/DialogueGenerator.js';
import { EventBus } from '../../services/EventBus.js';

/**
 * Conversation Manager
 * Manages both 1-on-1 and group conversations
 * Handles conversation creation, turn-taking, and lifecycle
 */
export class ConversationManager {
  constructor(options = {}) {
    this.dialogueGenerator = options.dialogueGenerator || new DialogueGenerator(options);
    this.conversations = new Map(); // conversationId -> GroupConversation
    this.characterConversations = new Map(); // characterId -> Set of conversationIds
    this.conversationHistory = [];
    this.maxHistoryLength = options.maxHistoryLength || 100;
    this.eventBus = EventBus.getInstance();
  }

  /**
   * Start a group conversation with 2+ participants
   */
  startGroupConversation(participants, options = {}) {
    if (participants.length < 2) {
      throw new Error('Group conversation requires at least 2 participants');
    }

    const conversationId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const conversation = new GroupConversation(conversationId, participants, options);
    
    this.conversations.set(conversationId, conversation);
    
    // Track which conversations each character is in
    participants.forEach(char => {
      if (!this.characterConversations.has(char.id)) {
        this.characterConversations.set(char.id, new Set());
      }
      this.characterConversations.get(char.id).add(conversationId);
    });

    this.eventBus.emit('conversation:started', {
      conversationId,
      type: 'group',
      participantIds: participants.map(p => p.id),
      participantCount: participants.length
    });

    return conversationId;
  }

  /**
   * Add a turn to a group conversation
   */
  async addGroupTurn(conversationId, speakerId, input, options = {}) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }
    if (!conversation.active) {
      throw new Error(`Conversation ${conversationId} is no longer active`);
    }

    const speaker = conversation.getParticipant(speakerId);
    if (!speaker) {
      throw new Error(`Speaker ${speakerId} not in conversation`);
    }

    // Determine who the speaker is addressing
    const addressedTo = options.addressedTo || this.determineAddressedTo(conversation, speakerId, input);
    const otherParticipants = conversation.getOtherParticipants(speakerId);

    // Build context for LLM
    const context = {
      ...options,
      isGroup: true,
      participants: conversation.getAllParticipants().map(p => ({
        id: p.id,
        name: p.name,
        occupation: p.occupation
      })),
      otherParticipants: otherParticipants.map(p => p.name),
      previousDialogue: conversation.formatHistory(conversation.getRecentHistory(10)),
      frame: conversation.turnCount,
      addressedTo: addressedTo ? conversation.getParticipant(addressedTo)?.name : null
    };

    // Generate response
    let result;
    if (options.isGreeting || input === null) {
      result = await this.dialogueGenerator.generateGreeting(speaker, otherParticipants[0], context);
    } else {
      // For group conversations, we need a special prompt
      result = await this.generateGroupResponse(speaker, otherParticipants, input, context);
    }

    // Add turn to conversation
    const turn = conversation.addTurn(speakerId, input, result.text, {
      addressedTo,
      type: options.type || 'normal',
      seed: result.seed,
      valid: result.valid
    });

    // Update relationships for all listeners
    if (result.valid) {
      otherParticipants.forEach(listener => {
        speaker.relationships.modifyRelationship(listener.id, 0.5, 'Group conversation');
        listener.relationships.modifyRelationship(speaker.id, 0.5, 'Group conversation');
      });
    }

    return result;
  }

  /**
   * Generate response in group context
   */
  async generateGroupResponse(speaker, listeners, input, context = {}) {
    // Build a group-aware prompt
    const listenerNames = listeners.map(l => l.name).join(', ');
    const addressedName = context.addressedTo || 'everyone';

    const prompt = this.buildGroupPrompt(speaker, listeners, input, context);
    
    const seed = context.seed || undefined;

    try {
      const response = await this.dialogueGenerator.ollama.generate(prompt, {
        model: context.model || this.dialogueGenerator.defaultModel,
        temperature: context.temperature || this.dialogueGenerator.defaultTemperature,
        seed
      });

      const parsed = this.dialogueGenerator.responseParser.parseDialogue(response);

      return {
        text: parsed.text,
        seed,
        valid: parsed.valid,
        issues: parsed.issues
      };
    } catch (error) {
      console.error('Error generating group response:', error);
      return {
        text: `${speaker.name} nods thoughtfully.`,
        seed,
        valid: false,
        error: error.message
      };
    }
  }

  buildGroupPrompt(speaker, listeners, input, context = {}) {
    const speakerPersonality = speaker.personality ? speaker.personality.toPromptString() : 'Neutral personality';
    const listenerNames = listeners.map(l => l.name).join(', ');
    const previousDialogue = context.previousDialogue ? '\n\nRecent conversation:\n' + context.previousDialogue.join('\n') : '';
    const questContext = context.questContext || '';

    let prompt = `You are ${speaker.name}, a ${speaker.occupation || 'person'}.

CHARACTER PROFILE:
${speakerPersonality}
Background: ${speaker.backstory || 'Unknown'}

You are in a GROUP CONVERSATION with: ${listenerNames}
${questContext}

${previousDialogue}

Someone says: "${input}"

Respond as ${speaker.name} would. Keep it natural (2-3 sentences).
You may:
- Address someone specific by name
- React to what was said
- Change the subject if appropriate
- Show your personality

Your response:`;

    return prompt;
  }

  /**
   * Determine who is being addressed
   */
  determineAddressedTo(conversation, speakerId, input) {
    if (!input) return null;

    const inputLower = input.toLowerCase();
    
    // Check if any participant's name is mentioned
    for (const [id, char] of conversation.participants) {
      if (id === speakerId) continue;
      
      const nameLower = char.name.toLowerCase();
      if (inputLower.includes(nameLower)) {
        return id;
      }
    }

    // Check last turn - if someone just spoke, likely responding to them
    const lastTurn = conversation.history[conversation.history.length - 1];
    if (lastTurn && lastTurn.speakerId !== speakerId) {
      return lastTurn.speakerId;
    }

    return null;
  }

  /**
   * Add participant to existing conversation
   */
  addParticipant(conversationId, character) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const added = conversation.addParticipant(character);
    
    if (added) {
      if (!this.characterConversations.has(character.id)) {
        this.characterConversations.set(character.id, new Set());
      }
      this.characterConversations.get(character.id).add(conversationId);
    }

    return added;
  }

  /**
   * Remove participant from conversation
   */
  removeParticipant(conversationId, characterId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${conversationId} not found`);
    }

    const removed = conversation.removeParticipant(characterId);
    
    if (removed) {
      const charConvs = this.characterConversations.get(characterId);
      if (charConvs) {
        charConvs.delete(conversationId);
      }
    }

    return removed;
  }

  /**
   * Get conversation
   */
  getConversation(conversationId) {
    return this.conversations.get(conversationId);
  }

  /**
   * Get all active conversations
   */
  getActiveConversations() {
    return Array.from(this.conversations.values()).filter(c => c.active);
  }

  /**
   * Get conversations a character is in
   */
  getCharacterConversations(characterId) {
    const convIds = this.characterConversations.get(characterId);
    if (!convIds) return [];
    
    return Array.from(convIds)
      .map(id => this.conversations.get(id))
      .filter(conv => conv && conv.active);
  }

  /**
   * Check if character can join a conversation
   */
  canJoinConversation(conversationId, characterId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || !conversation.active) {
      return false;
    }

    // Already in conversation
    if (conversation.participants.has(characterId)) {
      return false;
    }

    // Check if in another conversation
    const currentConvs = this.getCharacterConversations(characterId);
    if (currentConvs.length > 0) {
      return false; // Can only be in one conversation at a time
    }

    return true;
  }

  /**
   * Suggest next speaker in group
   */
  suggestNextSpeaker(conversationId, currentSpeakerId = null) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    return conversation.suggestNextSpeaker(currentSpeakerId);
  }

  /**
   * End a conversation
   */
  endConversation(conversationId) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return null;

    const summary = conversation.end();
    
    // Clean up character tracking
    conversation.participantIds.forEach(charId => {
      const charConvs = this.characterConversations.get(charId);
      if (charConvs) {
        charConvs.delete(conversationId);
      }
    });

    // Move to history
    this.conversationHistory.push(summary);
    this.conversations.delete(conversationId);
    
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }

    return summary;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const activeConversations = this.getActiveConversations();
    
    return {
      activeConversations: activeConversations.length,
      totalInHistory: this.conversationHistory.length,
      groupConversations: activeConversations.length,
      participantsInConversations: new Set(
        activeConversations.flatMap(c => c.participantIds)
      ).size
    };
  }

  /**
   * Clear all conversations
   */
  clear() {
    this.conversations.clear();
    this.characterConversations.clear();
    this.conversationHistory = [];
  }
}

export default ConversationManager;
