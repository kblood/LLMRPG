import { DialogueGenerator } from '../../ai/llm/DialogueGenerator.js';
import eventBus from '../../services/EventBus.js';

/**
 * Dialogue System
 * Manages conversations between characters
 * 
 * @class DialogueSystem
 */
export class DialogueSystem {
  constructor(options = {}) {
    this.dialogueGenerator = options.dialogueGenerator || new DialogueGenerator(options);
    this.activeConversations = new Map();
    this.conversationHistory = [];
    this.maxHistoryLength = options.maxHistoryLength || 100;
    this._characterCache = new Map();
  }

  async startConversation(initiator, responder, options = {}) {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this._characterCache.set(initiator.id, initiator);
    this._characterCache.set(responder.id, responder);

    const conversation = {
      id: conversationId,
      participants: [initiator.id, responder.id],
      initiator: initiator.id,
      responder: responder.id,
      startTime: Date.now(),
      turnCount: 0,
      history: [],
      active: true,
      context: options.context || {}
    };

    this.activeConversations.set(conversationId, conversation);
    initiator.startConversation(responder);
    responder.startConversation(initiator);

    eventBus.emit('dialogue:started', {
      conversationId,
      initiator: initiator.id,
      responder: responder.id
    });

    if (options.generateGreeting !== false) {
      await this.addTurn(conversationId, initiator.id, null, {
        isGreeting: true,
        situation: options.situation
      });
    }

    return conversationId;
  }

  async addTurn(conversationId, speakerId, input, options = {}) {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) throw new Error(`Conversation ${conversationId} not found`);
    if (!conversation.active) throw new Error(`Conversation ${conversationId} is no longer active`);

    const speaker = this._characterCache.get(speakerId);
    const listenerId = conversation.participants.find(id => id !== speakerId);
    const listener = this._characterCache.get(listenerId);

    let result;
    if (options.isGreeting || input === null) {
      result = await this.dialogueGenerator.generateGreeting(speaker, listener, {
        ...options,
        situation: options.situation || conversation.context.situation,
        previousDialogue: this.formatHistory(conversation.history),
        frame: conversation.turnCount
      });
    } else {
      result = await this.dialogueGenerator.generateResponse(speaker, listener, input, {
        ...options,
        previousDialogue: this.formatHistory(conversation.history),
        frame: conversation.turnCount
      });
    }

    const turn = {
      turnNumber: conversation.turnCount++,
      speakerId,
      listenerId,
      input,
      output: result.text,
      seed: result.seed,
      valid: result.valid,
      timestamp: Date.now(),
      issues: result.issues
    };

    conversation.history.push(turn);

    eventBus.emit('dialogue:turn', { conversationId, turn });

    if (result.valid && speaker && listener) {
      speaker.relationships.modifyRelationship(listenerId, 1, 'Had a conversation');
      listener.relationships.modifyRelationship(speakerId, 1, 'Had a conversation');
    }

    return result;
  }

  endConversation(conversationId) {
    const conversation = this.activeConversations.get(conversationId);
    if (!conversation) return;

    conversation.active = false;
    conversation.endTime = Date.now();
    conversation.duration = conversation.endTime - conversation.startTime;

    const char1 = this._characterCache.get(conversation.participants[0]);
    const char2 = this._characterCache.get(conversation.participants[1]);
    if (char1) char1.endConversation();
    if (char2) char2.endConversation();

    this.conversationHistory.push(conversation);
    this.activeConversations.delete(conversationId);

    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }

    eventBus.emit('dialogue:ended', {
      conversationId,
      turnCount: conversation.turnCount,
      duration: conversation.duration
    });

    if (char1 && char2) {
      const summary = this.summarizeConversation(conversation);
      char1.memory.addMemory('dialogue', `Had a conversation with ${char2.name}: ${summary}`, {
        participants: [char2.id],
        importance: 50
      });
      char2.memory.addMemory('dialogue', `Had a conversation with ${char1.name}: ${summary}`, {
        participants: [char1.id],
        importance: 50
      });
    }
  }

  getConversation(conversationId) {
    return this.activeConversations.get(conversationId);
  }

  getActiveConversations() {
    return Array.from(this.activeConversations.values());
  }

  getCharacterConversationHistory(characterId, count = 10) {
    return this.conversationHistory
      .filter(conv => conv.participants.includes(characterId))
      .slice(-count);
  }

  formatHistory(history) {
    return history.map(turn => {
      const speaker = this._characterCache.get(turn.speakerId);
      return `${speaker?.name || turn.speakerId}: ${turn.output}`;
    });
  }

  summarizeConversation(conversation) {
    if (conversation.history.length === 0) return 'brief chat';
    if (conversation.history.length === 1) return 'quick greeting';
    return `${conversation.history.length} exchanges`;
  }

  clear() {
    this.activeConversations.clear();
    this.conversationHistory = [];
    this._characterCache.clear();
  }

  getStats() {
    return {
      activeConversations: this.activeConversations.size,
      totalConversationsInHistory: this.conversationHistory.length,
      totalTurnsInActive: Array.from(this.activeConversations.values())
        .reduce((sum, conv) => sum + conv.turnCount, 0)
    };
  }

  getStatistics() {
    const allConversations = [
      ...Array.from(this.activeConversations.values()),
      ...this.conversationHistory
    ];
    
    const totalTurns = allConversations.reduce((sum, conv) => sum + conv.turnCount, 0);
    const avgLength = allConversations.length > 0 
      ? totalTurns / allConversations.length 
      : 0;
    
    return {
      totalConversations: allConversations.length,
      activeConversations: this.activeConversations.size,
      completedConversations: this.conversationHistory.length,
      totalDialogueTurns: totalTurns,
      averageConversationLength: avgLength
    };
  }
}

export default DialogueSystem;
