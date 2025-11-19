import { EventBus } from '../../services/EventBus.js';
import Logger from '../../utils/Logger.js';

/**
 * QuestProgressionManager - Manages dynamic quest progression through gameplay
 *
 * Features:
 * - Detects objective completion through player actions (dialogue, travel, etc.)
 * - Updates quest guidance dynamically based on progress
 * - Emits quest events for other systems to react
 * - Awards quest rewards on completion
 * - Provides hints and next steps for players
 *
 * Objective Types:
 * - "talk": Complete when player talks to specific NPC
 * - "visit": Complete when player visits specific location
 * - "learn": Complete when NPC shares specific information
 * - "investigate": Complete when player gathers enough information
 * - "general": Complete through narrative progression
 */
export class QuestProgressionManager {
  constructor(questManager, options = {}) {
    this.questManager = questManager;
    this.eventBus = EventBus.getInstance();
    this.logger = new Logger('QuestProgressionManager');

    // Track completed actions to detect objectives
    this.actionHistory = [];
    this.conversationTopics = new Map(); // conversationId -> Set of topics discussed
    this.visitedLocations = new Set();
    this.talkedToNPCs = new Set();
    this.learnedInformation = new Set();

    // Register event listeners
    this.registerEventListeners();
  }

  /**
   * Register listeners for game events
   */
  registerEventListeners() {
    // Listen for dialogue events
    this.eventBus.on('dialogue:started', (data) => this.onDialogueStarted(data));
    this.eventBus.on('dialogue:turn', (data) => this.onDialogueTurn(data));

    // Listen for location events
    this.eventBus.on('location:visited', (data) => this.onLocationVisited(data));

    // Listen for quest events
    this.eventBus.on('quest:created', (data) => this.onQuestCreated(data));

    this.logger.info('Quest progression event listeners registered');
  }

  /**
   * Handle dialogue started event
   */
  onDialogueStarted(data) {
    const { npcId, conversationId } = data;

    // Record that player talked to this NPC
    this.talkedToNPCs.add(npcId);
    this.actionHistory.push({
      type: 'talk',
      target: npcId,
      timestamp: Date.now(),
      conversationId
    });

    // Check for "talk to NPC" objectives
    this.checkTalkObjectives(npcId);
  }

  /**
   * Handle dialogue turn event
   */
  onDialogueTurn(data) {
    const { conversationId, npcId, text } = data;

    // Extract topics/keywords from dialogue
    const topics = this.extractTopics(text);

    if (!this.conversationTopics.has(conversationId)) {
      this.conversationTopics.set(conversationId, new Set());
    }

    const conversationTopicsSet = this.conversationTopics.get(conversationId);
    topics.forEach(topic => {
      conversationTopicsSet.add(topic);
      this.learnedInformation.add(topic);
    });

    // Check for "learn about X" objectives
    this.checkLearnObjectives(topics);

    // Record action
    this.actionHistory.push({
      type: 'dialogue',
      npcId,
      topics,
      timestamp: Date.now(),
      conversationId
    });
  }

  /**
   * Handle location visited event
   */
  onLocationVisited(data) {
    const { locationId, locationName } = data;

    // Record visit
    this.visitedLocations.add(locationId);
    this.actionHistory.push({
      type: 'visit',
      target: locationId,
      targetName: locationName,
      timestamp: Date.now()
    });

    // Check for "visit location" objectives
    this.checkVisitObjectives(locationId, locationName);
  }

  /**
   * Handle quest created event
   */
  onQuestCreated(data) {
    const { quest } = data;
    this.logger.info(`New quest created: ${quest.title} (${quest.id})`);

    // Initialize quest guidance if not present
    if (!quest.guidance) {
      quest.guidance = this.generateInitialGuidance(quest);
    }
  }

  /**
   * Check if any "talk to NPC" objectives are completed
   */
  checkTalkObjectives(npcId) {
    const activeQuests = this.questManager.getActiveQuests();

    activeQuests.forEach(quest => {
      quest.objectives.forEach(objective => {
        if (objective.completed) return;

        // Check if this is a "talk" objective targeting this NPC
        if (this.isTalkObjective(objective, npcId)) {
          this.completeObjective(quest.id, objective.id, {
            reason: `Talked to ${objective.target}`,
            npcId
          });
        }
      });
    });
  }

  /**
   * Check if any "visit location" objectives are completed
   */
  checkVisitObjectives(locationId, locationName) {
    const activeQuests = this.questManager.getActiveQuests();

    activeQuests.forEach(quest => {
      quest.objectives.forEach(objective => {
        if (objective.completed) return;

        // Check if this is a "visit" objective targeting this location
        if (this.isVisitObjective(objective, locationId, locationName)) {
          this.completeObjective(quest.id, objective.id, {
            reason: `Visited ${locationName || locationId}`,
            locationId
          });
        }
      });
    });
  }

  /**
   * Check if any "learn about X" objectives are completed
   */
  checkLearnObjectives(topics) {
    const activeQuests = this.questManager.getActiveQuests();

    activeQuests.forEach(quest => {
      quest.objectives.forEach(objective => {
        if (objective.completed) return;

        // Check if this is a "learn" objective about these topics
        if (this.isLearnObjective(objective, topics)) {
          this.completeObjective(quest.id, objective.id, {
            reason: `Learned about ${objective.target}`,
            topics
          });
        }
      });
    });
  }

  /**
   * Complete an objective and update quest guidance
   */
  completeObjective(questId, objectiveId, context = {}) {
    const quest = this.questManager.getQuest(questId);
    if (!quest) return;

    // Find the objective
    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective || objective.completed) return;

    this.logger.info(`Completing objective "${objective.description}" for quest "${quest.title}"`);

    // Mark objective as completed
    const result = this.questManager.updateObjective(questId, objectiveId, 1);

    if (result.objectiveCompleted) {
      // Emit objective completed event
      this.eventBus.emit('quest:objective_completed', {
        questId,
        objectiveId,
        objective,
        context
      });

      // Update quest guidance
      this.updateQuestGuidance(quest);

      // Check if quest is complete
      if (result.questCompleted) {
        this.onQuestCompleted(quest);
      }
    }
  }

  /**
   * Update quest guidance based on current progress
   */
  updateQuestGuidance(quest) {
    if (!quest) return;

    // Find next incomplete objective
    const nextObjective = quest.objectives.find(obj => !obj.completed);

    if (!nextObjective) {
      // All objectives complete - guidance points to quest giver for reward
      quest.guidance = {
        nextLocation: null,
        nextNPC: quest.giver,
        hint: `Return to ${quest.giver} to complete the quest`,
        status: 'ready_to_complete'
      };
      return;
    }

    // Generate guidance based on objective type
    const guidance = this.generateObjectiveGuidance(nextObjective, quest);
    quest.guidance = guidance;

    // Emit guidance updated event
    this.eventBus.emit('quest:guidance_updated', {
      questId: quest.id,
      guidance
    });

    this.logger.info(`Updated guidance for quest "${quest.title}": ${guidance.hint}`);
  }

  /**
   * Generate guidance for a specific objective
   */
  generateObjectiveGuidance(objective, quest) {
    const guidance = {
      nextLocation: null,
      nextNPC: null,
      hint: '',
      objectiveId: objective.id
    };

    switch (objective.type) {
      case 'talk':
        guidance.nextNPC = objective.target;
        guidance.hint = `Talk to ${objective.target}`;
        break;

      case 'visit':
        guidance.nextLocation = objective.target;
        guidance.hint = `Go to ${objective.target}`;
        break;

      case 'learn':
        guidance.hint = `Learn about ${objective.target}`;
        guidance.nextNPC = this.suggestNPCForTopic(objective.target);
        break;

      case 'investigate':
        guidance.hint = objective.description;
        guidance.nextLocation = objective.target || null;
        break;

      default:
        guidance.hint = objective.description;
        break;
    }

    return guidance;
  }

  /**
   * Generate initial guidance when quest is created
   */
  generateInitialGuidance(quest) {
    if (quest.objectives.length === 0) {
      return {
        nextLocation: null,
        nextNPC: quest.giver,
        hint: 'Talk to the quest giver for more information'
      };
    }

    return this.generateObjectiveGuidance(quest.objectives[0], quest);
  }

  /**
   * Handle quest completion
   */
  onQuestCompleted(quest) {
    this.logger.info(`Quest completed: ${quest.title}`);

    // Award rewards
    this.awardQuestRewards(quest);

    // Emit quest completed event (already emitted by QuestManager, but we can add context)
    this.eventBus.emit('quest:fully_completed', {
      questId: quest.id,
      quest,
      rewards: quest.rewards
    });
  }

  /**
   * Award quest rewards
   */
  awardQuestRewards(quest) {
    if (!quest.rewards) return;

    const rewards = quest.rewards;
    const rewardList = [];

    // Relationship rewards
    if (rewards.relationship && quest.giver) {
      this.eventBus.emit('relationship:change', {
        npcId: quest.giver,
        change: rewards.relationship,
        reason: `Completed quest: ${quest.title}`
      });
      rewardList.push(`+${rewards.relationship} relationship with ${quest.giver}`);
    }

    // Experience rewards
    if (rewards.experience) {
      this.eventBus.emit('player:experience_gained', {
        amount: rewards.experience,
        source: quest.title
      });
      rewardList.push(`${rewards.experience} experience`);
    }

    // Item rewards
    if (rewards.items && rewards.items.length > 0) {
      rewards.items.forEach(item => {
        this.eventBus.emit('player:item_received', {
          item,
          source: quest.title
        });
        rewardList.push(item.name || item);
      });
    }

    // Gold/currency rewards
    if (rewards.gold) {
      this.eventBus.emit('player:gold_received', {
        amount: rewards.gold,
        source: quest.title
      });
      rewardList.push(`${rewards.gold} gold`);
    }

    if (rewardList.length > 0) {
      this.logger.info(`Rewards awarded: ${rewardList.join(', ')}`);
    }

    // Emit rewards granted event
    this.eventBus.emit('quest:rewards_granted', {
      questId: quest.id,
      rewards: rewardList
    });
  }

  /**
   * Check if objective is a "talk to NPC" objective
   */
  isTalkObjective(objective, npcId) {
    if (objective.type !== 'talk') return false;

    // Match by ID or name (case-insensitive)
    const target = objective.target.toLowerCase();
    return npcId.toLowerCase() === target || npcId.toLowerCase().includes(target);
  }

  /**
   * Check if objective is a "visit location" objective
   */
  isVisitObjective(objective, locationId, locationName) {
    if (objective.type !== 'visit' && objective.type !== 'go_to') return false;

    const target = objective.target.toLowerCase();
    const idMatch = locationId.toLowerCase() === target || locationId.toLowerCase().includes(target);
    const nameMatch = locationName && locationName.toLowerCase().includes(target);

    return idMatch || nameMatch;
  }

  /**
   * Check if objective is a "learn about X" objective
   */
  isLearnObjective(objective, topics) {
    if (objective.type !== 'learn') return false;

    const target = objective.target.toLowerCase();

    // Check if any discussed topics match the objective
    return topics.some(topic =>
      topic.toLowerCase().includes(target) ||
      target.includes(topic.toLowerCase())
    );
  }

  /**
   * Extract topics/keywords from dialogue text
   */
  extractTopics(text) {
    if (!text) return [];

    const topics = [];
    const lowercaseText = text.toLowerCase();

    // Common quest-related keywords
    const keywords = [
      'theft', 'thief', 'thieves', 'stealing', 'stolen',
      'grain', 'mill', 'shipment', 'cargo', 'supplies',
      'mystery', 'conspiracy', 'plot', 'scheme',
      'bandits', 'criminals', 'gang',
      'village', 'town', 'forest', 'quarry', 'ruins',
      'suspect', 'evidence', 'clue', 'information',
      'merchant', 'trader', 'guard', 'witness'
    ];

    keywords.forEach(keyword => {
      if (lowercaseText.includes(keyword)) {
        topics.push(keyword);
      }
    });

    return topics;
  }

  /**
   * Suggest an NPC who might know about a topic
   * This is a simple implementation - could be enhanced with NPC knowledge system
   */
  suggestNPCForTopic(topic) {
    // This would ideally query the world's NPC knowledge system
    // For now, return null to indicate "ask around"
    return null;
  }

  /**
   * Get current quest progress for display
   */
  getQuestProgress(questId) {
    const quest = this.questManager.getQuest(questId);
    if (!quest) return null;

    const progress = quest.getProgress();

    return {
      questId: quest.id,
      title: quest.title,
      description: quest.description,
      progress,
      objectives: quest.objectives.map(obj => ({
        id: obj.id,
        description: obj.description,
        type: obj.type,
        completed: obj.completed
      })),
      guidance: quest.guidance || this.generateInitialGuidance(quest),
      state: quest.state
    };
  }

  /**
   * Get all active quests with progress
   */
  getAllQuestProgress() {
    const activeQuests = this.questManager.getActiveQuests();
    return activeQuests.map(quest => this.getQuestProgress(quest.id));
  }

  /**
   * Manually trigger objective completion (for testing or special cases)
   */
  triggerObjectiveCompletion(questId, objectiveId, reason = 'Manual completion') {
    this.completeObjective(questId, objectiveId, { reason });
  }

  /**
   * Check all active quests for potential objective completions
   * Based on current game state
   */
  checkAllObjectives(gameState = {}) {
    const activeQuests = this.questManager.getActiveQuests();

    activeQuests.forEach(quest => {
      quest.objectives.forEach(objective => {
        if (objective.completed) return;

        // Check based on objective type
        switch (objective.type) {
          case 'talk':
            if (this.talkedToNPCs.has(objective.target)) {
              this.completeObjective(quest.id, objective.id, {
                reason: 'Already talked to NPC'
              });
            }
            break;

          case 'visit':
            if (this.visitedLocations.has(objective.target)) {
              this.completeObjective(quest.id, objective.id, {
                reason: 'Already visited location'
              });
            }
            break;

          case 'learn':
            const hasLearned = Array.from(this.learnedInformation).some(info =>
              info.toLowerCase().includes(objective.target.toLowerCase())
            );
            if (hasLearned) {
              this.completeObjective(quest.id, objective.id, {
                reason: 'Already learned information'
              });
            }
            break;
        }
      });
    });
  }

  /**
   * Get action history (for debugging/analysis)
   */
  getActionHistory(limit = 100) {
    return this.actionHistory.slice(-limit);
  }

  /**
   * Get statistics about quest progression
   */
  getStats() {
    return {
      totalActions: this.actionHistory.length,
      npcsInteracted: this.talkedToNPCs.size,
      locationsVisited: this.visitedLocations.size,
      topicsDiscussed: this.learnedInformation.size,
      activeQuests: this.questManager.getActiveQuests().length,
      completedQuests: this.questManager.getCompletedQuests().length
    };
  }

  /**
   * Reset tracking (for testing)
   */
  reset() {
    this.actionHistory = [];
    this.conversationTopics.clear();
    this.visitedLocations.clear();
    this.talkedToNPCs.clear();
    this.learnedInformation.clear();
    this.logger.info('Quest progression tracking reset');
  }

  /**
   * Serialize state for saving
   */
  toJSON() {
    return {
      actionHistory: this.actionHistory,
      conversationTopics: Array.from(this.conversationTopics.entries()).map(([k, v]) => [k, Array.from(v)]),
      visitedLocations: Array.from(this.visitedLocations),
      talkedToNPCs: Array.from(this.talkedToNPCs),
      learnedInformation: Array.from(this.learnedInformation)
    };
  }

  /**
   * Restore state from saved data
   */
  static fromJSON(data, questManager) {
    const manager = new QuestProgressionManager(questManager);

    manager.actionHistory = data.actionHistory || [];
    manager.conversationTopics = new Map(
      (data.conversationTopics || []).map(([k, v]) => [k, new Set(v)])
    );
    manager.visitedLocations = new Set(data.visitedLocations || []);
    manager.talkedToNPCs = new Set(data.talkedToNPCs || []);
    manager.learnedInformation = new Set(data.learnedInformation || []);

    return manager;
  }
}

export default QuestProgressionManager;
