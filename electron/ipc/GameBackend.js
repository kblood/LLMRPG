import { GameSession } from '../../src/game/GameSession.js';
import { GameMaster } from '../../src/systems/GameMaster.js';
import { ActionSystem } from '../../src/systems/actions/ActionSystem.js';
import { CombatEncounterSystem } from '../../src/systems/combat/CombatEncounterSystem.js';
import { CombatSystem } from '../../src/systems/combat/CombatSystem.js';
import { OllamaService } from '../../src/services/OllamaService.js';
import { EventBus } from '../../src/services/EventBus.js';
import { Character } from '../../src/entities/Character.js';
import { Personality } from '../../src/ai/personality/Personality.js';
import { CharacterStats } from '../../src/systems/stats/CharacterStats.js';
import { Inventory } from '../../src/systems/items/Inventory.js';
import { Equipment } from '../../src/systems/items/Equipment.js';
import { AbilityManager } from '../../src/systems/abilities/AbilityManager.js';
import { CombatAI } from '../../src/systems/combat/CombatAI.js';
import { createAllNPCs } from '../../src/data/npc-roster.js';
import { ReplayLogger } from '../../src/replay/ReplayLogger.js';
import { ReplayFile } from '../../src/replay/ReplayFile.js';
import fs from 'fs';
import path from 'path';

/**
 * Game Backend - Bridges game logic with Electron IPC
 */
export class GameBackend {
  constructor() {
    this.session = null;
    this.gameMaster = null;
    this.actionSystem = null;
    this.combatEncounterSystem = null;
    this.combatSystem = null;
    this.ollama = null;
    this.eventBus = null;
    this.npcs = null;
    this.player = null;
    this.currentConversation = null;
    this.conversationHistory = [];
    this.initialized = false;

    // Autonomous mode state
    this.autonomousMode = false;
    this.autonomousInterval = null;
    this.autonomousConfig = {
      maxTurnsPerConversation: 10,
      pauseBetweenTurns: 2000, // 2 seconds
      pauseBetweenConversations: 3000, // 3 seconds
      pauseBetweenActions: 2000 // 2 seconds between actions
    };
    this.pastConversations = [];
    this.lastConversationData = null; // Track last conversation for transitions

    // Replay system
    this.replayLogger = null;
    this.replayDir = './replays';
    this.currentReplayFile = null;
  }

  async initialize(options = {}) {
    if (this.initialized) {
      return this.getStatus();
    }

    try {
      console.log('[GameBackend] Initializing...');

      // Initialize services
      console.log('[GameBackend] Creating OllamaService instance...');
      this.ollama = OllamaService.getInstance();
      console.log('[GameBackend] Creating EventBus instance...');
      this.eventBus = EventBus.getInstance();

      // Check Ollama availability
      console.log('[GameBackend] Checking Ollama availability at http://localhost:11434...');
      const ollamaAvailable = await this.ollama.isAvailable();
      console.log('[GameBackend] Ollama available:', ollamaAvailable);

      if (!ollamaAvailable) {
        throw new Error('Ollama is not available. Please start Ollama service.');
      }

      // Create game session
      this.session = new GameSession({
        seed: options.seed || Date.now(),
        model: options.model || 'llama3.1:8b',
        temperature: options.temperature || 0.8
      });

      // Create player character with RPG stats
      const playerStats = new CharacterStats({
        strength: 12,
        dexterity: 10,
        constitution: 14,
        intelligence: 11,
        wisdom: 10,
        charisma: 13
      });

      const playerInventory = new Inventory({ maxSlots: 20, maxWeight: 100, gold: 75 }); // Start with 75 gold
      const playerEquipment = new Equipment();
      const playerAbilities = new AbilityManager();

      this.player = new Character('player', options.playerName || 'Kael', {
        role: 'protagonist',
        personality: new Personality({
          friendliness: 60,
          intelligence: 70,
          caution: 50,
          honor: 75,
          greed: 40,
          aggression: 35
        }),
        backstory: 'A curious adventurer who has arrived in the village.',
        stats: playerStats,
        inventory: playerInventory,
        equipment: playerEquipment,
        abilities: playerAbilities
      });

      // Create NPCs
      const npcsObject = createAllNPCs();
      this.npcs = new Map(Object.entries(npcsObject));

      // Register characters with session
      this.session.addCharacter(this.player);
      this.npcs.forEach(npc => this.session.addCharacter(npc));

      // Initialize Game Master
      this.gameMaster = new GameMaster(this.ollama, this.eventBus);

      // Initialize Action System
      this.actionSystem = new ActionSystem(this.gameMaster, this.session);

      // Initialize Combat Systems
      this.combatEncounterSystem = new CombatEncounterSystem(this.session, {
        baseEncounterChance: 0.2 // 20% base encounter chance
      });
      this.combatSystem = new CombatSystem(this.gameMaster, this.session, {
        pauseBetweenRounds: 0 // No pause in autonomous mode
      });

      // Add combat AI to player
      this.player.combatAI = new CombatAI({
        behavior: 'balanced'
      });

      // Initialize Replay Logger
      this.replayLogger = new ReplayLogger(this.session.seed);
      this.replayLogger.initialize({
        seed: this.session.seed,
        startTime: Date.now(),
        characters: [
          { id: this.player.id, name: this.player.name, role: this.player.role },
          ...Array.from(this.npcs.values()).map(npc => ({ id: npc.id, name: npc.name, role: npc.role }))
        ],
        gameVersion: '1.0.0',
        mode: 'autonomous_electron'
      });

      // Create replays directory if it doesn't exist
      if (!fs.existsSync(this.replayDir)) {
        fs.mkdirSync(this.replayDir, { recursive: true });
      }

      // Set up event listeners
      this.setupEventListeners();

      this.initialized = true;
      console.log('[GameBackend] Initialized successfully');

      return this.getStatus();
    } catch (error) {
      console.error('[GameBackend] Initialization failed:', error);
      throw error;
    }
  }

  setupEventListeners() {
    // Listen for GM narrations
    this.eventBus.on('gm:narration', (data) => {
      console.log('[GameBackend] GM Narration:', data.text);
      // Forward to renderer if needed
    });

    // Listen for quest events and log to replay
    this.eventBus.on('quest:created', ({ quest }) => {
      console.log('[GameBackend] Quest created:', quest.title);
      if (this.replayLogger) {
        const gameState = this._captureGameState();
        this.replayLogger.logEvent(this.session.frame, 'quest_started', {
          questId: quest.id,
          title: quest.title,
          description: quest.description,
          objectives: quest.stages?.[0]?.objectives || []
        }, 'system', gameState);
      }
    });

    this.eventBus.on('quest:completed', ({ quest, rewards }) => {
      console.log('[GameBackend] Quest completed:', quest.title);
      if (this.replayLogger) {
        const gameState = this._captureGameState();
        this.replayLogger.logEvent(this.session.frame, 'quest_completed', {
          questId: quest.id,
          title: quest.title,
          rewards: rewards || {}
        }, this.player?.id || 'system', gameState);
      }
    });

    this.eventBus.on('quest:objective-completed', ({ quest, objective }) => {
      if (this.replayLogger) {
        this.replayLogger.logEvent(this.session.frame, 'quest_objective_completed', {
          questId: quest.id,
          objectiveId: objective.id,
          description: objective.description
        }, this.player?.id || 'system');
      }
    });

    // Listen for combat events
    this.eventBus.on('combat:level_up', ({ character, newLevel }) => {
      console.log('[GameBackend] Level up:', character, 'to level', newLevel);
      if (this.replayLogger) {
        this.replayLogger.logEvent(this.session.frame, 'level_up', {
          characterName: character,
          newLevel: newLevel,
          statsRestored: true
        }, this.player?.id || 'system');
      }
    });
  }

  async checkOllama() {
    if (!this.ollama) {
      this.ollama = OllamaService.getInstance();
    }
    const available = await this.ollama.isAvailable();
    return { available };
  }

  getNPCs() {
    if (!this.initialized) {
      throw new Error('Game not initialized');
    }

    return Array.from(this.npcs.values()).map(npc => ({
      id: npc.id,
      name: npc.name,
      role: npc.role,
      personality: npc.personality.traits,
      background: npc.backstory || npc.background,
      location: npc.location || 'Village',
      relationshipLevel: this.player ? npc.relationships.getRelationshipLevel(this.player.id) : 0
    }));
  }

  async startConversation(npcId) {
    if (!this.initialized) {
      throw new Error('Game not initialized');
    }

    const npc = this.npcs.get(npcId);
    if (!npc) {
      throw new Error(`NPC ${npcId} not found`);
    }

    try {
      console.log(`[GameBackend] Starting conversation with ${npc.name}`);

      // Generate GM narration for conversation start
      const narration = await this.gameMaster.generateDialogueNarration(
        npc,
        this.player,
        {
          location: 'Village',
          timeOfDay: this.session.getTimeOfDay()
        }
      );

      // Start conversation in the session
      const conversationId = await this.session.startConversation(npcId);

      this.currentConversation = {
        id: conversationId,
        npcId: npcId,
        npc: npc,
        turns: [],
        narration: narration
      };

      this.conversationHistory = [];

      return {
        conversationId: conversationId,
        npc: {
          id: npc.id,
          name: npc.name,
          role: npc.role
        },
        narration: narration,
        relationshipLevel: npc.relationships.getRelationshipLevel(this.player.id)
      };
    } catch (error) {
      console.error('[GameBackend] Failed to start conversation:', error);
      throw error;
    }
  }

  async sendMessage(conversationId, message) {
    if (!this.initialized) {
      throw new Error('Game not initialized');
    }

    if (!this.currentConversation || this.currentConversation.id !== conversationId) {
      throw new Error('No active conversation or conversation ID mismatch');
    }

    try {
      console.log(`[GameBackend] Player says: "${message}"`);

      const npc = this.currentConversation.npc;

      // Add player message to history
      this.conversationHistory.push({
        speaker: 'player',
        text: message,
        timestamp: Date.now()
      });

      // Get NPC response through the session
      const response = await this.session.addConversationTurn(
        conversationId,
        npc.id,
        message
      );

      // Add NPC response to history
      this.conversationHistory.push({
        speaker: npc.id,
        text: response.text,
        timestamp: Date.now()
      });

      this.currentConversation.turns.push({
        player: message,
        npc: response.text
      });

      // Update relationship level
      const newRelationshipLevel = npc.relationships.getRelationshipLevel(this.player.id);

      console.log(`[GameBackend] ${npc.name} says: "${response.text}"`);

      return {
        text: response.text,
        speaker: npc.name,
        speakerId: npc.id,
        relationshipLevel: newRelationshipLevel,
        relationshipChange: response.relationshipChange,
        questDetected: response.questId ? true : false,
        questId: response.questId
      };
    } catch (error) {
      console.error('[GameBackend] Failed to send message:', error);
      throw error;
    }
  }

  async endConversation(conversationId) {
    if (!this.initialized) {
      throw new Error('Game not initialized');
    }

    if (!this.currentConversation || this.currentConversation.id !== conversationId) {
      return; // Already ended or different conversation
    }

    try {
      console.log('[GameBackend] Ending conversation');

      this.session.endConversation(conversationId);

      const summary = {
        npcId: this.currentConversation.npcId,
        turns: this.currentConversation.turns.length,
        finalRelationship: this.currentConversation.npc.relationships.getRelationshipLevel(this.player.id)
      };

      this.currentConversation = null;
      this.conversationHistory = [];

      return summary;
    } catch (error) {
      console.error('[GameBackend] Failed to end conversation:', error);
      throw error;
    }
  }

  getStats() {
    if (!this.initialized) {
      throw new Error('Game not initialized');
    }

    const sessionStats = this.session.getStats();

    return {
      ...sessionStats,
      ollamaAvailable: true,
      activeConversation: this.currentConversation ? {
        npcId: this.currentConversation.npcId,
        npcName: this.currentConversation.npc.name,
        turns: this.currentConversation.turns.length
      } : null
    };
  }

  getQuests() {
    if (!this.initialized) {
      throw new Error('Game not initialized');
    }

    const quests = this.session.getActiveQuests();

    return quests.map(quest => ({
      id: quest.id,
      title: quest.title,
      description: quest.description,
      giver: quest.giver,
      status: quest.status,
      objectives: quest.objectives
    }));
  }

  getStatus() {
    return {
      initialized: this.initialized,
      npcsCount: this.npcs ? this.npcs.size : 0,
      playerName: this.player ? this.player.name : null,
      sessionId: this.session ? this.session.sessionId : null
    };
  }

  getPlayerStats() {
    if (!this.initialized || !this.player) {
      throw new Error('Game not initialized');
    }

    const stats = this.player.stats;
    const gold = this.player.getGold();

    if (!stats) {
      return {
        name: this.player.name,
        level: 1,
        currentHP: 100,
        maxHP: 100,
        currentStamina: 100,
        maxStamina: 100,
        currentMagic: 100,
        maxMagic: 100,
        currentXP: 0,
        xpToNextLevel: 100,
        gold: gold
      };
    }

    return {
      name: this.player.name,
      level: stats.level,
      currentHP: stats.currentHP,
      maxHP: stats.maxHP,
      currentStamina: stats.currentStamina,
      maxStamina: stats.maxStamina,
      currentMagic: stats.currentMagic,
      maxMagic: stats.maxMagic,
      currentXP: stats.currentXP,
      xpToNextLevel: stats.xpToNextLevel,
      gold: gold,
      attributes: {
        strength: stats.strength,
        dexterity: stats.dexterity,
        constitution: stats.constitution,
        intelligence: stats.intelligence,
        wisdom: stats.wisdom,
        charisma: stats.charisma
      }
    };
  }

  // ============ Autonomous Mode Methods ============

  /**
   * Start autonomous gameplay mode
   */
  async startAutonomousMode(window) {
    if (!this.initialized) {
      throw new Error('Game not initialized');
    }

    if (this.autonomousMode) {
      console.log('[GameBackend] Autonomous mode already running');
      return { started: true, message: 'Already running' };
    }

    console.log('[GameBackend] Starting autonomous mode');
    this.autonomousMode = true;
    this.window = window;

    // Generate world locations
    console.log('[GameBackend] Generating world locations...');
    const world = await this.gameMaster.generateWorld(this.player);

    // Store world in session for NPC access
    this.session.world = world;

    // Give NPCs knowledge of the world
    this._giveNPCsWorldKnowledge(world);

    // Send world to UI
    this._sendToUI('autonomous:world-generated', {
      world: world
    });

    // Generate opening narration
    console.log('[GameBackend] Generating opening narration...');
    const openingNarration = await this.gameMaster.generateOpeningNarration(
      this.player,
      world,
      { timeOfDay: this.session.getTimeOfDay() }
    );

    // Send opening narration to UI
    this._sendToUI('autonomous:opening-narration', {
      narration: openingNarration
    });

    // Wait for narration to be read
    await this._sleep(5000);

    // Generate main quest
    console.log('[GameBackend] Generating main quest...');
    const mainQuest = await this.gameMaster.generateMainQuest(this.player, world);

    if (mainQuest) {
      // Add quest to session
      const questId = this.session.questManager.createQuest(mainQuest);
      mainQuest.id = questId;

      // Send quest to UI
      this._sendToUI('autonomous:main-quest', {
        quest: mainQuest
      });

      console.log(`[GameBackend] Main quest created: ${mainQuest.title}`);
    }

    // Wait before starting conversations
    await this._sleep(3000);

    // Log game start event
    if (this.replayLogger) {
      this.replayLogger.logEvent(this.session.frame, 'game_start', {
        mode: 'autonomous',
        seed: this.session.seed,
        mainQuest: mainQuest?.title
      }, 'system');
    }

    // Start the autonomous loop
    this._runAutonomousLoop();

    return { started: true };
  }

  /**
   * Stop autonomous gameplay mode
   */
  async stopAutonomousMode() {
    console.log('[GameBackend] Stopping autonomous mode');
    this.autonomousMode = false;

    if (this.currentConversation) {
      this.endConversation(this.currentConversation.id);
    }

    // Save replay
    if (this.replayLogger) {
      await this._saveReplay();
    }

    return { stopped: true };
  }

  /**
   * Main autonomous game loop with action system
   */
  async _runAutonomousLoop() {
    while (this.autonomousMode) {
      try {
        // Advance time (traveling/thinking between actions)
        const timeDelta = 5 + Math.floor(Math.random() * 10); // 5-15 minutes
        const timeUpdate = this.session.tick(timeDelta);
        this._sendToUI('game:time-update', timeUpdate);

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

        console.log(`[GameBackend] Protagonist decided to: ${action.type} - ${action.reason}`);

        // Get active quest for context
        const activeQuests = this.session.questManager ? this.session.questManager.getActiveQuests() : [];
        const activeQuest = activeQuests.length > 0 ? activeQuests[0] : null;

        // Notify UI of action decision
        this._sendToUI('autonomous:action-decision', {
          type: action.type,
          reason: action.reason
        });

        await this._sleep(this.autonomousConfig.pauseBetweenActions);

        if (!this.autonomousMode) break;

        // Handle CONVERSATION action specially (existing conversation system)
        if (action.type === 'conversation') {
          if (availableNPCs.length === 0) {
            console.log('[GameBackend] All NPCs have been talked to, resetting');
            this.pastConversations = [];
            continue;
          }

          const chosenNPC = availableNPCs[0]; // Choose first available
          console.log(`[GameBackend] Protagonist chose to talk to ${chosenNPC.name}`);

          // Notify UI
          this._sendToUI('autonomous:action', {
            type: 'npc_chosen',
            npcId: chosenNPC.id,
            npcName: chosenNPC.name
          });

          this.pastConversations.push(chosenNPC.id);

          // Wait before starting conversation
          await this._sleep(this.autonomousConfig.pauseBetweenConversations);

          if (!this.autonomousMode) break;

          // Start conversation
          await this._runAutonomousConversation(chosenNPC);

          // Advance time after conversation
          const postConvoTimeDelta = 10 + Math.floor(Math.random() * 15);
          const postConvoTime = this.session.tick(postConvoTimeDelta);
          this._sendToUI('game:time-update', postConvoTime);
        } else if (action.type === 'investigate' || action.type === 'travel' || action.type === 'search') {
          // Check for combat encounter when investigating, traveling, or searching
          const location = {
            name: context.location || 'Millhaven',
            dangerLevel: this._getLocationDangerLevel(context.location || 'Millhaven')
          };

          const timeOfDay = this.session.getTimeOfDay();
          const encounter = this.combatEncounterSystem.generateCombatEncounter(
            this.player,
            location,
            timeOfDay
          );

          if (encounter) {
            console.log('[GameBackend] Combat encounter triggered!');

            // Notify UI
            this._sendToUI('autonomous:combat-encounter', {
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

            if (!this.autonomousMode) break;

            // Execute combat
            const combatResult = await this.combatSystem.executeCombat(
              this.player,
              encounter.enemies,
              encounter
            );

            console.log(`[GameBackend] Combat ended: ${combatResult.outcome}`);

            // Notify UI of combat result
            this._sendToUI('autonomous:combat-result', {
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

            if (!this.autonomousMode) break;

            // Check if player was defeated
            if (combatResult.outcome === 'defeat') {
              // Generate narration for respawn
              this._sendToUI('autonomous:action-result', {
                type: 'combat_defeat',
                narration: 'You wake up in a safe place, battered but alive. Your journey continues.'
              });

              await this._sleep(this.autonomousConfig.pauseBetweenActions);
            }
          } else {
            // Execute action through ActionSystem
            const result = await this.actionSystem.executeAction(action, this.player, {
              location: 'Millhaven',
              activeQuest: activeQuest
            });

            console.log(`[GameBackend] Action executed: ${action.type}, success: ${result.success}`);

            // Send action result to UI
            this._sendToUI('autonomous:action-result', {
              type: action.type,
              result: result,
              narration: result.narration
            });

            // Advance time based on action
            if (result.timeAdvanced) {
              const actionTime = this.session.tick(result.timeAdvanced);
              this._sendToUI('game:time-update', actionTime);
            }

            // Log action to replay
            if (this.replayLogger) {
              this.replayLogger.logEvent(this.session.frame++, 'action_performed', {
                actionType: action.type,
                reason: action.reason,
                timeAdvanced: result.timeAdvanced,
                success: result.success
              }, this.player.id);
            }
          }
        } else {
          // Execute other actions through ActionSystem
          const result = await this.actionSystem.executeAction(action, this.player, {
            location: 'Millhaven',
            activeQuest: activeQuest
          });

          console.log(`[GameBackend] Action executed: ${action.type}, success: ${result.success}`);

          // Send action result to UI
          this._sendToUI('autonomous:action-result', {
            type: action.type,
            result: result,
            narration: result.narration
          });

          // Advance time based on action
          if (result.timeAdvanced) {
            const actionTime = this.session.tick(result.timeAdvanced);
            this._sendToUI('game:time-update', actionTime);
          }

          // Log action to replay
          if (this.replayLogger) {
            this.replayLogger.logEvent(this.session.frame++, 'action_performed', {
              actionType: action.type,
              reason: action.reason,
              timeAdvanced: result.timeAdvanced,
              success: result.success
            }, this.player.id);
          }
        }

        // Wait between actions
        await this._sleep(this.autonomousConfig.pauseBetweenActions);

      } catch (error) {
        console.error('[GameBackend] Autonomous loop error:', error);
        this._sendToUI('autonomous:error', {
          message: error.message
        });
        await this._sleep(3000);
      }
    }

    console.log('[GameBackend] Autonomous loop ended');
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

      // Log conversation start event
      if (this.replayLogger) {
        this.replayLogger.logEvent(this.session.frame++, 'conversation_started', {
          protagonistId: this.player.id,
          npcId: npc.id,
          location: 'Village'
        }, this.player.id);
      }

      // Notify UI conversation started
      this._sendToUI('autonomous:conversation-start', {
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

        this._sendToUI('autonomous:message', {
          speaker: 'npc',
          speakerId: npc.id,
          speakerName: npc.name,
          text: greeting.output
        });

        await this._sleep(this.autonomousConfig.pauseBetweenTurns);

        // Advance time slightly (conversation turn)
        this.session.tick(1 + Math.floor(Math.random() * 2)); // 1-3 minutes per greeting
      }

      // Conversation loop
      for (let turn = 0; turn < this.autonomousConfig.maxTurnsPerConversation; turn++) {
        if (!this.autonomousMode) break;

        // Protagonist decides what to say
        const protagonistResponse = await this._protagonistDecideResponse(
          this.player,
          npc,
          conversation.history
        );

        // Advance time (thinking and speaking)
        this.session.tick(1 + Math.floor(Math.random() * 2)); // 1-3 minutes per turn

        // Check for exit intent
        const exitPhrases = ['goodbye', 'farewell', 'see you', 'be going', 'must go', 'should leave'];
        const wantsToExit = exitPhrases.some(phrase =>
          protagonistResponse.toLowerCase().includes(phrase)
        );

        // Log protagonist dialogue
        if (this.replayLogger) {
          this.replayLogger.logEvent(this.session.frame++, 'dialogue_line', {
            speakerId: this.player.id,
            text: protagonistResponse
          }, this.player.id);
        }

        // Send protagonist message to UI
        this._sendToUI('autonomous:message', {
          speaker: 'player',
          speakerId: this.player.id,
          speakerName: this.player.name,
          text: protagonistResponse
        });

        if (wantsToExit) {
          console.log(`[GameBackend] ${this.player.name} decides to end conversation`);
          break;
        }

        await this._sleep(this.autonomousConfig.pauseBetweenTurns);

        if (!this.autonomousMode) break;

        // Get NPC response
        const response = await this.session.addConversationTurn(
          conversationId,
          npc.id,
          protagonistResponse
        );

        // Log NPC dialogue
        if (this.replayLogger) {
          this.replayLogger.logEvent(this.session.frame++, 'dialogue_line', {
            speakerId: npc.id,
            text: response.text
          }, npc.id);
        }

        // Send NPC response to UI
        this._sendToUI('autonomous:message', {
          speaker: 'npc',
          speakerId: npc.id,
          speakerName: npc.name,
          text: response.text
        });

        // Check if NPC wants to end
        const npcExitIntent = response && response.text &&
          exitPhrases.some(phrase => response.text.toLowerCase().includes(phrase));

        if (npcExitIntent) {
          console.log(`[GameBackend] ${npc.name} ends conversation`);
          break;
        }

        await this._sleep(this.autonomousConfig.pauseBetweenTurns);
      }

      // End conversation
      const summary = await this.endConversation(conversationId);

      // Log conversation end
      if (this.replayLogger) {
        this.replayLogger.logEvent(this.session.frame++, 'conversation_ended', {
          protagonistId: this.player.id,
          npcId: npc.id,
          turns: summary.turns
        }, 'system');

        // Create checkpoint
        this.replayLogger.logCheckpoint(this.session.frame, {
          frame: this.session.frame,
          conversationCompleted: conversationId,
          relationships: {
            [npc.id]: this.player.relationships.getRelationship(npc.id).value
          }
        });
      }

      // Store conversation data for next transition
      this.lastConversationData = {
        npcName: npc.name,
        npcRole: npc.role,
        topics: 'general discussion', // Could be extracted from conversation
        endReason: 'naturally concluded'
      };

      // Notify UI conversation ended
      this._sendToUI('autonomous:conversation-end', {
        npcId: npc.id,
        npcName: npc.name,
        turns: summary.turns,
        relationshipLevel: summary.finalRelationship
      });

    } catch (error) {
      console.error('[GameBackend] Autonomous conversation error:', error);
      throw error;
    }
  }

  /**
   * Protagonist AI chooses which NPC to talk to
   */
  async _protagonistChooseNPC(availableNPCs) {
    // Simple choice: just pick first available for now
    // TODO: Use LLM to make intelligent choice
    return availableNPCs[0];
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

      // OllamaService.generate() returns a plain string, not an object
      const response = await this.ollama.generate(context, {
        model: this.session.model || 'llama3.1:8b',
        temperature: this.session.temperature || 0.8,
        seed: seed
      });

      // response is already a string
      let text = response || '';
      text = text.trim();
      text = text.replace(/^(You say:|I say:|Response:|Protagonist:)\s*/i, '');
      text = text.replace(/^["']|["']$/g, '');
      text = text.split('\n')[0];

      console.log(`[GameBackend] Protagonist response: "${text}"`);
      return text || 'Hello!';
    } catch (error) {
      console.error('[GameBackend] Protagonist AI error:', error);
      if (conversationHistory.length === 0) {
        return "Greetings! I'm new to this village.";
      } else if (conversationHistory.length > 7) {
        return "It was nice talking with you. I should be going.";
      } else {
        return "Tell me more about that.";
      }
    }
  }

  /**
   * Send event to UI window
   */
  _sendToUI(event, data) {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send(event, data);
    }
  }

  /**
   * Give NPCs knowledge of world locations
   */
  _giveNPCsWorldKnowledge(world) {
    if (!world || !this.npcs) return;

    console.log('[GameBackend] Adding world knowledge to NPC memories...');

    // Add knowledge about cities
    if (world.cities) {
      world.cities.forEach(city => {
        this.npcs.forEach(npc => {
          npc.memory.addMemory({
            type: 'knowledge',
            category: 'location',
            content: `${city.name} - ${city.description}`,
            importance: city.name === 'Millhaven' ? 0.9 : 0.6,
            location: city.name,
            tags: ['city', city.atmosphere, city.population]
          });
        });
      });
    }

    // Add knowledge about dungeons (rumors)
    if (world.dungeons) {
      world.dungeons.forEach(dungeon => {
        // Not all NPCs know about all dungeons
        // More dangerous dungeons are less well-known
        const knowledgeChance = dungeon.danger_level === 'low' ? 0.8 :
                                dungeon.danger_level === 'medium' ? 0.6 :
                                dungeon.danger_level === 'high' ? 0.4 : 0.2;

        this.npcs.forEach(npc => {
          if (Math.random() < knowledgeChance) {
            npc.memory.addMemory({
              type: 'rumor',
              category: 'location',
              content: `I've heard of ${dungeon.name}, ${dungeon.description}`,
              importance: 0.5,
              location: dungeon.name,
              tags: ['dungeon', dungeon.type, dungeon.danger_level]
            });

            // Add treasure rumor separately
            if (dungeon.rumored_treasure && Math.random() < 0.5) {
              npc.memory.addMemory({
                type: 'rumor',
                category: 'treasure',
                content: `They say ${dungeon.name} contains ${dungeon.rumored_treasure}`,
                importance: 0.4,
                tags: ['treasure', 'rumor', dungeon.name]
              });
            }
          }
        });
      });
    }

    // Add knowledge about landmarks
    if (world.landmarks) {
      world.landmarks.forEach(landmark => {
        this.npcs.forEach(npc => {
          if (Math.random() < 0.7) { // 70% know about landmarks
            npc.memory.addMemory({
              type: 'knowledge',
              category: 'location',
              content: `${landmark.name} - ${landmark.description}`,
              importance: 0.5,
              location: landmark.name,
              tags: ['landmark', landmark.type]
            });
          }
        });
      });
    }

    // Add knowledge about special locations (mysteries)
    if (world.special_locations) {
      world.special_locations.forEach(location => {
        // Special locations are less well-known
        this.npcs.forEach(npc => {
          if (Math.random() < 0.4) {
            npc.memory.addMemory({
              type: 'rumor',
              category: 'mystery',
              content: `${location.name} - ${location.mystery}`,
              importance: 0.6,
              location: location.name,
              tags: ['mystery', location.type, 'special']
            });
          }
        });
      });
    }

    console.log('[GameBackend] World knowledge added to NPCs');
  }

  /**
   * Get danger level for a location
   * @param {string} locationName
   * @returns {string}
   * @private
   */
  _getLocationDangerLevel(locationName) {
    // Default safe for village
    if (locationName === 'Millhaven' || locationName.toLowerCase().includes('village')) {
      return 'safe';
    }

    // Check world locations if available
    if (this.session.world) {
      // Check dungeons
      const dungeon = this.session.world.dungeons?.find(d => d.name === locationName);
      if (dungeon) {
        return dungeon.danger_level || 'medium';
      }

      // Check landmarks
      const landmark = this.session.world.landmarks?.find(l => l.name === locationName);
      if (landmark) {
        // Landmarks have moderate danger
        return 'low';
      }

      // Check special locations
      const special = this.session.world.special_locations?.find(s => s.name === locationName);
      if (special) {
        return 'medium';
      }
    }

    // Default to low danger for unknown locations
    return 'low';
  }

  /**
   * Log gold changes to replay
   */
  _logGoldChange(character, amount, reason, operation) {
    if (!this.replayLogger || !character) return;

    const newTotal = character.getGold ? character.getGold() : 0;
    this.replayLogger.logEvent(this.session.frame, 'gold_changed', {
      characterId: character.id,
      characterName: character.name,
      amount: Math.abs(amount),
      operation: operation, // 'gain' or 'lose'
      reason: reason,
      newTotal: newTotal
    }, character.id);
  }

  /**
   * Sleep helper
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Save replay to file
   */
  async _saveReplay() {
    if (!this.replayLogger) {
      console.log('[GameBackend] No replay logger to save');
      return null;
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = path.join(
        this.replayDir,
        `autonomous_game_${timestamp}_${this.session.seed}.json`
      );

      await this.replayLogger.save(filename);

      const stats = fs.statSync(filename);
      console.log(`[GameBackend] Replay saved: ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);

      this.currentReplayFile = filename;

      // Notify UI
      this._sendToUI('replay:saved', {
        filename: path.basename(filename),
        fullPath: filename,
        size: stats.size,
        events: this.replayLogger.getEventCount(),
        llmCalls: this.replayLogger.getLLMCallCount()
      });

      return filename;
    } catch (error) {
      console.error('[GameBackend] Failed to save replay:', error);
      return null;
    }
  }

  /**
   * List available replay files
   */
  async listReplays() {
    try {
      if (!fs.existsSync(this.replayDir)) {
        return [];
      }

      const files = fs.readdirSync(this.replayDir);
      const replays = files
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const fullPath = path.join(this.replayDir, f);
          const stats = fs.statSync(fullPath);

          return {
            filename: f,
            fullPath: fullPath,
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime
          };
        })
        .sort((a, b) => b.modified - a.modified); // Most recent first

      return replays;
    } catch (error) {
      console.error('[GameBackend] Failed to list replays:', error);
      return [];
    }
  }

  /**
   * Load a replay file
   */
  async loadReplay(filename) {
    try {
      const fullPath = path.join(this.replayDir, filename);

      if (!fs.existsSync(fullPath)) {
        throw new Error(`Replay file not found: ${filename}`);
      }

      // Use ReplayFile.load() to handle decompression
      const replay = await ReplayFile.load(fullPath);

      console.log(`[GameBackend] Loaded replay: ${filename}`);
      console.log(`  Events: ${replay.events?.length || 0}`);
      console.log(`  LLM Calls: ${replay.llmCalls?.length || 0}`);
      console.log(`  Checkpoints: ${replay.checkpoints?.length || 0}`);

      return replay;
    } catch (error) {
      console.error('[GameBackend] Failed to load replay:', error);
      throw error;
    }
  }

  /**
   * Capture current game state for replay
   * @returns {Object} Game state snapshot
   */
  _captureGameState() {
    if (!this.player || !this.session) {
      return null;
    }

    try {
      // Get player stats
      const playerStats = {
        name: this.player.name,
        level: this.player.stats?.level || 1,
        currentHP: this.player.stats?.currentHP || 0,
        maxHP: this.player.stats?.maxHP || 0,
        currentMP: this.player.stats?.currentMP || 0,
        maxMP: this.player.stats?.maxMP || 0,
        currentXP: this.player.stats?.currentXP || 0,
        xpToNextLevel: this.player.stats?.xpToNextLevel || 0,
        gold: this.player.getGold?.() || 0,
        statValues: {
          str: this.player.stats?.getStatValue?.('str') || 10,
          dex: this.player.stats?.getStatValue?.('dex') || 10,
          con: this.player.stats?.getStatValue?.('con') || 10,
          int: this.player.stats?.getStatValue?.('int') || 10,
          wis: this.player.stats?.getStatValue?.('wis') || 10,
          cha: this.player.stats?.getStatValue?.('cha') || 10
        }
      };

      // Get time data
      const timeData = {
        time: this.session.getFormattedTime?.() || '00:00',
        timeOfDay: this.session.getTimeOfDay?.() || 'evening',
        weather: this.session.weather || 'clear',
        season: this.session.season || 'autumn',
        day: this.session.day || 1,
        year: this.session.year || 1247
      };

      // Get active quests
      const quests = [];
      if (this.session.questLog && this.session.questLog.activeQuests) {
        for (const quest of this.session.questLog.activeQuests.values()) {
          quests.push({
            id: quest.id,
            title: quest.title,
            description: quest.description,
            status: quest.status,
            currentStage: quest.currentStage,
            stages: quest.stages
          });
        }
      }

      // Get world locations
      const world = this.world ? {
        cities: this.world.cities || [],
        dungeons: this.world.dungeons || [],
        landmarks: this.world.landmarks || [],
        specialLocations: this.world.specialLocations || []
      } : null;

      // Get nearby NPCs
      const npcs = this.npcs ? this.npcs.map(npc => ({
        id: npc.id,
        name: npc.name,
        role: npc.role,
        relationship: npc.relationships?.getRelationship?.(this.player.id) || 0
      })) : [];

      return {
        player: playerStats,
        time: timeData,
        quests: quests,
        world: world,
        npcs: npcs,
        frame: this.session.frame
      };
    } catch (error) {
      console.error('[GameBackend] Error capturing game state:', error);
      return null;
    }
  }

  cleanup() {
    console.log('[GameBackend] Cleaning up...');

    this.stopAutonomousMode();

    if (this.currentConversation) {
      this.endConversation(this.currentConversation.id);
    }

    this.session = null;
    this.gameMaster = null;
    this.npcs = null;
    this.player = null;
    this.initialized = false;
  }
}
