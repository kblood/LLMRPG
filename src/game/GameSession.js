import { DialogueSystem } from '../systems/dialogue/DialogueSystem.js';
import { ConversationManager } from '../systems/dialogue/ConversationManager.js';
import { QuestManager } from '../systems/quest/QuestManager.js';
import { QuestGenerator } from '../systems/quest/QuestGenerator.js';
import { QuestDetector } from '../systems/quest/QuestDetector.js';
import { QuestContextBuilder } from '../systems/quest/QuestContextBuilder.js';
import { SeedManager } from '../services/SeedManager.js';
import { EventBus } from '../services/EventBus.js';

/**
 * Game Session - Manages game state
 */
export class GameSession {
  constructor(options = {}) {
    this.seed = options.seed || Date.now();
    this.sessionId = `session_${this.seed}`;
    
    this.seedManager = new SeedManager(this.seed);
    this.eventBus = EventBus.getInstance();
    
    this.dialogueSystem = new DialogueSystem({
      seedManager: this.seedManager,
      model: options.model || 'llama3.1:8b',
      temperature: options.temperature || 0.8,
      timeout: options.timeout || 60000
    });
    
    this.conversationManager = new ConversationManager({
      seedManager: this.seedManager,
      model: options.model || 'llama3.1:8b',
      temperature: options.temperature || 0.8,
      timeout: options.timeout || 60000
    });
    
    this.questManager = new QuestManager();
    this.questGenerator = new QuestGenerator({
      model: options.model || 'llama3.1:8b',
      temperature: 0.7,
      seedManager: this.seedManager
    });
    this.questDetector = new QuestDetector({
      model: options.model || 'llama3.1:8b',
      seedManager: this.seedManager
    });
    this.questContextBuilder = new QuestContextBuilder(this.questManager);
    
    this.setupEventHandlers();

    this.characters = new Map();
    this.protagonist = null;
    this.currentLocation = null;
    this.frame = 0;
    this.startTime = Date.now();
    this.gameTime = 0;
    this.paused = false;
    this.autoDetectQuests = options.autoDetectQuests !== false;
  }

  setupEventHandlers() {
    this.eventBus.on('quest:created', ({ quest }) => {
      console.log(`[Quest] Created: ${quest.title}`);
    });
    
    this.eventBus.on('quest:completed', ({ quest }) => {
      console.log(`[Quest] Completed: ${quest.title}`);
      this.applyQuestRewards(quest);
    });
  }

  applyQuestRewards(quest) {
    if (quest.rewards.relationship && quest.giver) {
      const npc = this.getCharacter(quest.giver);
      if (npc && this.protagonist) {
        npc.relationships.modifyRelationship(
          this.protagonist.id,
          quest.rewards.relationship,
          `Completed quest: ${quest.title}`
        );
      }
    }
  }

  addCharacter(character) {
    this.characters.set(character.id, character);
    if (character.isProtagonist()) {
      this.protagonist = character;
    }
  }

  getCharacter(characterId) {
    return this.characters.get(characterId);
  }

  getAllCharacters() {
    return Array.from(this.characters.values());
  }

  getNPCs() {
    return this.getAllCharacters().filter(c => !c.isProtagonist());
  }

  getCharactersAtLocation() {
    if (!this.currentLocation) return this.getNPCs();
    return this.getNPCs().filter(c => c.location === this.currentLocation);
  }

  async startConversation(npcId, options = {}) {
    const npc = this.getCharacter(npcId);
    if (!npc) throw new Error(`Character ${npcId} not found`);
    if (!this.protagonist) throw new Error('No protagonist set');

    // Add quest context for the NPC
    const questContext = this.questContextBuilder.buildShortSummary(npc, this.protagonist);
    
    return await this.dialogueSystem.startConversation(npc, this.protagonist, {
      ...options,
      frame: this.frame,
      questContext
    });
  }

  async addConversationTurn(conversationId, speakerId, input, options = {}) {
    const npc = this.getCharacter(speakerId);
    
    // Add quest context for the NPC
    let questContext = '';
    if (npc && !npc.isProtagonist()) {
      questContext = this.questContextBuilder.buildShortSummary(npc, this.protagonist);
    }
    
    const response = await this.dialogueSystem.addTurn(conversationId, speakerId, input, {
      ...options,
      frame: this.frame,
      questContext
    });
    
    if (this.autoDetectQuests && response.text) {
      await this.checkForQuestInDialogueEnhanced(speakerId, response.text, conversationId);
    }
    
    return response;
  }

  async checkForQuestInDialogue(npcId, dialogue, conversationId) {
    const npc = this.getCharacter(npcId);
    if (!npc || npc.isProtagonist()) return null;

    const context = {
      frame: this.frame,
      relationship: npc.relationships.getRelationshipLevel(this.protagonist?.id),
      memories: npc.memory.getRecentMemories(5)
    };

    const detection = await this.questGenerator.detectQuestInDialogue(npc, dialogue, context);
    
    if (detection.hasQuest) {
      const questData = await this.questGenerator.generateQuestFromContext(npc, dialogue, context);
      questData.conversationId = conversationId;
      questData.frame = this.frame;
      
      const questId = this.questManager.createQuest(questData);
      return questId;
    }
    
    return null;
  }

  async checkForQuestInDialogueEnhanced(npcId, dialogue, conversationId) {
    const npc = this.getCharacter(npcId);
    if (!npc || npc.isProtagonist()) return null;

    const context = {
      frame: this.frame,
      relationship: npc.relationships.getRelationshipLevel(this.protagonist?.id),
      memories: npc.memory.getRecentMemories(5)
    };

    // Use enhanced detector
    const detection = await this.questDetector.analyzeDialogue(npc, dialogue, context);
    
    if (detection.hasQuest && detection.confidence >= 60) {
      const questData = await this.questGenerator.generateQuestFromContext(npc, dialogue, context);
      questData.conversationId = conversationId;
      questData.frame = this.frame;
      questData.metadata = {
        ...questData.metadata,
        detectionConfidence: detection.confidence,
        questType: detection.questType,
        urgency: detection.urgency
      };
      
      const questId = this.questManager.createQuest(questData);
      
      // Add quest to NPC's memory
      npc.memory.addMemory('quest_given', `I asked ${this.protagonist.name} to help with: ${questData.title}`, {
        importance: 70,
        questId
      });
      
      return questId;
    }
    
    return null;
  }

  async completeQuest(questId) {
    return this.questManager.completeQuest(questId);
  }

  getActiveQuests() {
    return this.questManager.getActiveQuests();
  }

  getQuestsByNPC(npcId) {
    return this.questManager.getQuestsByGiver(npcId);
  }

  // ===== GROUP CONVERSATION METHODS (Phase 5.2) =====

  async startGroupConversation(participantIds, options = {}) {
    const participants = participantIds
      .map(id => this.getCharacter(id))
      .filter(char => char);
    
    if (participants.length < 2) {
      throw new Error('Group conversation requires at least 2 participants');
    }

    const conversationId = await this.conversationManager.startGroupConversation(participants, {
      ...options,
      frame: this.frame
    });

    return conversationId;
  }

  async addGroupConversationTurn(conversationId, speakerId, input, options = {}) {
    const npc = this.getCharacter(speakerId);
    
    // Add quest context for the NPC
    let questContext = '';
    if (npc && !npc.isProtagonist()) {
      questContext = this.questContextBuilder.buildShortSummary(npc, this.protagonist);
    }

    const response = await this.conversationManager.addGroupTurn(conversationId, speakerId, input, {
      ...options,
      frame: this.frame,
      questContext
    });

    // Quest detection in group conversations
    if (this.autoDetectQuests && response.text && npc) {
      await this.checkForQuestInDialogueEnhanced(speakerId, response.text, conversationId);
    }

    return response;
  }

  addParticipantToConversation(conversationId, characterId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      throw new Error(`Character ${characterId} not found`);
    }

    return this.conversationManager.addParticipant(conversationId, character);
  }

  removeParticipantFromConversation(conversationId, characterId) {
    return this.conversationManager.removeParticipant(conversationId, characterId);
  }

  getGroupConversation(conversationId) {
    return this.conversationManager.getConversation(conversationId);
  }

  getActiveGroupConversations() {
    return this.conversationManager.getActiveConversations();
  }

  endGroupConversation(conversationId) {
    return this.conversationManager.endConversation(conversationId);
  }

  suggestNextSpeaker(conversationId, currentSpeakerId = null) {
    return this.conversationManager.suggestNextSpeaker(conversationId, currentSpeakerId);
  }

  endConversation(conversationId) {
    this.dialogueSystem.endConversation(conversationId);
  }

  tick() {
    if (this.paused) return;
    this.frame++;
    this.gameTime += 1;
  }

  getGameTimeString() {
    const hours = Math.floor(this.gameTime / 60) % 24;
    const minutes = this.gameTime % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getTimeOfDay() {
    const hours = Math.floor(this.gameTime / 60) % 24;
    if (hours >= 5 && hours < 12) return 'morning';
    if (hours >= 12 && hours < 17) return 'afternoon';
    if (hours >= 17 && hours < 21) return 'evening';
    return 'night';
  }

  getStats() {
    const dialogueStats = this.dialogueSystem.getStats();
    const questStats = this.questManager.getStats();
    
    return {
      sessionId: this.sessionId,
      seed: this.seed,
      frame: this.frame,
      gameTime: this.getGameTimeString(),
      timeOfDay: this.getTimeOfDay(),
      characterCount: this.characters.size,
      npcCount: this.getNPCs().length,
      realTimePlayed: Math.floor((Date.now() - this.startTime) / 1000),
      ...dialogueStats,
      ...questStats
    };
  }

  toJSON() {
    return {
      seed: this.seed,
      sessionId: this.sessionId,
      frame: this.frame,
      gameTime: this.gameTime,
      currentLocation: this.currentLocation,
      protagonist: this.protagonist?.id,
      characters: Array.from(this.characters.values()).map(c => c.toJSON()),
      seedManager: this.seedManager.toJSON(),
      questManager: this.questManager.toJSON(),
      startTime: this.startTime
    };
  }
}

export default GameSession;
