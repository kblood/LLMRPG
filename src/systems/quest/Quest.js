/**
 * Quest - Individual quest object
 */
export class Quest {
  constructor(id, data) {
    this.id = id;
    this.title = data.title;
    this.description = data.description;
    this.giver = data.giver; // Character ID who gave the quest
    this.state = data.state || 'active'; // active, completed, failed
    this.objectives = data.objectives || [];
    this.rewards = data.rewards || {};
    this.metadata = data.metadata || {};
    this.conversationId = data.conversationId; // Where quest was given
    this.createdAt = data.createdAt || Date.now();
    this.completedAt = null;
    this.frameCreated = data.frame || 0;
  }

  addObjective(objective) {
    this.objectives.push({
      id: `obj_${this.objectives.length}`,
      description: objective.description,
      type: objective.type || 'general',
      target: objective.target,
      current: 0,
      required: objective.required || 1,
      completed: false,
      hidden: objective.hidden || false
    });
  }

  updateObjective(objectiveId, progress) {
    const obj = this.objectives.find(o => o.id === objectiveId);
    if (!obj) return false;
    
    obj.current = Math.min(progress, obj.required);
    obj.completed = obj.current >= obj.required;
    
    return obj.completed;
  }

  checkCompletion() {
    const allCompleted = this.objectives
      .filter(o => !o.hidden)
      .every(o => o.completed);
    
    if (allCompleted && this.state === 'active') {
      this.state = 'completed';
      this.completedAt = Date.now();
      return true;
    }
    
    return false;
  }

  fail() {
    this.state = 'failed';
    this.completedAt = Date.now();
  }

  getProgress() {
    const total = this.objectives.filter(o => !o.hidden).length;
    const completed = this.objectives.filter(o => o.completed && !o.hidden).length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  }

  isActive() {
    return this.state === 'active';
  }

  isCompleted() {
    return this.state === 'completed';
  }

  isFailed() {
    return this.state === 'failed';
  }

  getVisibleObjectives() {
    return this.objectives.filter(o => !o.hidden);
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      giver: this.giver,
      state: this.state,
      objectives: this.objectives,
      rewards: this.rewards,
      metadata: this.metadata,
      conversationId: this.conversationId,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      frameCreated: this.frameCreated
    };
  }

  static fromJSON(json) {
    const quest = new Quest(json.id, json);
    quest.completedAt = json.completedAt;
    return quest;
  }
}

export default Quest;
