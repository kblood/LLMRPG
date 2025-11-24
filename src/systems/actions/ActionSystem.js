import { OllamaService } from '../../services/OllamaService.js';
import { EventBus } from '../../services/EventBus.js';
import Logger from '../../utils/Logger.js';

/**
 * Action Types - All possible protagonist actions
 */
export const ActionType = {
  CONVERSATION: 'conversation',
  INVESTIGATE: 'investigate',
  SEARCH: 'search',
  REST: 'rest',
  TRADE: 'trade',
  TRAVEL: 'travel',
  COMBAT: 'combat'
};

/**
 * ActionSystem - Manages protagonist actions beyond dialogue
 *
 * Enables the protagonist to perform various activities:
 * - CONVERSATION: Talk to NPCs
 * - INVESTIGATE: Examine locations, objects, or clues
 * - SEARCH: Look for items, resources, or hidden things
 * - REST: Recover health/stamina/magic
 * - TRADE: Buy/sell items with merchants
 * - TRAVEL: Move between locations
 * - COMBAT: Engage in combat with hostile NPCs/creatures
 */
export class ActionSystem {
  constructor(gameMaster, session, options = {}) {
    this.gameMaster = gameMaster;
    this.session = session;
    this.ollama = OllamaService.getInstance();
    this.eventBus = EventBus.getInstance();
    this.logger = new Logger('ActionSystem');

    this.actionHistory = [];
    this.lastActionTime = 0;

    // Configuration
    this.config = {
      minTimeBetweenActions: options.minTimeBetweenActions || 1000,
      maxConsecutiveSameAction: options.maxConsecutiveSameAction || 3,
      ...options
    };

    this.logger.info('ActionSystem initialized');
  }

  /**
   * Protagonist decides what action to take next
   * Uses AI to make an intelligent choice based on:
   * - Current goals and quests
   * - Past conversation topics
   * - Available NPCs
   * - Time of day
   * - Fatigue level
   */
  async decideNextAction(protagonist, availableNPCs, pastConversations = []) {
    this.logger.info('Protagonist deciding next action');

    const context = this._buildDecisionContext(protagonist, availableNPCs, pastConversations);

    try {
      const response = await this.ollama.generate(context, {
        model: this.session.model || 'llama3.1:8b',
        temperature: 0.8,
        seed: this._getSeed()
      });

      const action = this._parseActionDecision(response);

      this.logger.info(`Protagonist chose action: ${action.type}`);

      return action;
    } catch (error) {
      this.logger.error('Failed to decide action:', error);
      return this._getFallbackAction(protagonist, availableNPCs, pastConversations);
    }
  }

  /**
   * Execute an action and return the result
   */
  async executeAction(action, protagonist, context = {}) {
    this.logger.info(`Executing action: ${action.type}`);

    // Record action
    this.actionHistory.push({
      type: action.type,
      timestamp: Date.now(),
      frame: this.session.frame,
      details: action
    });

    // Emit event
    this.eventBus.emit('action:started', {
      type: action.type,
      protagonist: protagonist.id,
      action
    });

    // Execute based on type
    let result;
    switch (action.type) {
      case ActionType.CONVERSATION:
        result = await this._executeConversation(action, protagonist, context);
        break;
      case ActionType.INVESTIGATE:
        result = await this._executeInvestigate(action, protagonist, context);
        break;
      case ActionType.SEARCH:
        result = await this._executeSearch(action, protagonist, context);
        break;
      case ActionType.REST:
        result = await this._executeRest(action, protagonist, context);
        break;
      case ActionType.TRADE:
        result = await this._executeTrade(action, protagonist, context);
        break;
      case ActionType.TRAVEL:
        result = await this._executeTravel(action, protagonist, context);
        break;
      case ActionType.COMBAT:
        result = await this._executeCombat(action, protagonist, context);
        break;
      default:
        this.logger.warn(`Unknown action type: ${action.type}`);
        result = { success: false, message: 'Unknown action type' };
    }

    // Emit completion event
    this.eventBus.emit('action:completed', {
      type: action.type,
      protagonist: protagonist.id,
      result
    });

    this.lastActionTime = Date.now();

    return result;
  }

  /**
   * Build decision context for AI
   */
  _buildDecisionContext(protagonist, availableNPCs, pastConversations) {
    const goals = protagonist.memory.getMemoriesByType('goal');
    const activeQuests = this.session.questManager ? this.session.questManager.getActiveQuests() : [];
    const world = this.session.world;
    const recentActions = this.actionHistory.slice(-5);

    // Count consecutive conversation actions
    let consecutiveConversations = 0;
    for (let i = this.actionHistory.length - 1; i >= 0; i--) {
      if (this.actionHistory[i].type === ActionType.CONVERSATION) {
        consecutiveConversations++;
      } else {
        break;
      }
    }

    // Build NPC context
    const npcContext = availableNPCs
      .filter(npc => !pastConversations.includes(npc.id))
      .map(npc => {
        const relationship = protagonist.relationships.getRelationshipLevel(npc.id);
        return `- ${npc.name} (${npc.occupation || npc.role}) - Relationship: ${relationship}/100`;
      })
      .join('\n') || '- No new NPCs available to talk to';

    const talkedToNPCs = availableNPCs
      .filter(npc => pastConversations.includes(npc.id))
      .map(npc => npc.name)
      .join(', ') || 'none';

    // Build quest context
    const questContext = activeQuests.length > 0 ? `
Your Active Quest: "${activeQuests[0].title}"
Description: ${activeQuests[0].description}
${activeQuests[0].objectives ? `Current Objectives: ${activeQuests[0].objectives.map(o => o.description).join(', ')}` : ''}
` : 'You have no active quests yet.';

    // Build world context with discovered locations
    let discoveredLocations = 'starting location';
    let availableDestinations = '';

    if (this.session.discoveredLocations && this.session.discoveredLocations.size > 0) {
      const discovered = this.session.getDiscoveredLocations();
      discoveredLocations = discovered.map(loc => loc.name).join(', ') || 'starting location';

      // Show available travel destinations
      const travelableLocations = discovered.filter(loc => loc.id !== this.session.currentLocation);
      if (travelableLocations.length > 0) {
        availableDestinations = `
Possible Destinations (Discovered Locations):
${travelableLocations.slice(0, 5).map(loc => `- ${loc.name} (${loc.type})`).join('\n')}
`;
      }
    }

    const worldContext = world ? `
Known Locations: ${discoveredLocations}
${availableDestinations}
` : '';

    // Time context
    const timeOfDay = this.session.getTimeOfDay();
    const gameTime = this.session.getGameTimeString();

    // Recent actions context
    const recentActionsText = recentActions.length > 0
      ? recentActions.map(a => `${a.type}`).join(', ')
      : 'none';

    // Build prompt
    const prompt = `You are ${protagonist.name}, ${protagonist.backstory}

Your personality:
${protagonist.personality.toDetailedDescription()}

Current Situation:
- Time: ${gameTime} (${timeOfDay})
- Location: ${this.session.currentLocation ? (this.session.getLocation(this.session.currentLocation)?.name || 'Millhaven') : 'Millhaven'}
- Recent actions: ${recentActionsText}

${questContext}
${worldContext}

NPCs in the current location:
${npcContext}

NPCs you've already talked to recently: ${talkedToNPCs}

Your Goals:
${goals.map(g => `- ${g.content}`).join('\n') || '- Explore and meet people'}

You have completed ${consecutiveConversations} conversation(s) in a row.

What do you want to do next? Choose ONE action:

1. CONVERSATION - Talk to an NPC (if available)
   ${availableNPCs.filter(npc => !pastConversations.includes(npc.id)).length === 0 ? '   (No new NPCs available - you\'ve talked to everyone)' : ''}

2. INVESTIGATE - Examine your surroundings, look for clues about the quest, or explore the area
   (Look around, examine interesting locations, search for quest clues)

3. SEARCH - Actively search for items, resources, or hidden things
   (Search the area for useful items or hidden objects)

4. REST - Find a quiet place to rest and recover
   (Recover health, stamina, and organize your thoughts)

5. TRAVEL - Travel to a nearby location
   (Visit other locations to explore, gather information, or investigate)${availableDestinations}

Guidelines:
- CONVERSATION: Good if you haven't talked to all available NPCs yet
- INVESTIGATE/SEARCH: Explore for clues and items related to your quest
- TRAVEL: Explore other locations to advance your quest
- REST: If health or stamina is low, or if it's late at night
- Vary your actions! Don't just keep talking - also explore, travel, and search

${consecutiveConversations >= 3 ? 'IMPORTANT: You have talked to many NPCs in a row. Time for something else! Choose TRAVEL, INVESTIGATE, or SEARCH instead.' : ''}
${consecutiveConversations >= 5 ? 'CRITICAL: You have had many consecutive conversations. You MUST do something different now. Choose TRAVEL, INVESTIGATE, SEARCH, or REST!' : ''}

Respond with ONLY the action type and a brief reason (1 sentence):
Format: ACTION_TYPE: reason

Example responses:
CONVERSATION: I want to speak with the blacksmith to learn about local rumors
INVESTIGATE: I should explore this area to look for quest-related clues
SEARCH: I want to search for useful items or hidden objects
REST: It's late and I should rest to recover my energy
TRAVEL: I need to journey to the distant ruins to investigate the legends

Your decision:`;

    return prompt;
  }

  /**
   * Parse AI decision response and extract destination for travel actions
   */
  _parseActionDecision(response) {
    let text = response.trim();

    // Extract action type
    const actionMatch = text.match(/^(CONVERSATION|INVESTIGATE|SEARCH|REST|TRADE|TRAVEL):/i);

    if (actionMatch) {
      const actionType = actionMatch[1].toLowerCase();
      const reason = text.substring(actionMatch[0].length).trim();

      // For TRAVEL actions, try to extract destination from the reason
      const action = {
        type: actionType,
        reason: reason || 'No specific reason given',
        timestamp: Date.now()
      };

      // Extract destination if this is a travel action
      if (actionType === ActionType.TRAVEL) {
        action.destination = this._extractTravelDestination(reason);
      }

      return action;
    }

    // Fallback: try to detect action type in text
    const lowerText = text.toLowerCase();
    if (lowerText.includes('conversation') || lowerText.includes('talk') || lowerText.includes('speak')) {
      return { type: ActionType.CONVERSATION, reason: text, timestamp: Date.now() };
    }
    if (lowerText.includes('investigate') || lowerText.includes('explore') || lowerText.includes('examine')) {
      return { type: ActionType.INVESTIGATE, reason: text, timestamp: Date.now() };
    }
    if (lowerText.includes('search') || lowerText.includes('look for')) {
      return { type: ActionType.SEARCH, reason: text, timestamp: Date.now() };
    }
    if (lowerText.includes('rest') || lowerText.includes('sleep') || lowerText.includes('recover')) {
      return { type: ActionType.REST, reason: text, timestamp: Date.now() };
    }
    if (lowerText.includes('trade') || lowerText.includes('buy') || lowerText.includes('sell')) {
      return { type: ActionType.TRADE, reason: text, timestamp: Date.now() };
    }
    if (lowerText.includes('travel') || lowerText.includes('journey') || lowerText.includes('go to')) {
      const action = { type: ActionType.TRAVEL, reason: text, timestamp: Date.now() };
      action.destination = this._extractTravelDestination(text);
      return action;
    }

    // Default to investigate
    return {
      type: ActionType.INVESTIGATE,
      reason: 'Exploring the surroundings',
      timestamp: Date.now()
    };
  }

  /**
   * Extract travel destination from travel action reason text
   * @private
   */
  _extractTravelDestination(text) {
    if (!text) return null;

    // Try to match location names from discovered locations
    const discovered = this.session.getDiscoveredLocations();
    for (const location of discovered) {
      if (text.toLowerCase().includes(location.name.toLowerCase())) {
        return location.id;
      }
    }

    // Try to extract location name from common patterns
    const patterns = [
      /to\s+(?:the\s+)?([A-Za-z\s]+?)(?:\s+to|\s+and|\s+so|$)/i,
      /journey\s+to\s+(?:the\s+)?([A-Za-z\s]+?)(?:\s+to|\s+and|\s+so|$)/i,
      /head\s+(?:to|out)\s+(?:the\s+)?([A-Za-z\s]+?)(?:\s+to|\s+and|\s+so|$)/i,
      /investigate\s+(?:the\s+)?([A-Za-z\s]+?)(?:\s+to|\s+and|\s+so|$)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const locationName = match[1].trim();
        const resolvedId = this.session.resolveLocationByName(locationName);
        if (resolvedId) {
          return resolvedId;
        }
      }
    }

    return null;
  }

  /**
   * Get fallback action if AI decision fails
   */
  _getFallbackAction(protagonist, availableNPCs, pastConversations) {
    const recentActions = this.actionHistory.slice(-3);
    const recentTypes = recentActions.map(a => a.type);

    // If we haven't talked to everyone, prioritize conversation
    const untalkedNPCs = availableNPCs.filter(npc => !pastConversations.includes(npc.id));
    if (untalkedNPCs.length > 0 && !recentTypes.slice(-2).every(t => t === ActionType.CONVERSATION)) {
      return {
        type: ActionType.CONVERSATION,
        reason: 'Continuing to meet villagers',
        timestamp: Date.now()
      };
    }

    // Otherwise, vary between investigate and search
    const lastAction = recentActions[recentActions.length - 1];
    if (lastAction?.type === ActionType.INVESTIGATE) {
      return {
        type: ActionType.SEARCH,
        reason: 'Searching for useful items',
        timestamp: Date.now()
      };
    }

    return {
      type: ActionType.INVESTIGATE,
      reason: 'Exploring the village',
      timestamp: Date.now()
    };
  }

  /**
   * Execute conversation action (handled by GameBackend)
   */
  async _executeConversation(action, protagonist, context) {
    // This is handled by the autonomous loop in GameBackend
    // Just return success - the actual conversation logic is in GameBackend
    return {
      success: true,
      type: ActionType.CONVERSATION,
      message: 'Starting conversation',
      timeAdvanced: 0 // Time advancement handled by conversation
    };
  }

  /**
   * Execute investigate action
   */
  async _executeInvestigate(action, protagonist, context) {
    this.logger.info('Executing INVESTIGATE action');

    // Generate narration for investigation
    const narration = await this.gameMaster.generateInvestigationNarration(
      protagonist,
      context.location || 'Millhaven',
      {
        timeOfDay: this.session.getTimeOfDay(),
        weather: this.session.weather,
        activeQuest: context.activeQuest,
        reason: action.reason
      }
    );

    // Advance time (10-20 minutes for investigation)
    const timeAdvanced = 10 + Math.floor(Math.random() * 11);

    return {
      success: true,
      type: ActionType.INVESTIGATE,
      narration: narration,
      timeAdvanced: timeAdvanced,
      discoveries: [] // Could add clues/discoveries here
    };
  }

  /**
   * Execute search action
   */
  async _executeSearch(action, protagonist, context) {
    this.logger.info('Executing SEARCH action');

    // Generate narration for search
    const narration = await this.gameMaster.generateSearchNarration(
      protagonist,
      context.location || 'Millhaven',
      {
        timeOfDay: this.session.getTimeOfDay(),
        weather: this.session.weather,
        reason: action.reason
      }
    );

    // Advance time (15-30 minutes for thorough search)
    const timeAdvanced = 15 + Math.floor(Math.random() * 16);

    // Small chance to find something
    const foundItem = Math.random() < 0.3;

    return {
      success: true,
      type: ActionType.SEARCH,
      narration: narration,
      timeAdvanced: timeAdvanced,
      foundItems: foundItem ? ['small coin pouch'] : []
    };
  }

  /**
   * Execute rest action
   */
  async _executeRest(action, protagonist, context) {
    this.logger.info('Executing REST action');

    // Generate narration for rest
    const narration = await this.gameMaster.generateRestNarration(
      protagonist,
      context.location || 'Millhaven',
      {
        timeOfDay: this.session.getTimeOfDay(),
        weather: this.session.weather,
        reason: action.reason
      }
    );

    // Advance time significantly (30-60 minutes for rest)
    const timeAdvanced = 30 + Math.floor(Math.random() * 31);

    // Restore some stats
    if (protagonist.stats) {
      const healAmount = Math.floor(protagonist.stats.maxHP * 0.2);
      protagonist.stats.heal(healAmount);
    }

    return {
      success: true,
      type: ActionType.REST,
      narration: narration,
      timeAdvanced: timeAdvanced,
      restored: {
        hp: protagonist.stats ? Math.floor(protagonist.stats.maxHP * 0.2) : 0
      }
    };
  }

  /**
   * Execute trade action
   */
  async _executeTrade(action, protagonist, context) {
    this.logger.info('Executing TRADE action');

    // Generate narration for trade
    const narration = await this.gameMaster.generateTradeNarration(
      protagonist,
      context.location || 'Millhaven',
      {
        timeOfDay: this.session.getTimeOfDay(),
        merchant: context.merchant,
        reason: action.reason
      }
    );

    // Advance time (5-15 minutes for trade)
    const timeAdvanced = 5 + Math.floor(Math.random() * 11);

    return {
      success: true,
      type: ActionType.TRADE,
      narration: narration,
      timeAdvanced: timeAdvanced,
      traded: []
    };
  }

  /**
   * Execute travel action
   */
  async _executeTravel(action, protagonist, context) {
    this.logger.info('Executing TRAVEL action');

    // Generate narration for travel
    const narration = await this.gameMaster.generateTravelNarration(
      protagonist,
      context.destination || 'unknown location',
      {
        timeOfDay: this.session.getTimeOfDay(),
        weather: this.session.weather,
        reason: action.reason
      }
    );

    // Advance time significantly (varies by destination)
    const timeAdvanced = 45 + Math.floor(Math.random() * 46); // 45-90 minutes

    return {
      success: true,
      type: ActionType.TRAVEL,
      narration: narration,
      timeAdvanced: timeAdvanced,
      destination: context.destination || 'unknown location'
    };
  }

  /**
   * Execute combat action (handled by CombatSystem)
   */
  async _executeCombat(action, protagonist, context) {
    this.logger.info('Executing COMBAT action');

    // This is handled by the CombatSystem in GameBackend
    // Just return success - the actual combat logic is in GameBackend
    return {
      success: true,
      type: ActionType.COMBAT,
      message: 'Entering combat',
      timeAdvanced: 0 // Time advancement handled by combat system
    };
  }

  /**
   * Get action history
   */
  getActionHistory(limit = 10) {
    return this.actionHistory.slice(-limit);
  }

  /**
   * Get action statistics
   */
  getStats() {
    const actionCounts = {};
    this.actionHistory.forEach(action => {
      actionCounts[action.type] = (actionCounts[action.type] || 0) + 1;
    });

    return {
      totalActions: this.actionHistory.length,
      actionCounts,
      lastAction: this.actionHistory[this.actionHistory.length - 1]
    };
  }

  /**
   * Generate seed for deterministic randomness
   */
  _getSeed() {
    return Math.abs((this.session.seed % 1000000) + this.actionHistory.length);
  }

  /**
   * Reset action history
   */
  reset() {
    this.actionHistory = [];
    this.lastActionTime = 0;
    this.logger.info('ActionSystem reset');
  }
}
