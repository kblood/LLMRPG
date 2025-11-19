import { EventBus } from '../../services/EventBus.js';

/**
 * Group Conversation
 * Manages conversations with 3+ participants
 * Handles turn-taking, interruptions, and multi-party dynamics
 */
export class GroupConversation {
  constructor(id, participants, options = {}) {
    this.id = id;
    this.participants = new Map(); // participantId -> character
    this.participantIds = [];
    this.startTime = Date.now();
    this.turnCount = 0;
    this.history = [];
    this.active = true;
    this.context = options.context || {};
    this.eventBus = EventBus.getInstance();
    
    // Group-specific settings
    this.allowInterruptions = options.allowInterruptions !== false;
    this.allowSideConversations = options.allowSideConversations || false;
    this.maxTurnsBeforeRotation = options.maxTurnsBeforeRotation || 3;
    
    // Tracking
    this.speakerQueue = [];
    this.lastSpeaker = null;
    this.consecutiveTurns = 0;
    
    // Add participants
    participants.forEach(char => this.addParticipant(char));
  }

  addParticipant(character) {
    if (this.participants.has(character.id)) {
      return false;
    }
    
    this.participants.set(character.id, character);
    this.participantIds.push(character.id);
    
    // Notify all existing participants
    character.startConversation(Array.from(this.participants.values()).filter(c => c.id !== character.id));
    
    this.eventBus.emit('group:participant_joined', {
      conversationId: this.id,
      participantId: character.id,
      totalParticipants: this.participants.size
    });
    
    return true;
  }

  removeParticipant(characterId) {
    const character = this.participants.get(characterId);
    if (!character) {
      return false;
    }
    
    this.participants.delete(characterId);
    this.participantIds = this.participantIds.filter(id => id !== characterId);
    
    character.endConversation();
    
    this.eventBus.emit('group:participant_left', {
      conversationId: this.id,
      participantId: characterId,
      totalParticipants: this.participants.size
    });
    
    // End conversation if too few participants
    if (this.participants.size < 2) {
      this.active = false;
    }
    
    return true;
  }

  getParticipant(characterId) {
    return this.participants.get(characterId);
  }

  getAllParticipants() {
    return Array.from(this.participants.values());
  }

  getOtherParticipants(characterId) {
    return Array.from(this.participants.values()).filter(c => c.id !== characterId);
  }

  addTurn(speakerId, input, output, options = {}) {
    const speaker = this.participants.get(speakerId);
    if (!speaker) {
      throw new Error(`Speaker ${speakerId} not in conversation`);
    }

    const turn = {
      turnNumber: this.turnCount++,
      speakerId,
      speakerName: speaker.name,
      input: input || null,
      output,
      timestamp: Date.now(),
      addressedTo: options.addressedTo || null, // Who they're talking to
      type: options.type || 'normal', // normal, interruption, aside, greeting
      seed: options.seed,
      valid: options.valid !== false
    };

    this.history.push(turn);
    
    // Track consecutive turns
    if (this.lastSpeaker === speakerId) {
      this.consecutiveTurns++;
    } else {
      this.consecutiveTurns = 1;
      this.lastSpeaker = speakerId;
    }
    
    // Emit event
    this.eventBus.emit('group:turn', {
      conversationId: this.id,
      turn
    });

    return turn;
  }

  /**
   * Get recent turns for context
   */
  getRecentHistory(count = 10) {
    return this.history.slice(-count);
  }

  /**
   * Format history for display or prompt
   */
  formatHistory(turns = null) {
    const historyToFormat = turns || this.history;
    return historyToFormat.map(turn => {
      const addressed = turn.addressedTo 
        ? ` (to ${this.participants.get(turn.addressedTo)?.name || 'someone'})` 
        : '';
      return `${turn.speakerName}${addressed}: ${turn.output}`;
    });
  }

  /**
   * Get turns where a specific character spoke
   */
  getTurnsByParticipant(characterId) {
    return this.history.filter(turn => turn.speakerId === characterId);
  }

  /**
   * Determine who should speak next
   */
  suggestNextSpeaker(currentSpeakerId = null) {
    // Don't let same person dominate
    if (currentSpeakerId && this.consecutiveTurns >= this.maxTurnsBeforeRotation) {
      return this.participantIds.find(id => id !== currentSpeakerId);
    }

    // Check if someone was directly addressed
    const lastTurn = this.history[this.history.length - 1];
    if (lastTurn?.addressedTo && lastTurn.addressedTo !== currentSpeakerId) {
      return lastTurn.addressedTo;
    }

    // Rotate to someone who hasn't spoken recently
    const recentSpeakers = this.history.slice(-5).map(t => t.speakerId);
    const leastRecent = this.participantIds.find(id => 
      !recentSpeakers.includes(id) && id !== currentSpeakerId
    );
    
    if (leastRecent) {
      return leastRecent;
    }

    // Default: anyone but current speaker
    return this.participantIds.find(id => id !== currentSpeakerId);
  }

  /**
   * Check if a character can interrupt
   */
  canInterrupt(characterId) {
    if (!this.allowInterruptions) {
      return false;
    }

    // Can't interrupt yourself
    if (this.lastSpeaker === characterId) {
      return false;
    }

    // Can interrupt if haven't spoken in a while
    const recentTurns = this.history.slice(-5);
    const hasSpokenRecently = recentTurns.some(t => t.speakerId === characterId);
    
    return !hasSpokenRecently;
  }

  /**
   * Get conversation summary
   */
  getSummary() {
    const participantNames = Array.from(this.participants.values()).map(p => p.name);
    const duration = Date.now() - this.startTime;
    
    return {
      id: this.id,
      participants: participantNames,
      participantCount: this.participants.size,
      turnCount: this.turnCount,
      duration,
      active: this.active,
      recentTurns: this.getRecentHistory(5)
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const stats = {
      totalTurns: this.history.length,
      participantCount: this.participants.size,
      duration: Date.now() - this.startTime
    };

    // Count turns per participant
    stats.turnsPerParticipant = {};
    this.participants.forEach((char, id) => {
      stats.turnsPerParticipant[char.name] = this.getTurnsByParticipant(id).length;
    });

    // Turn types
    stats.turnTypes = {
      normal: this.history.filter(t => t.type === 'normal').length,
      interruption: this.history.filter(t => t.type === 'interruption').length,
      aside: this.history.filter(t => t.type === 'aside').length,
      greeting: this.history.filter(t => t.type === 'greeting').length
    };

    return stats;
  }

  /**
   * End the conversation
   */
  end() {
    this.active = false;
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;

    // Notify all participants
    this.participants.forEach(char => {
      char.endConversation();
    });

    this.eventBus.emit('group:ended', {
      conversationId: this.id,
      participants: this.participantIds,
      turnCount: this.turnCount,
      duration: this.duration
    });

    return this.getSummary();
  }

  /**
   * Serialize for saving
   */
  toJSON() {
    return {
      id: this.id,
      participantIds: this.participantIds,
      startTime: this.startTime,
      turnCount: this.turnCount,
      history: this.history,
      active: this.active,
      context: this.context,
      lastSpeaker: this.lastSpeaker,
      consecutiveTurns: this.consecutiveTurns
    };
  }

  /**
   * Deserialize from saved data
   */
  static fromJSON(json, characterMap) {
    const participants = json.participantIds
      .map(id => characterMap.get(id))
      .filter(char => char);
    
    const conversation = new GroupConversation(json.id, participants, {
      context: json.context
    });
    
    conversation.startTime = json.startTime;
    conversation.turnCount = json.turnCount;
    conversation.history = json.history;
    conversation.active = json.active;
    conversation.lastSpeaker = json.lastSpeaker;
    conversation.consecutiveTurns = json.consecutiveTurns;
    
    return conversation;
  }
}

export default GroupConversation;
