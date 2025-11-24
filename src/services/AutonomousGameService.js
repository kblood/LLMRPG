/**
 * AutonomousGameService - Shared autonomous gameplay logic
 * 
 * This service contains the core autonomous game loop that both the UI
 * and tests use. It handles:
 * - AI-driven action decisions
 * - Conversation management
 * - Combat encounters
 * - Action execution (travel, investigate, search)
 * - Time progression
 * - Event logging
 * 
 * Used by:
 * - electron/ipc/GameBackend.js (UI autonomous mode)
 * - test-autonomous-themed-game.js (Test autonomous mode)
 */

export class AutonomousGameService {
  constructor(config) {
    // Core systems
    this.session = config.session;
    this.player = config.player;
    this.npcs = config.npcs || new Map();
    this.gameMaster = config.gameMaster;
    this.actionSystem = config.actionSystem;
    this.combatSystem = config.combatSystem;
    this.combatEncounterSystem = config.combatEncounterSystem;
    this.replayLogger = config.replayLogger;
    this.ollama = config.ollama;
    this.eventBus = config.eventBus;
    this.locationGrid = config.locationGrid;
    
    // Configuration
    this.autonomousConfig = config.autonomousConfig || {
      maxTurnsPerConversation: 10,
      pauseBetweenTurns: 2000,
      pauseBetweenConversations: 3000,
      pauseBetweenActions: 2000
    };
    
    // State tracking
    this.pastConversations = [];
    this.currentConversation = null;
    this.conversationHistory = [];
    this.isRunning = false;
    this.isPaused = false;
    this.mainQuest = config.mainQuest || null;
    
    // Event callback for UI/test updates
    this.onEvent = config.onEvent || (() => {});
  }

  /**
   * Main autonomous game loop
   * Runs until stopped or maxIterations reached
   */
  async runGameLoop(options = {}) {
    const maxIterations = options.maxIterations || Infinity;
    this.isRunning = true;
    
    console.log('[AutonomousGameService] Starting game loop...');
    
    let iteration = 0;
    while (this.isRunning && iteration < maxIterations) {
      // Check if paused
      if (this.isPaused) {
        await this._sleep(500); // Check pause status every 500ms
        continue;
      }

      try {
        iteration++;
        
        // Advance time (traveling/thinking between actions)
        const timeDelta = 5 + Math.floor(Math.random() * 10); // 5-15 minutes
        const timeUpdate = this.session.tick(timeDelta);
        this.onEvent('time_update', timeUpdate);
        
        // Advance time (traveling/thinking between actions)
        const timeDelta = 5 + Math.floor(Math.random() * 10); // 5-15 minutes
        const timeUpdate = this.session.tick(timeDelta);
        this.onEvent('time_update', timeUpdate);

        // Log time changes to replay with game state
        if (this.replayLogger) {
          const gameState = this._captureGameState();
          this.replayLogger.logEvent(this.session.frame, 'time_changed', {
            time: timeUpdate.time,
            timeOfDay: timeUpdate.timeOfDay,
            weather: timeUpdate.weather,
            season: timeUpdate.season,
            day: timeUpdate.day,
            year: timeUpdate.year,
            minutesAdvanced: timeDelta
          }, 'system', gameState);
        }

        // Get available NPCs
        const availableNPCs = Array.from(this.npcs.values()).filter(npc =>
          !this.pastConversations.includes(npc.id)
        );

        // Protagonist decides what action to take
        const action = await this.actionSystem.decideNextAction(
          this.player,
          Array.from(this.npcs.values()),
          this.pastConversations
        );

        console.log(`[AutonomousGameService] Iteration ${iteration}: ${action.type} - ${action.reason}`);

        // Get active quest for context
        const activeQuests = this.session.questManager ? this.session.questManager.getActiveQuests() : [];
        const activeQuest = activeQuests.length > 0 ? activeQuests[0] : null;

        // Check if the main quest is complete
        if (this.mainQuest && this.mainQuest.isCompleted && this.mainQuest.isCompleted()) {
          console.log('[AutonomousGameService] Main quest is complete!');
          await this._handleVictory();
          break;
        }

        // Notify of action decision
        this.onEvent('action_decision', {
          type: action.type,
          reason: action.reason,
          iteration: iteration
        });

        await this._sleep(this.autonomousConfig.pauseBetweenActions);

        if (!this.isRunning) break;

        // Execute the action
        if (action.type === 'conversation') {
          await this._handleConversationAction(availableNPCs);
        } else if (['investigate', 'travel', 'search'].includes(action.type)) {
          await this._handleActionWithCombat(action, activeQuest);
        } else {
          await this._handleGenericAction(action, activeQuest);
        }

        // Wait between actions
        await this._sleep(this.autonomousConfig.pauseBetweenActions);

      } catch (error) {
        console.error('[AutonomousGameService] Loop error:', error);
        this.onEvent('error', { message: error.message, iteration: iteration });
        await this._sleep(3000);
      }
    }

    console.log('[AutonomousGameService] Game loop ended');
    this.isRunning = false;
    this.onEvent('loop_ended', { iterations: iteration });
  }

  /**
   * Stop the autonomous game loop
   */
  stop() {
    console.log('[AutonomousGameService] Stopping game loop...');
    this.isRunning = false;
    
    if (this.currentConversation) {
      this._endConversation(this.currentConversation.id);
    }
  }

  /**
   * Pause the autonomous game loop
   */
  pause() {
    console.log('[AutonomousGameService] Pausing game loop...');
    this.isPaused = true;
    this.onEvent('paused', {});
  }

  /**
   * Resume the autonomous game loop
   */
  resume() {
    console.log('[AutonomousGameService] Resuming game loop...');
    this.isPaused = false;
    this.onEvent('resumed', {});
  }

  /**
   * Handle conversation action
   */
  async _handleConversationAction(availableNPCs) {
    if (availableNPCs.length === 0) {
      console.log('[AutonomousGameService] All NPCs have been talked to, resetting');
      this.pastConversations = [];
      return;
    }

    const chosenNPC = availableNPCs[0]; // Choose first available
    console.log(`[AutonomousGameService] Protagonist chose to talk to ${chosenNPC.name}`);

    // Get player's current location for context
    const playerLocation = this.locationGrid ? this.locationGrid.getPosition(this.player.id) : null;
    const playerLocationName = this.session.world?.startingTown?.name || 'Village';

    // Notify of NPC choice
    this.onEvent('npc_chosen', {
      type: 'npc_chosen',
      npcId: chosenNPC.id,
      npcName: chosenNPC.name,
      playerLocation: playerLocationName,
      playerGridPosition: playerLocation ? { x: playerLocation.gridX, y: playerLocation.gridY } : null
    });

    this.pastConversations.push(chosenNPC.id);

    // Wait before starting conversation
    await this._sleep(this.autonomousConfig.pauseBetweenConversations);

    if (!this.isRunning) return;

    // Start conversation
    await this._runAutonomousConversation(chosenNPC);

    // Advance time after conversation
    const postConvoTimeDelta = 10 + Math.floor(Math.random() * 15);
    const postConvoTime = this.session.tick(postConvoTimeDelta);
    this.onEvent('time_update', postConvoTime);
  }

  /**
   * Handle actions that can trigger combat (travel, investigate, search)
   */
  async _handleActionWithCombat(action, activeQuest) {
    // Check for combat encounter
    const location = {
      name: action.location || 'Village',
      dangerLevel: this._getLocationDangerLevel(action.location || 'Village')
    };

    const timeOfDay = this.session.getTimeOfDay();
    const encounter = this.combatEncounterSystem.generateCombatEncounter(
      this.player,
      location,
      timeOfDay
    );

    if (encounter) {
      console.log('[AutonomousGameService] Combat encounter triggered!');

      // Notify of combat encounter
      this.onEvent('combat_encounter', {
        description: encounter.description,
        enemies: encounter.enemies.map(e => ({
          name: e.name,
          level: e.stats.level,
          hp: e.stats.currentHP,
          maxHP: e.stats.maxHP
        }))
      });

      // Wait before starting combat
      await this._sleep(2000);

      if (!this.isRunning) return;

      // Execute combat
      const combatResult = await this.combatSystem.executeCombat(
        this.player,
        encounter.enemies,
        encounter
      );

      console.log(`[AutonomousGameService] Combat ended: ${combatResult.outcome}`);

      // Notify of combat result
      this.onEvent('combat_result', {
        outcome: combatResult.outcome,
        rounds: combatResult.rounds,
        narration: combatResult.narration,
        rewards: combatResult.rewards
      });

      // Log combat to replay with game state
      if (this.replayLogger) {
        const gameState = this._captureGameState();
        this.replayLogger.logEvent(this.session.frame++, 'combat_encounter', {
          location: location.name,
          enemies: encounter.enemies.map(e => ({ name: e.name, level: e.stats?.level || 1 })),
          outcome: combatResult.outcome,
          rounds: combatResult.rounds,
          rewards: combatResult.rewards
        }, this.player.id, gameState);

        // Log rewards separately for easier replay analysis
        if (combatResult.outcome === 'victory' && combatResult.rewards) {
          if (combatResult.rewards.gold > 0) {
            this._logGoldChange(this.player, combatResult.rewards.gold, 'Combat victory', 'gain');
          }

          if (combatResult.rewards.loot && combatResult.rewards.loot.length > 0) {
            this.replayLogger.logEvent(this.session.frame, 'loot_obtained', {
              items: combatResult.rewards.loot,
              source: 'combat'
            }, this.player.id);
          }
        }
      }

      // Wait after combat
      await this._sleep(this.autonomousConfig.pauseBetweenActions);

      if (!this.isRunning) return;
    }

    // Execute the action itself (after potential combat)
    await this._executeAction(action, activeQuest);
  }

  /**
   * Handle generic actions without combat
   */
  async _handleGenericAction(action, activeQuest) {
    await this._executeAction(action, activeQuest);
  }

  /**
   * Execute an action through the action system
   */
  async _executeAction(action, activeQuest) {
    // Get player's current location
    const playerLocId = this.session.currentLocation || this.session.world?.startingTown?.id;
    const playerLocName = this.session.getLocation(playerLocId)?.name || 
                          this.session.world?.startingTown?.name || 'Village';

    // Execute action through ActionSystem
    const result = await this.actionSystem.executeAction(action, this.player, {
      location: playerLocName,
      destination: action.destination,
      activeQuest: activeQuest
    });

    console.log(`[AutonomousGameService] Action executed: ${action.type}, success: ${result.success}`);

    // If this was a travel action with a valid destination, move the player
    if (action.type === 'travel' && action.destination && this.locationGrid) {
      const destinationLoc = this.session.getLocation(action.destination);
      if (destinationLoc) {
        console.log(`[AutonomousGameService] Moving player from ${playerLocName} to ${destinationLoc.name}`);
        this.locationGrid.teleportCharacter(this.player.id, action.destination, 10, 10);
        this.session.visitLocation(action.destination, destinationLoc.name);
      }
    }

    // Get player's updated location
    const playerLocation = this.locationGrid ? this.locationGrid.getPosition(this.player.id) : null;
    const updatedLocName = this.session.getLocation(this.session.currentLocation)?.name || playerLocName;

    // Send action result
    this.onEvent('action_result', {
      type: action.type,
      result: result,
      narration: result.narration,
      playerLocation: updatedLocName,
      playerGridPosition: playerLocation ? { x: playerLocation.gridX, y: playerLocation.gridY } : null,
      originLocation: playerLocName,
      destinationLocation: action.destination ? (this.session.getLocation(action.destination)?.name) : null
    });

    // Advance time based on action
    if (result.timeAdvanced) {
      const actionTime = this.session.tick(result.timeAdvanced);
      this.onEvent('time_update', actionTime);
    }

    // Log action to replay with game state
    if (this.replayLogger) {
      const gameState = this._captureGameState();
      this.replayLogger.logEvent(this.session.frame++, 'action_performed', {
        actionType: action.type,
        reason: action.reason,
        timeAdvanced: result.timeAdvanced,
        success: result.success
      }, this.player.id, gameState);
    }
  }

  /**
   * Run an autonomous conversation with an NPC
   */
  async _runAutonomousConversation(npc) {
    try {
      // Generate GM narration
      const narration = await this.gameMaster.generateDialogueNarration(
        npc,
        this.player,
        {
          location: 'Village',
          timeOfDay: this.session.getTimeOfDay()
        }
      );

      // Start conversation
      const conversationId = await this.session.startConversation(npc.id);

      this.currentConversation = {
        id: conversationId,
        npcId: npc.id,
        npc: npc,
        turns: [],
        narration: narration
      };

      this.conversationHistory = [];

      // Log conversation start event with game state
      if (this.replayLogger) {
        const gameState = this._captureGameState();
        this.replayLogger.logEvent(this.session.frame++, 'conversation_started', {
          protagonistId: this.player.id,
          npcId: npc.id,
          location: 'Village'
        }, this.player.id, gameState);
      }

      // Notify conversation started
      this.onEvent('conversation_start', {
        conversationId: conversationId,
        npc: {
          id: npc.id,
          name: npc.name,
          role: npc.role
        },
        narration: narration
      });

      // Get initial NPC greeting from conversation history
      const conversation = this.session.dialogueSystem.activeConversations.get(conversationId);
      if (conversation && conversation.history.length > 0) {
        const greeting = conversation.history[0];

        // Log NPC greeting
        if (this.replayLogger) {
          this.replayLogger.logEvent(this.session.frame++, 'dialogue_line', {
            speakerId: npc.id,
            text: greeting.output
          }, npc.id);
        }

        // Send greeting to UI/test
        this.onEvent('dialogue_line', {
          speakerId: npc.id,
          speakerName: npc.name,
          text: greeting.output,
          turn: 0
        });

        this.conversationHistory.push({
          speakerId: npc.id,
          input: greeting.input,
          output: greeting.output,
          turn: 0
        });
      }

      await this._sleep(this.autonomousConfig.pauseBetweenTurns);

      // Run conversation turns
      for (let turn = 0; turn < this.autonomousConfig.maxTurnsPerConversation; turn++) {
        if (!this.isRunning) break;

        // Protagonist decides response
        const protagonistResponse = await this._protagonistDecideResponse(
          this.player,
          npc,
          this.conversationHistory
        );

        // Process protagonist's response
        const responseResult = await this.session.dialogueSystem.addTurn(
          conversationId,
          this.player.id,
          protagonistResponse
        );

        // Log protagonist response
        if (this.replayLogger) {
          this.replayLogger.logEvent(this.session.frame++, 'dialogue_line', {
            speakerId: this.player.id,
            text: protagonistResponse
          }, this.player.id);
        }

        // Send protagonist dialogue
        this.onEvent('dialogue_line', {
          speakerId: this.player.id,
          speakerName: this.player.name,
          text: protagonistResponse,
          turn: turn + 1
        });

        this.conversationHistory.push({
          speakerId: this.player.id,
          input: protagonistResponse,
          output: responseResult.text,
          turn: turn + 1
        });

        await this._sleep(this.autonomousConfig.pauseBetweenTurns);

        if (!this.isRunning) break;

        // Log NPC response
        if (this.replayLogger) {
          this.replayLogger.logEvent(this.session.frame++, 'dialogue_line', {
            speakerId: npc.id,
            text: responseResult.text
          }, npc.id);
        }

        // Send NPC dialogue
        this.onEvent('dialogue_line', {
          speakerId: npc.id,
          speakerName: npc.name,
          text: responseResult.text,
          turn: turn + 1
        });

        await this._sleep(this.autonomousConfig.pauseBetweenTurns);
      }

      // End conversation
      await this.session.endConversation(conversationId);

      // Get relationship change
      const relationship = this.player.relationships.getRelationship(npc.id);

      // Log conversation end with game state
      if (this.replayLogger) {
        const gameState = this._captureGameState();
        this.replayLogger.logEvent(this.session.frame++, 'conversation_ended', {
          conversationId: conversationId,
          npcId: npc.id,
          turns: this.conversationHistory.length,
          relationshipValue: relationship.value
        }, this.player.id, gameState);
      }

      // Notify conversation ended
      this.onEvent('conversation_end', {
        conversationId: conversationId,
        npcId: npc.id,
        npcName: npc.name,
        turns: this.conversationHistory.length,
        relationship: {
          value: relationship.value,
          level: relationship.level
        }
      });

      this.currentConversation = null;
      this.conversationHistory = [];

    } catch (error) {
      console.error('[AutonomousGameService] Conversation error:', error);
      this.onEvent('error', { message: error.message, context: 'conversation' });
    }
  }

  /**
   * Protagonist AI decides what to say
   */
  async _protagonistDecideResponse(protagonist, npc, conversationHistory) {
    const recentHistory = conversationHistory.slice(-6);
    const historyText = recentHistory.map(turn => {
      return `${turn.speakerId === protagonist.id ? 'You' : npc.name}: ${turn.output || turn.input}`;
    }).join('\n');

    const goals = protagonist.memory.getMemoriesByType('goal');

    // Get active quests
    const activeQuests = this.session.questManager ? this.session.questManager.getActiveQuests() : [];
    const questContext = activeQuests.length > 0 ? `

Your Active Quest:
- "${activeQuests[0].title}": ${activeQuests[0].description}
${activeQuests[0].objectives ? `Objectives: ${activeQuests[0].objectives.map(o => o.description).join(', ')}` : ''}

You can ask NPCs about locations, rumors, or things related to your quest.` : '';

    // Get world knowledge
    const world = this.session.world;
    const worldContext = world ? `

Known Locations:
Cities: ${world.cities?.map(c => c.name).join(', ') || 'none'}
Dungeons: ${world.dungeons?.slice(0, 3).map(d => d.name).join(', ') || 'none'}

You can ask about these places or mention them in conversation.` : '';

    const context = `You are ${protagonist.name}, ${protagonist.backstory}

Your personality:
${protagonist.personality.toDetailedDescription()}

Your current goals:
${goals.map(g => `- ${g.content}`).join('\n') || '- Learn more about this person'}${questContext}${worldContext}

You are having a conversation with ${npc.name}, who is ${npc.occupation || npc.role || 'a villager'}.
${npc.backstory ? `About them: ${npc.backstory}` : ''}

Recent conversation:
${historyText || '(conversation just started)'}

Based on your personality and goals, decide what to say next to ${npc.name}.
${conversationHistory.length < 3 ? 'Keep it friendly and introduce yourself naturally. You can mention your quest or ask about locations.' : 'Continue the conversation meaningfully. Ask about locations, quests, or services they might offer.'}
${conversationHistory.length > 7 ? 'Consider wrapping up the conversation politely if appropriate.' : ''}

Respond naturally in first person. Keep it concise (1-2 sentences).`;

    try {
      const seed = Math.abs((this.session.seed % 1000000) + conversationHistory.length);

      const response = await this.ollama.generate(context, {
        model: this.session.model || 'llama3.1:8b',
        temperature: this.session.temperature || 0.8,
        seed: seed
      });

      let text = response || '';
      text = text.trim();
      text = text.replace(/^(You say:|I say:|Response:|Protagonist:)\s*/i, '');
      text = text.replace(/^["']|["']$/g, '');
      text = text.split('\n')[0];

      console.log(`[AutonomousGameService] Protagonist response: "${text}"`);
      return text || 'Hello!';
    } catch (error) {
      console.error('[AutonomousGameService] Protagonist AI error:', error);
      if (conversationHistory.length === 0) {
        return "Greetings! I'm new here.";
      } else if (conversationHistory.length > 7) {
        return "It was nice talking with you. I should be going.";
      } else {
        return "Tell me more about that.";
      }
    }
  }

  /**
   * Handle victory condition
   */
  async _handleVictory() {
    console.log('[AutonomousGameService] Generating victory narration...');

    // Generate victory narration from the chronicler
    const victoryNarration = await this.gameMaster.generateVictoryNarration(
      this.player,
      this.mainQuest,
      this.session.world,
      {
        locationsVisited: Array.from(this.session.visitedLocations || []).length,
        npcsEncountered: this.pastConversations.length,
        daysElapsed: Math.floor((this.session.currentTime - this.session.startTime) / (60 * 24))
      }
    );

    // Send victory event
    this.onEvent('victory', {
      title: 'Victory!',
      narration: victoryNarration,
      questTitle: this.mainQuest.title,
      stats: {
        daysElapsed: Math.floor((this.session.currentTime - this.session.startTime) / (60 * 24)),
        locationsVisited: Array.from(this.session.visitedLocations || []).length,
        npcsEncountered: this.pastConversations.length
      }
    });

    // Log the victory event to replay
    if (this.replayLogger) {
      const gameState = this._captureGameState();
      this.replayLogger.logEvent(this.session.frame, 'game_end', {
        result: 'victory',
        questTitle: this.mainQuest.title,
        narration: victoryNarration
      }, 'system', gameState);
    }

    // Stop the autonomous loop
    this.isRunning = false;
    console.log('[AutonomousGameService] Game complete!');
  }

  /**
   * Get location danger level
   */
  _getLocationDangerLevel(locationName) {
    const normalizedName = locationName.toLowerCase();
    if (normalizedName.includes('dungeon') || normalizedName.includes('cave') || 
        normalizedName.includes('ruins') || normalizedName.includes('forest')) {
      return 'medium';
    } else if (normalizedName.includes('dark') || normalizedName.includes('cursed') || 
               normalizedName.includes('abandoned')) {
      return 'high';
    }
    return 'low';
  }

  /**
   * Log gold change
   */
  _logGoldChange(character, amount, reason, type = 'gain') {
    if (this.replayLogger) {
      this.replayLogger.logEvent(this.session.frame, 'gold_changed', {
        characterId: character.id,
        amount: amount,
        newTotal: character.inventory?.gold || 0,
        reason: reason,
        type: type
      }, character.id);
    }
  }

  /**
   * Capture current game state for replay
   */
  _captureGameState() {
    if (!this.session) return null;

    return {
      frame: this.session.frame,
      time: this.session.currentTime,
      timeOfDay: this.session.getTimeOfDay(),
      weather: this.session.weather,
      season: this.session.season,
      playerLocation: this.session.currentLocation,
      playerHP: this.player.stats?.currentHP || 100,
      playerMaxHP: this.player.stats?.maxHP || 100,
      playerLevel: this.player.stats?.level || 1,
      playerGold: this.player.inventory?.gold || 0
    };
  }

  /**
   * Sleep helper
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * End a conversation
   */
  async _endConversation(conversationId) {
    if (!conversationId) return;
    try {
      await this.session.endConversation(conversationId);
    } catch (error) {
      console.error('[AutonomousGameService] Error ending conversation:', error);
    }
  }
}

export default AutonomousGameService;
