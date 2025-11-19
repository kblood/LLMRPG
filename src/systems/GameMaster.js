import { OllamaService } from '../services/OllamaService.js';
import { EventBus } from '../services/EventBus.js';
import Logger from '../utils/Logger.js';

/**
 * GameMaster - Narrative Director
 * 
 * Acts as the "Dungeon Master" for the game, providing:
 * - Scene narration and atmospheric descriptions
 * - Dynamic event generation based on player actions
 * - Story arc tracking and progression
 * - NPC interaction orchestration
 * - Narrative coherence and pacing
 */
export class GameMaster {
    constructor(ollamaService = null, eventBus = null) {
        this.ollama = ollamaService || OllamaService.getInstance();
        this.eventBus = eventBus || EventBus.getInstance();
        this.logger = new Logger('GameMaster');
        
        // GM personality and style
        this.personality = {
            name: "The Chronicler",
            style: "atmospheric_storyteller",
            tone: "mysterious_yet_helpful",
            description: "An unseen presence that narrates and shapes the world"
        };
        
        // Story tracking
        this.narrativeMemory = [];
        this.currentAct = 1;
        this.storyBeats = [];
        this.lastNarration = null;
        
        // State tracking
        this.playerActions = [];
        this.npcInteractions = [];
        this.activeEvents = [];
        this.narrativeContext = {};
        
        // Configuration
        this.narrationFrequency = 'key_moments'; // 'constant', 'key_moments', 'minimal'
        this.eventGenerationEnabled = true;
        this.storyArcTracking = true;
        
        this.logger.info('Game Master initialized as "The Chronicler"');
        this._setupEventListeners();
    }
    
    /**
     * Setup event listeners to observe game state
     */
    _setupEventListeners() {
        // Observe player actions
        this.eventBus.on('player:action', (data) => this.observePlayerAction(data));
        this.eventBus.on('dialogue:started', (data) => this.observeDialogueStart(data));
        this.eventBus.on('dialogue:ended', (data) => this.observeDialogueEnd(data));
        this.eventBus.on('quest:started', (data) => this.observeQuestStart(data));
        this.eventBus.on('quest:completed', (data) => this.observeQuestComplete(data));
        this.eventBus.on('location:changed', (data) => this.observeLocationChange(data));
    }
    
    /**
     * Generate atmospheric narration for a scene
     */
    async narrateScene(context) {
        this.logger.info(`Narrating scene: ${context.location || 'unknown location'}`);
        
        const prompt = this._buildNarrationPrompt(context);
        
        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.8,
                maxTokens: 200,
                systemPrompt: this._getGMSystemPrompt()
            });
            
            this.lastNarration = {
                text: narration,
                context: context,
                timestamp: Date.now()
            };
            
            this.narrativeMemory.push(this.lastNarration);
            this.eventBus.emit('gm:narration', this.lastNarration);
            
            return narration;
        } catch (error) {
            this.logger.error('Failed to generate narration:', error);
            return this._getFallbackNarration(context);
        }
    }
    
    /**
     * Generate a dynamic event based on current game state
     */
    async generateEvent(gameState) {
        if (!this.eventGenerationEnabled) return null;
        
        this.logger.info('Generating dynamic event');
        
        const prompt = this._buildEventPrompt(gameState);
        
        try {
            const eventData = await this.ollama.generate(prompt, {
                temperature: 0.9,
                maxTokens: 250,
                systemPrompt: this._getGMSystemPrompt()
            });
            
            const event = this._parseEventResponse(eventData);
            
            if (event) {
                this.activeEvents.push(event);
                this.eventBus.emit('gm:event_generated', event);
                this.logger.info(`Generated event: ${event.type}`);
            }
            
            return event;
        } catch (error) {
            this.logger.error('Failed to generate event:', error);
            return null;
        }
    }
    
    /**
     * Orchestrate an interaction between NPCs
     */
    async orchestrateNPCInteraction(npc1, npc2, context) {
        this.logger.info(`Orchestrating interaction between ${npc1.name} and ${npc2.name}`);
        
        const prompt = this._buildNPCInteractionPrompt(npc1, npc2, context);
        
        try {
            const interaction = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 200
            });
            
            const orchestration = {
                participants: [npc1.id, npc2.id],
                trigger: context.trigger || 'gm_orchestrated',
                narrative: interaction,
                playerCanObserve: context.playerCanObserve !== false
            };
            
            this.eventBus.emit('gm:npc_interaction', orchestration);
            
            return orchestration;
        } catch (error) {
            this.logger.error('Failed to orchestrate NPC interaction:', error);
            return null;
        }
    }
    
    /**
     * Provide atmospheric description for current moment
     */
    async provideAtmosphere(moment) {
        const prompt = `As the Game Master, provide a brief atmospheric description for this moment:

Location: ${moment.location || 'unknown'}
Time of Day: ${moment.timeOfDay || 'unknown'}
Recent Events: ${moment.recentEvents?.join(', ') || 'none'}
Current Mood: ${moment.mood || 'neutral'}
NPCs Present: ${moment.npcsPresent?.join(', ') || 'none'}

Provide a short, evocative description (2-3 sentences) that sets the atmosphere and hints at the underlying tension or peace of the moment.`;

        try {
            const atmosphere = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 150
            });

            return atmosphere;
        } catch (error) {
            this.logger.error('Failed to generate atmosphere:', error);
            return this._getFallbackAtmosphere(moment);
        }
    }

    /**
     * Generate narration for the start of a dialogue/conversation
     */
    async generateDialogueNarration(npc, player, context) {
        this.logger.info(`Generating dialogue narration for ${npc.name}`);

        const prompt = `You are ${this.personality.name}, the narrator of this RPG.

The player is about to speak with ${npc.name}.

NPC Details:
- Name: ${npc.name}
- Personality: ${this._summarizePersonality(npc.personality)}
- Background: ${npc.background || 'Unknown'}

Context:
- Location: ${context.location || 'unknown'}
- Time of Day: ${context.timeOfDay || 'unknown'}
- Player Name: ${player?.name || 'Adventurer'}

Provide a brief narration (2-3 sentences) that:
1. Describes the NPC's demeanor as the player approaches
2. Sets the mood for the conversation
3. Makes the encounter feel natural and immersive

Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.8,
                maxTokens: 150,
                systemPrompt: this._getGMSystemPrompt()
            });

            this.logger.debug('Generated dialogue narration');
            return narration;
        } catch (error) {
            this.logger.error('Failed to generate dialogue narration:', error);
            return this._getFallbackDialogueNarration(npc, context);
        }
    }
    
    /**
     * Track story arc progression
     */
    trackStoryArc(playerActions) {
        if (!this.storyArcTracking) return;
        
        // Analyze player actions to determine current act
        const actionCount = playerActions.length;
        const questCount = playerActions.filter(a => a.type === 'quest_started').length;
        const npcInteractionCount = playerActions.filter(a => a.type === 'dialogue').length;
        
        // Simple act determination
        if (actionCount < 5 && questCount === 0) {
            this.currentAct = 1; // Introduction
        } else if (questCount > 0 && questCount < 3) {
            this.currentAct = 2; // Rising Action
        } else if (questCount >= 3) {
            this.currentAct = 3; // Climax
        }
        
        this.logger.debug(`Story Arc: Act ${this.currentAct}`);
    }
    
    /**
     * Generate next story beat based on current act
     */
    generateNextStoryBeat(gameState) {
        const beat = {
            act: this.currentAct,
            type: this._determineStoryBeatType(gameState),
            description: this._generateStoryBeatDescription(gameState),
            timestamp: Date.now()
        };
        
        this.storyBeats.push(beat);
        this.eventBus.emit('gm:story_beat', beat);
        
        return beat;
    }
    
    /**
     * Check if narrative is coherent with recent events
     */
    checkNarrativeCoherence(proposedEvent) {
        // Check if event contradicts recent narrative
        const recentNarrative = this.narrativeMemory.slice(-5);
        
        // Simple coherence check (can be enhanced with LLM)
        const isCoherent = true; // TODO: Implement actual coherence checking
        
        return isCoherent;
    }
    
    /**
     * Adjust pacing based on game state
     */
    adjustPacing(gameState) {
        const recentActionDensity = this._calculateActionDensity(gameState);
        
        if (recentActionDensity > 0.8) {
            this.narrationFrequency = 'minimal'; // Let action play out
        } else if (recentActionDensity < 0.3) {
            this.narrationFrequency = 'constant'; // Keep engagement up
        } else {
            this.narrationFrequency = 'key_moments';
        }
        
        this.logger.debug(`Pacing adjusted to: ${this.narrationFrequency}`);
    }
    
    // ============ Observation Methods ============
    
    observePlayerAction(action) {
        this.playerActions.push({
            type: 'action',
            data: action,
            timestamp: Date.now()
        });
        
        this.trackStoryArc(this.playerActions);
    }
    
    observeDialogueStart(data) {
        this.npcInteractions.push({
            type: 'dialogue_start',
            npcId: data.npcId,
            timestamp: Date.now()
        });
    }
    
    observeDialogueEnd(data) {
        this.npcInteractions.push({
            type: 'dialogue_end',
            npcId: data.npcId,
            duration: data.duration,
            timestamp: Date.now()
        });
    }
    
    observeQuestStart(data) {
        this.playerActions.push({
            type: 'quest_started',
            questId: data.questId,
            timestamp: Date.now()
        });
        
        this.trackStoryArc(this.playerActions);
    }
    
    observeQuestComplete(data) {
        this.playerActions.push({
            type: 'quest_completed',
            questId: data.questId,
            timestamp: Date.now()
        });
        
        this.trackStoryArc(this.playerActions);
    }
    
    async observeLocationChange(data) {
        if (this.narrationFrequency !== 'minimal') {
            const narration = await this.narrateScene({
                location: data.newLocation,
                previousLocation: data.previousLocation,
                timeOfDay: data.timeOfDay,
                trigger: 'location_change'
            });
            
            return narration;
        }
    }
    
    // ============ Prompt Building Methods ============
    
    _buildNarrationPrompt(context) {
        const recentEvents = this.narrativeMemory.slice(-3).map(n => n.text).join(' ');
        
        return `You are ${this.personality.name}, the narrator of this RPG story. Your style is ${this.personality.style}.

Current Scene:
- Location: ${context.location || 'unknown'}
- Time of Day: ${context.timeOfDay || 'unknown'}
- Weather: ${context.weather || 'clear'}
- Recent Events: ${context.recentEvents?.join(', ') || 'none'}
- Player's Recent Actions: ${context.playerActions?.join(', ') || 'just arrived'}
- NPCs Present: ${context.npcsPresent?.join(', ') || 'none'}
- Mood/Atmosphere: ${context.mood || 'neutral'}

Recent Narrative Context:
${recentEvents || 'This is the beginning of the story.'}

Provide an atmospheric narration (2-4 sentences) that:
1. Sets the scene vividly
2. Hints at underlying tensions or mysteries
3. Makes the player feel immersed
4. Maintains narrative continuity with recent events
5. Subtly guides attention to interesting elements

Narration:`;
    }
    
    _buildEventPrompt(gameState) {
        return `You are ${this.personality.name}, orchestrating events in this RPG world.

Current Game State:
- Player has talked to: ${gameState.npcsMet?.join(', ') || 'no one yet'}
- Active Quests: ${gameState.activeQuests?.length || 0}
- Current Location: ${gameState.currentLocation || 'unknown'}
- Time of Day: ${gameState.timeOfDay || 'unknown'}
- Recent Player Actions: ${gameState.recentActions?.join(', ') || 'none'}

Story Context:
- Current Act: ${this.currentAct}
- Recent Story Beats: ${this.storyBeats.slice(-2).map(b => b.description).join(', ') || 'story beginning'}

Generate a dynamic event that:
1. Feels natural given the player's actions
2. Creates an interesting opportunity or challenge
3. Advances the narrative meaningfully
4. Respects established character relationships
5. Fits the current story act

Format your response as JSON:
{
  "type": "npc_arrival|discovery|confrontation|revelation",
  "description": "Brief description of what happens",
  "participants": ["npc_id_1", "npc_id_2"],
  "triggerCondition": "when/where this happens",
  "narrative": "Atmospheric description of the event",
  "consequences": ["possible outcome 1", "possible outcome 2"]
}`;
    }
    
    _buildNPCInteractionPrompt(npc1, npc2, context) {
        return `You are ${this.personality.name}, orchestrating an interaction between two NPCs.

NPC 1: ${npc1.name}
- Personality: ${this._summarizePersonality(npc1.personality)}
- Current Goal: ${npc1.currentGoal || 'none'}
- Relationship with ${npc2.name}: ${npc1.relationships?.getRelationship(npc2.id) || 0}

NPC 2: ${npc2.name}
- Personality: ${this._summarizePersonality(npc2.personality)}
- Current Goal: ${npc2.currentGoal || 'none'}
- Relationship with ${npc1.name}: ${npc2.relationships?.getRelationship(npc1.id) || 0}

Context: ${context.reason || 'NPCs naturally encounter each other'}
Player Can Observe: ${context.playerCanObserve !== false}

Describe what happens when these NPCs interact (2-3 sentences). Include:
1. Their initial reaction to seeing each other
2. What they might discuss based on their personalities
3. Any tension or warmth between them
4. What the player might learn from observing

Interaction:`;
    }
    
    _getGMSystemPrompt() {
        return `You are ${this.personality.name}, an expert Game Master for a narrative RPG. Your role is to:
- Create atmospheric and immersive descriptions
- Generate events that feel natural and meaningful
- Maintain narrative coherence and pacing
- Guide the story without railroading the player
- Make the world feel alive and reactive

Your style is ${this.personality.tone} and you narrate in a ${this.personality.style} manner.`;
    }
    
    // ============ Helper Methods ============
    
    _parseEventResponse(eventData) {
        try {
            // Try to parse as JSON first
            const jsonMatch = eventData.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            
            // Fallback: create simple event from text
            return {
                type: 'narrative_event',
                description: eventData,
                narrative: eventData,
                timestamp: Date.now()
            };
        } catch (error) {
            this.logger.error('Failed to parse event response:', error);
            return null;
        }
    }
    
    _summarizePersonality(personality) {
        if (!personality) return 'unknown';
        
        const traits = [];
        if (personality.friendliness > 60) traits.push('friendly');
        if (personality.friendliness < 40) traits.push('reserved');
        if (personality.intelligence > 70) traits.push('intelligent');
        if (personality.caution > 70) traits.push('cautious');
        if (personality.honor > 70) traits.push('honorable');
        if (personality.greed > 70) traits.push('greedy');
        if (personality.aggression > 60) traits.push('aggressive');
        
        return traits.join(', ') || 'neutral';
    }
    
    _determineStoryBeatType(gameState) {
        const types = ['introduction', 'challenge', 'revelation', 'confrontation', 'resolution'];
        return types[Math.min(this.currentAct - 1, types.length - 1)];
    }
    
    _generateStoryBeatDescription(gameState) {
        const descriptions = {
            1: 'Player is learning about the world and meeting key NPCs',
            2: 'Conflicts and challenges are emerging',
            3: 'Major confrontations and revelations occur'
        };
        
        return descriptions[this.currentAct] || 'Story progresses';
    }
    
    _calculateActionDensity(gameState) {
        // Calculate how many actions happened in recent time
        const recentActions = this.playerActions.filter(a => 
            Date.now() - a.timestamp < 60000 // Last minute
        );
        
        return Math.min(recentActions.length / 10, 1.0);
    }
    
    _getFallbackNarration(context) {
        const fallbacks = {
            'tavern': 'The warm glow of the tavern welcomes you. Voices murmur in quiet conversation.',
            'town_square': 'The town square bustles with daily activity. Villagers go about their business.',
            'forge': 'The heat from the forge washes over you. The sound of hammer on anvil rings out.',
            'temple': 'A sense of peace fills the temple. Light filters through stained glass windows.'
        };
        
        return fallbacks[context.location] || 'You find yourself in a new location.';
    }
    
    _getFallbackAtmosphere(moment) {
        if (moment.mood === 'tense') {
            return 'The air feels heavy with unspoken tension.';
        } else if (moment.mood === 'peaceful') {
            return 'A sense of calm pervades the moment.';
        }
        return 'The moment passes quietly.';
    }

    _getFallbackDialogueNarration(npc, context) {
        const timeOfDayDesc = {
            'morning': 'in the morning light',
            'afternoon': 'in the afternoon',
            'evening': 'in the evening glow',
            'night': 'in the moonlight'
        };

        const desc = timeOfDayDesc[context.timeOfDay] || '';
        return `${npc.name} looks up as you approach ${desc}. They seem ready to talk.`;
    }
    
    // ============ Public API ============
    
    /**
     * Get current narrative context
     */
    getNarrativeContext() {
        return {
            currentAct: this.currentAct,
            recentNarration: this.narrativeMemory.slice(-5),
            storyBeats: this.storyBeats,
            activeEvents: this.activeEvents
        };
    }
    
    /**
     * Set GM configuration
     */
    configure(config) {
        if (config.narrationFrequency) {
            this.narrationFrequency = config.narrationFrequency;
        }
        if (config.eventGenerationEnabled !== undefined) {
            this.eventGenerationEnabled = config.eventGenerationEnabled;
        }
        if (config.storyArcTracking !== undefined) {
            this.storyArcTracking = config.storyArcTracking;
        }
        
        this.logger.info('GM configuration updated', config);
    }
    
    /**
     * Reset GM state (for new game)
     */
    reset() {
        this.narrativeMemory = [];
        this.currentAct = 1;
        this.storyBeats = [];
        this.playerActions = [];
        this.npcInteractions = [];
        this.activeEvents = [];
        this.lastNarration = null;
        
        this.logger.info('Game Master state reset');
    }
}
