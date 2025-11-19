import { Quest } from './Quest.js';
import { EventBus } from '../../services/EventBus.js';

/**
 * Quest Manager - Manages all quests
 */
export class QuestManager {
  constructor() {
    this.quests = new Map();
    this.questIdCounter = 0;
    this.eventBus = EventBus.getInstance();
  }

  createQuest(data) {
    const questId = `quest_${this.questIdCounter++}`;
    const quest = new Quest(questId, data);
    this.quests.set(questId, quest);
    
    this.eventBus.emit('quest:created', { quest });
    
    return questId;
  }

  getQuest(questId) {
    return this.quests.get(questId);
  }

  getActiveQuests() {
    return Array.from(this.quests.values()).filter(q => q.isActive());
  }

  getCompletedQuests() {
    return Array.from(this.quests.values()).filter(q => q.isCompleted());
  }

  getQuestsByGiver(giverId) {
    return Array.from(this.quests.values()).filter(q => q.giver === giverId);
  }

  updateObjective(questId, objectiveId, progress) {
    const quest = this.getQuest(questId);
    if (!quest) return false;

    const completed = quest.updateObjective(objectiveId, progress);
    
    if (completed) {
      this.eventBus.emit('quest:objective_completed', { 
        questId, 
        objectiveId 
      });
    }

    if (quest.checkCompletion()) {
      this.eventBus.emit('quest:completed', { quest });
      return { questCompleted: true, objectiveCompleted: completed };
    }

    return { questCompleted: false, objectiveCompleted: completed };
  }

  completeQuest(questId) {
    const quest = this.getQuest(questId);
    if (!quest || !quest.isActive()) return false;

    quest.state = 'completed';
    quest.completedAt = Date.now();
    
    this.eventBus.emit('quest:completed', { quest });
    return true;
  }

  failQuest(questId) {
    const quest = this.getQuest(questId);
    if (!quest || !quest.isActive()) return false;

    quest.fail();
    this.eventBus.emit('quest:failed', { quest });
    return true;
  }

  hasActiveQuest(questId) {
    const quest = this.getQuest(questId);
    return quest && quest.isActive();
  }

  getQuestsForDisplay() {
    return {
      active: this.getActiveQuests().map(q => ({
        id: q.id,
        title: q.title,
        description: q.description,
        giver: q.giver,
        progress: q.getProgress(),
        objectives: q.getVisibleObjectives()
      })),
      completed: this.getCompletedQuests().map(q => ({
        id: q.id,
        title: q.title,
        giver: q.giver
      }))
    };
  }

  getStats() {
    return {
      total: this.quests.size,
      active: this.getActiveQuests().length,
      completed: this.getCompletedQuests().length,
      failed: Array.from(this.quests.values()).filter(q => q.isFailed()).length
    };
  }

  toJSON() {
    return {
      quests: Array.from(this.quests.values()).map(q => q.toJSON()),
      questIdCounter: this.questIdCounter
    };
  }

  static fromJSON(json) {
    const manager = new QuestManager();
    manager.questIdCounter = json.questIdCounter;
    
    json.quests.forEach(questData => {
      const quest = Quest.fromJSON(questData);
      manager.quests.set(quest.id, quest);
    });
    
    return manager;
  }
}

export default QuestManager;
