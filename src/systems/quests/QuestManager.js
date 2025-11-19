/**
 * QuestManager - Manages quests, objectives, and rewards
 *
 * Features:
 * - Quest tracking
 * - Objective completion
 * - Quest rewards
 * - Quest chains
 */

export class Quest {
  /**
   * Create a quest
   * @param {Object} data - Quest data
   */
  constructor(data = {}) {
    this.id = data.id || this._generateId();
    this.title = data.title || 'Untitled Quest';
    this.description = data.description || '';
    this.questGiver = data.questGiver || 'Unknown';
    this.type = data.type || 'main'; // main, side, daily, achievement
    this.level = data.level || 1;

    // Objectives
    this.objectives = data.objectives || [];
    // Each objective: { id, description, type, target, current, required, completed }

    // State
    this.status = data.status || 'available'; // available, active, completed, failed
    this.startedAt = data.startedAt || null;
    this.completedAt = data.completedAt || null;

    // Rewards
    this.rewards = {
      experience: data.rewards?.experience || 0,
      gold: data.rewards?.gold || 0,
      items: data.rewards?.items || [], // Array of { itemId, quantity }
      reputation: data.rewards?.reputation || {} // { faction: amount }
    };

    // Quest chain
    this.prerequisiteQuests = data.prerequisiteQuests || []; // Quest IDs required
    this.nextQuests = data.nextQuests || []; // Quest IDs unlocked

    // Metadata
    this.timeLimit = data.timeLimit || null; // Minutes
    this.repeatable = data.repeatable || false;
    this.completionCount = data.completionCount || 0;
  }

  /**
   * Generate unique quest ID
   * @returns {string}
   * @private
   */
  _generateId() {
    return `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start quest
   * @returns {boolean}
   */
  start() {
    if (this.status !== 'available') return false;

    this.status = 'active';
    this.startedAt = Date.now();
    return true;
  }

  /**
   * Update objective progress
   * @param {string} objectiveId
   * @param {number} amount - Amount to add
   * @returns {boolean} Objective completed
   */
  updateObjective(objectiveId, amount = 1) {
    const objective = this.objectives.find(obj => obj.id === objectiveId);
    if (!objective || objective.completed) return false;

    objective.current = Math.min(objective.current + amount, objective.required);

    if (objective.current >= objective.required) {
      objective.completed = true;
      return true;
    }

    return false;
  }

  /**
   * Check if all objectives complete
   * @returns {boolean}
   */
  allObjectivesComplete() {
    return this.objectives.every(obj => obj.completed);
  }

  /**
   * Complete quest
   * @returns {boolean}
   */
  complete() {
    if (this.status !== 'active' || !this.allObjectivesComplete()) {
      return false;
    }

    this.status = 'completed';
    this.completedAt = Date.now();
    this.completionCount++;

    // Reset if repeatable
    if (this.repeatable) {
      this.objectives.forEach(obj => {
        obj.current = 0;
        obj.completed = false;
      });
      this.status = 'available';
    }

    return true;
  }

  /**
   * Fail quest
   */
  fail() {
    if (this.status === 'active') {
      this.status = 'failed';
    }
  }

  /**
   * Get progress percentage
   * @returns {number} 0-100
   */
  getProgress() {
    if (this.objectives.length === 0) return 0;

    const totalRequired = this.objectives.reduce((sum, obj) => sum + obj.required, 0);
    const totalCurrent = this.objectives.reduce((sum, obj) => sum + obj.current, 0);

    return Math.floor((totalCurrent / totalRequired) * 100);
  }

  /**
   * Get summary
   * @returns {Object}
   */
  getSummary() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      status: this.status,
      type: this.type,
      level: this.level,
      progress: this.getProgress(),
      objectives: this.objectives.map(obj => ({
        description: obj.description,
        current: obj.current,
        required: obj.required,
        completed: obj.completed
      })),
      rewards: this.rewards
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      questGiver: this.questGiver,
      type: this.type,
      level: this.level,
      objectives: this.objectives,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      rewards: this.rewards,
      prerequisiteQuests: this.prerequisiteQuests,
      nextQuests: this.nextQuests,
      timeLimit: this.timeLimit,
      repeatable: this.repeatable,
      completionCount: this.completionCount
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {Quest}
   */
  static fromJSON(data) {
    return new Quest(data);
  }
}

/**
 * QuestManager - Manages all active and completed quests
 */
export class QuestManager {
  /**
   * Create quest manager
   */
  constructor() {
    this.quests = new Map(); // Map<questId, Quest>
    this.activeQuests = new Set(); // Set of active quest IDs
    this.completedQuests = new Set(); // Set of completed quest IDs
  }

  /**
   * Add quest to manager
   * @param {Quest} quest
   * @returns {Quest}
   */
  addQuest(quest) {
    this.quests.set(quest.id, quest);
    return quest;
  }

  /**
   * Get quest by ID
   * @param {string} questId
   * @returns {Quest|null}
   */
  getQuest(questId) {
    return this.quests.get(questId) || null;
  }

  /**
   * Get all available quests
   * @returns {Array<Quest>}
   */
  getAvailableQuests() {
    return Array.from(this.quests.values()).filter(q => q.status === 'available');
  }

  /**
   * Get all active quests
   * @returns {Array<Quest>}
   */
  getActiveQuests() {
    return Array.from(this.quests.values()).filter(q => q.status === 'active');
  }

  /**
   * Get all completed quests
   * @returns {Array<Quest>}
   */
  getCompletedQuests() {
    return Array.from(this.quests.values()).filter(q => q.status === 'completed');
  }

  /**
   * Start a quest
   * @param {string} questId
   * @returns {boolean}
   */
  startQuest(questId) {
    const quest = this.getQuest(questId);
    if (!quest) return false;

    // Check prerequisites
    const prerequisitesMet = quest.prerequisiteQuests.every(preReqId => {
      const preReq = this.getQuest(preReqId);
      return preReq && preReq.status === 'completed';
    });

    if (!prerequisitesMet) return false;

    if (quest.start()) {
      this.activeQuests.add(questId);
      return true;
    }

    return false;
  }

  /**
   * Update quest objective
   * @param {string} questId
   * @param {string} objectiveId
   * @param {number} amount
   * @returns {Object} { objectiveCompleted, questCompleted }
   */
  updateQuestObjective(questId, objectiveId, amount = 1) {
    const quest = this.getQuest(questId);
    if (!quest || quest.status !== 'active') {
      return { objectiveCompleted: false, questCompleted: false };
    }

    const objectiveCompleted = quest.updateObjective(objectiveId, amount);
    const questCompleted = quest.allObjectivesComplete();

    return { objectiveCompleted, questCompleted, quest };
  }

  /**
   * Complete a quest
   * @param {string} questId
   * @returns {Object|null} Rewards or null
   */
  completeQuest(questId) {
    const quest = this.getQuest(questId);
    if (!quest) return null;

    if (quest.complete()) {
      this.activeQuests.delete(questId);
      this.completedQuests.add(questId);

      // Unlock next quests
      quest.nextQuests.forEach(nextQuestId => {
        const nextQuest = this.getQuest(nextQuestId);
        if (nextQuest && nextQuest.status === 'locked') {
          nextQuest.status = 'available';
        }
      });

      return quest.rewards;
    }

    return null;
  }

  /**
   * Fail a quest
   * @param {string} questId
   */
  failQuest(questId) {
    const quest = this.getQuest(questId);
    if (quest) {
      quest.fail();
      this.activeQuests.delete(questId);
    }
  }

  /**
   * Get quests by type
   * @param {string} type
   * @returns {Array<Quest>}
   */
  getQuestsByType(type) {
    return Array.from(this.quests.values()).filter(q => q.type === type);
  }

  /**
   * Get quest statistics
   * @returns {Object}
   */
  getStatistics() {
    return {
      total: this.quests.size,
      active: this.activeQuests.size,
      completed: this.completedQuests.size,
      available: this.getAvailableQuests().length,
      failed: Array.from(this.quests.values()).filter(q => q.status === 'failed').length
    };
  }

  /**
   * Serialize to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      quests: Array.from(this.quests.entries()).map(([id, quest]) => ({
        id,
        quest: quest.toJSON()
      })),
      activeQuests: Array.from(this.activeQuests),
      completedQuests: Array.from(this.completedQuests)
    };
  }

  /**
   * Deserialize from JSON
   * @param {Object} data
   * @returns {QuestManager}
   */
  static fromJSON(data) {
    const manager = new QuestManager();

    if (data.quests) {
      data.quests.forEach(entry => {
        const quest = Quest.fromJSON(entry.quest);
        manager.quests.set(entry.id, quest);
      });
    }

    if (data.activeQuests) {
      manager.activeQuests = new Set(data.activeQuests);
    }

    if (data.completedQuests) {
      manager.completedQuests = new Set(data.completedQuests);
    }

    return manager;
  }
}

export default { Quest, QuestManager };
