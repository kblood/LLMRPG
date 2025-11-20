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
     * Generate opening narration for the game start
     */
    async generateOpeningNarration(player, world, options = {}) {
        this.logger.info('Generating opening narration for game start');

        const prompt = `You are ${this.personality.name}, the narrator of an epic RPG adventure.

The story begins with ${player.name}, ${player.backstory}

Setting:
- The village of Millhaven, a quiet settlement nestled in rolling hills
- Time: ${options.timeOfDay || 'late afternoon'}
- Season: ${options.season || 'early autumn'}

The protagonist's journey:
${player.name} has traveled for days to reach this village, drawn by rumors and whispers. The roads have been long, and the weight of purpose grows heavier with each step.

Personality hints: ${this._summarizePersonality(player.personality)}

Generate an atmospheric opening narration (3-5 paragraphs) that:
1. Describes ${player.name} approaching the village from a distance
2. Hints at their inner motivations and what drives them forward
3. Sets a mysterious and atmospheric tone
4. Introduces Millhaven and its appearance
5. Creates anticipation for what lies ahead
6. Ends with ${player.name} entering the village proper

Make it evocative, mysterious, and compelling. This is the beginning of an epic tale.

Opening Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 500,
                systemPrompt: this._getGMSystemPrompt()
            });

            this.logger.info('Generated opening narration');

            // Store in narrative memory
            this.narrativeMemory.push({
                text: narration,
                context: { type: 'opening', player: player.name },
                timestamp: Date.now()
            });

            return narration;
        } catch (error) {
            this.logger.error('Failed to generate opening narration:', error);
            return this._getFallbackOpeningNarration(player);
        }
    }

    /**
     * Generate the world map with locations
     */
    async generateWorld(player, options = {}) {
        this.logger.info('Generating world locations');

        const prompt = `You are ${this.personality.name}, creating the world for this RPG adventure.

Protagonist: ${player.name}, ${player.backstory}

Starting location: Millhaven - a quiet village nestled in rolling hills

Create a living, breathing world with:
1. 3-4 additional cities/towns (each with distinct character and culture)
2. 4-6 dungeons/ruins (varying difficulty and mystery)
3. 3-4 natural landmarks (forests, mountains, lakes, etc.)
4. 2-3 mysterious/special locations (temples, towers, crossroads, etc.)

Each location should:
- Have a unique name and atmosphere
- Feel connected to the overall world
- Provide opportunities for quests and exploration
- Be suitable for different character interactions

Format your response as JSON:
{
  "cities": [
    {
      "name": "City name",
      "description": "2-3 sentence description",
      "atmosphere": "bustling|quiet|mysterious|industrial|etc",
      "population": "small|medium|large",
      "notable": "What makes this place special",
      "distance_from_millhaven": "close|moderate|far"
    }
  ],
  "dungeons": [
    {
      "name": "Dungeon name",
      "type": "ruins|cave|crypt|fortress|mine|etc",
      "description": "2-3 sentence description",
      "danger_level": "low|medium|high|deadly",
      "rumored_treasure": "What might be found here",
      "history": "Brief history or legend"
    }
  ],
  "landmarks": [
    {
      "name": "Landmark name",
      "type": "forest|mountain|lake|plains|etc",
      "description": "2-3 sentence description",
      "significance": "Why this place matters",
      "dangers": "What threats exist here"
    }
  ],
  "special_locations": [
    {
      "name": "Location name",
      "type": "temple|tower|shrine|crossroads|etc",
      "description": "2-3 sentence description",
      "mystery": "What secrets or questions surround this place",
      "access": "easy|moderate|difficult|restricted"
    }
  ]
}`;

        try {
            const response = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 1200,
                systemPrompt: this._getGMSystemPrompt()
            });

            // Parse JSON response
            const world = this._parseWorldResponse(response);

            if (world) {
                this.logger.info(`Generated world with ${world.cities?.length || 0} cities, ${world.dungeons?.length || 0} dungeons`);

                // Store in narrative context
                this.narrativeContext.world = world;

                return world;
            } else {
                return this._getFallbackWorld(player);
            }
        } catch (error) {
            this.logger.error('Failed to generate world:', error);
            return this._getFallbackWorld(player);
        }
    }

    /**
     * Generate a main quest for the player
     */
    async generateMainQuest(player, world, options = {}) {
        this.logger.info('Generating main quest');

        // Build location context from world
        const locationContext = world ? `

Available Locations in the World:
Cities: ${world.cities?.map(c => c.name).join(', ') || 'none'}
Dungeons: ${world.dungeons?.map(d => `${d.name} (${d.type})`).join(', ') || 'none'}
Landmarks: ${world.landmarks?.map(l => `${l.name} (${l.type})`).join(', ') || 'none'}
Special Locations: ${world.special_locations?.map(s => `${s.name} (${s.type})`).join(', ') || 'none'}

You can reference these locations in the quest stages and objectives.
` : '';

        const prompt = `You are ${this.personality.name}, creating the main quest for this RPG adventure.

Protagonist: ${player.name}, ${player.backstory}
Personality: ${this._summarizePersonality(player.personality)}

Setting: The village of Millhaven and surrounding lands${locationContext}

Create a compelling main quest that:
1. Feels personal and meaningful to ${player.name}
2. Involves mystery, exploration, and social interaction
3. Requires speaking with multiple NPCs to uncover the truth
4. Hints at something ancient or forgotten
5. Has multiple stages that will unfold naturally
6. Introduces 2-3 key locations beyond the village

Format your response as JSON:
{
  "title": "Quest title",
  "description": "Full quest description that the player understands",
  "motivation": "Why ${player.name} cares about this quest",
  "stages": [
    {
      "id": "stage_1",
      "title": "Stage title",
      "description": "What must be done",
      "objectives": ["objective 1", "objective 2"]
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "description": "Brief description",
      "type": "ruins|forest|cave|mountain|etc"
    }
  ],
  "rewards": {
    "gold": 100,
    "experience": 1000,
    "items": ["potential reward 1"],
    "narrative": "Story impact of completing quest"
  }
}`;

        try {
            const response = await this.ollama.generate(prompt, {
                temperature: 0.8,
                maxTokens: 600,
                systemPrompt: this._getGMSystemPrompt()
            });

            // Parse JSON response
            const quest = this._parseQuestResponse(response);

            if (quest) {
                this.logger.info(`Generated main quest: ${quest.title}`);
                return quest;
            } else {
                return this._getFallbackMainQuest(player);
            }
        } catch (error) {
            this.logger.error('Failed to generate main quest:', error);
            return this._getFallbackMainQuest(player);
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
     * Generate a narrative transition between conversations/actions
     * Creates smooth scene transitions that explain what happens between actions
     *
     * @param {Object} fromAction - Previous action/conversation data
     * @param {Object} toAction - Next action/conversation data
     * @param {number} timeDelta - Time passed in minutes
     * @returns {Promise<string>} Transition narration
     */
    async generateTransition(fromAction, toAction, timeDelta) {
        this.logger.info(`Generating transition from ${fromAction?.npcName || 'start'} to ${toAction?.npcName || 'end'}`);

        // Calculate time description
        let timeDescription = '';
        if (timeDelta < 5) {
            timeDescription = 'A few moments later';
        } else if (timeDelta < 15) {
            timeDescription = 'Shortly afterward';
        } else if (timeDelta < 30) {
            timeDescription = 'Some time passes';
        } else if (timeDelta < 60) {
            timeDescription = 'Nearly an hour later';
        } else if (timeDelta < 120) {
            timeDescription = 'Over an hour passes';
        } else {
            const hours = Math.floor(timeDelta / 60);
            timeDescription = `Several hours later (${hours} hours)`;
        }

        const prompt = `You are ${this.personality.name}, the narrator of this RPG. Create a smooth narrative transition between two scenes.

Previous Scene:
${fromAction ? `- Just finished talking with ${fromAction.npcName} (${fromAction.npcRole})
- Conversation topics: ${fromAction.topics || 'general discussion'}
- How it ended: ${fromAction.endReason || 'naturally concluded'}` : '- The journey begins'}

Time Passed: ${timeDescription} (${timeDelta} minutes)
Time of Day Now: ${toAction.timeOfDay || 'unknown'}

Next Scene:
- About to approach ${toAction.npcName} (${toAction.npcRole})
- Location: ${toAction.location || 'the village'}

Write a 2-3 sentence transition that:
1. Briefly mentions why the previous conversation ended (if applicable)
2. Describes what ${toAction.playerName || 'the protagonist'} does in between (walking, thinking, observing)
3. Explains what draws them toward ${toAction.npcName} next
4. Includes the time passage naturally ("${timeDescription}...")
5. Creates a sense of continuous narrative flow

Keep it atmospheric and immersive. Focus on the protagonist's internal thoughts or external observations.

Transition:`;

        try {
            const transition = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 200,
                systemPrompt: this._getGMSystemPrompt()
            });

            this.logger.debug('Generated transition narration');

            // Store in narrative memory
            this.narrativeMemory.push({
                text: transition,
                context: { type: 'transition', from: fromAction?.npcName, to: toAction?.npcName },
                timestamp: Date.now()
            });

            return transition;
        } catch (error) {
            this.logger.error('Failed to generate transition:', error);
            return this._getFallbackTransition(fromAction, toAction, timeDescription);
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

    _parseQuestResponse(questData) {
        try {
            // Try to parse as JSON
            const jsonMatch = questData.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const quest = JSON.parse(jsonMatch[0]);
                quest.id = `quest_${Date.now()}`;
                quest.status = 'active';
                quest.createdAt = Date.now();
                return quest;
            }
            return null;
        } catch (error) {
            this.logger.error('Failed to parse quest response:', error);
            return null;
        }
    }

    _parseWorldResponse(worldData) {
        try {
            // Try to parse as JSON
            const jsonMatch = worldData.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const world = JSON.parse(jsonMatch[0]);

                // Add Millhaven as the starting city if not included
                if (!world.cities) world.cities = [];
                const hasMillhaven = world.cities.some(c => c.name.toLowerCase().includes('millhaven'));
                if (!hasMillhaven) {
                    world.cities.unshift({
                        name: "Millhaven",
                        description: "A quiet village nestled in rolling hills, known for its peaceful atmosphere and tight-knit community.",
                        atmosphere: "peaceful",
                        population: "small",
                        notable: "The starting point of your journey",
                        distance_from_millhaven: "here"
                    });
                }

                return world;
            }
            return null;
        } catch (error) {
            this.logger.error('Failed to parse world response:', error);
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

    _getFallbackTransition(fromAction, toAction, timeDescription) {
        if (!fromAction) {
            return `${timeDescription}, you make your way through the village. Ahead, you notice ${toAction.npcName} and decide to approach them.`;
        }

        return `${timeDescription}, after parting ways with ${fromAction.npcName}. You continue through the village, your thoughts lingering on the conversation. Soon, you spot ${toAction.npcName} and feel drawn to speak with them.`;
    }

    _getFallbackOpeningNarration(player) {
        return `The road stretches behind ${player.name}, dust settling in the fading light of day. For weeks, whispers and rumors have drawn them forward—tales of something ancient stirring in the quiet village of Millhaven.

As the settlement comes into view, nestled in rolling hills like a secret kept from the wider world, ${player.name} pauses. Smoke rises from chimneys, and the warm glow of lanterns begins to flicker to life. It looks peaceful, almost too peaceful, but beneath that tranquility, there's a tension in the air—a sense that this place holds more than it shows.

${player.name} adjusts their pack and continues forward, each step carrying them deeper into whatever fate awaits. The village gates stand open, welcoming yet somehow watchful. This is where the journey truly begins.`;
    }

    _getFallbackWorld(player) {
        return {
            cities: [
                {
                    name: "Millhaven",
                    description: "A quiet village nestled in rolling hills, known for its peaceful atmosphere and tight-knit community.",
                    atmosphere: "peaceful",
                    population: "small",
                    notable: "The starting point of your journey",
                    distance_from_millhaven: "here"
                },
                {
                    name: "Riverside",
                    description: "A bustling trading town along the Silver River. Merchants from all over come to sell their wares. The sound of haggling fills the air from dawn to dusk.",
                    atmosphere: "bustling",
                    population: "medium",
                    notable: "Major trading hub with diverse goods and information",
                    distance_from_millhaven: "moderate"
                },
                {
                    name: "Ironhold",
                    description: "A fortified mining city built into the mountainside. The constant clanging of hammers and smell of forge-fire define this industrial settlement.",
                    atmosphere: "industrial",
                    population: "large",
                    notable: "Finest metalwork in the region, strong military presence",
                    distance_from_millhaven: "far"
                },
                {
                    name: "Moonvale",
                    description: "A mysterious village shrouded in perpetual mist. Locals are secretive and wary of outsiders, speaking in hushed tones about ancient traditions.",
                    atmosphere: "mysterious",
                    population: "small",
                    notable: "Strange rituals and deep connection to the old ways",
                    distance_from_millhaven: "moderate"
                }
            ],
            dungeons: [
                {
                    name: "The Sunken Crypts",
                    type: "crypt",
                    description: "Ancient burial chambers that collapsed into underground caverns centuries ago. Water drips through cracked ceilings, and strange echoes suggest something still dwells below.",
                    danger_level: "medium",
                    rumored_treasure: "Artifacts from the old kingdom, possibly cursed",
                    history: "Built during the First Age to honor fallen heroes, now abandoned and feared"
                },
                {
                    name: "Blackstone Mines",
                    type: "mine",
                    description: "Abandoned iron mines where workers reported hearing voices in the darkness. No one has returned from the deepest shafts in years.",
                    danger_level: "high",
                    rumored_treasure: "Rich veins of rare ore, possibly something more valuable",
                    history: "Closed 20 years ago after mysterious disappearances"
                },
                {
                    name: "The Shattered Tower",
                    type: "ruins",
                    description: "The remains of an ancient wizard's tower, broken in half by some cataclysmic force. Magical energy still crackles around the rubble.",
                    danger_level: "deadly",
                    rumored_treasure: "Powerful magical artifacts and forbidden knowledge",
                    history: "Tower of the Archmage Valdris, destroyed in the Mage Wars"
                },
                {
                    name: "Howling Caverns",
                    type: "cave",
                    description: "Natural cave system where the wind creates an eerie howling sound. Local hunters report seeing strange lights deep within.",
                    danger_level: "low",
                    rumored_treasure: "Crystal formations worth a fortune",
                    history: "Used by bandits in the past, now home to unknown creatures"
                },
                {
                    name: "Fort Greywatch",
                    type: "fortress",
                    description: "A ruined military fortress on the border. Once a mighty stronghold, now overrun by creatures and claimed by nature.",
                    danger_level: "medium",
                    rumored_treasure: "The fortress armory, if it can be found",
                    history: "Fell during the Border Wars, garrison never heard from again"
                }
            ],
            landmarks: [
                {
                    name: "The Thornwood",
                    type: "forest",
                    description: "A dense, dark forest where thorned vines grow thick and wild. Strange sounds echo through the trees at night, and travelers report feeling watched.",
                    significance: "Ancient druidic site, natural barrier between kingdoms",
                    dangers: "Wild beasts, poisonous plants, possible bandits"
                },
                {
                    name: "Mount Sentinel",
                    type: "mountain",
                    description: "The tallest peak in the region, perpetually crowned with snow. From its summit, they say you can see for a hundred miles.",
                    significance: "Sacred to mountain-dwelling tribes, site of ancient shrines",
                    dangers: "Harsh weather, dangerous climbing, territorial creatures"
                },
                {
                    name: "The Mirrorwater Lake",
                    type: "lake",
                    description: "A perfectly still lake that reflects the sky like polished glass. The water is unnaturally clear, and some say visions appear in its depths.",
                    significance: "Source of local legends, possible magical properties",
                    dangers: "Deep cold waters, strange phenomena reported"
                },
                {
                    name: "The Grey Moors",
                    type: "plains",
                    description: "Vast moorlands shrouded in grey mist. Stone circles dot the landscape, remnants of a civilization lost to time.",
                    significance: "Ancient battleground, burial site of old kings",
                    dangers: "Easy to get lost, spirits said to wander at night"
                }
            ],
            special_locations: [
                {
                    name: "The Crossroads Shrine",
                    type: "shrine",
                    description: "An ancient stone shrine at the meeting of four roads. Travelers leave offerings for safe passage, and the shrine never goes empty.",
                    mystery: "Who maintains the shrine? Why do offerings disappear overnight?",
                    access: "easy"
                },
                {
                    name: "The Singing Stones",
                    type: "monument",
                    description: "A circle of standing stones that hum with a low frequency when the wind blows. The sound is said to drive men mad or grant visions, depending on who you ask.",
                    mystery: "What force animates the stones? What do the tones mean?",
                    access: "moderate"
                },
                {
                    name: "The Veiled Temple",
                    type: "temple",
                    description: "A temple to forgotten gods, hidden in the Thornwood. Only those deemed worthy can find the path, or so the legends claim.",
                    mystery: "What gods were worshipped here? Do they still answer prayers?",
                    access: "difficult"
                }
            ]
        };
    }

    _getFallbackMainQuest(player) {
        return {
            id: `quest_${Date.now()}`,
            title: "Echoes of the Forgotten",
            description: "Strange occurrences have plagued Millhaven in recent weeks. Dreams of ancient voices, missing memories, and whispers of something buried beneath the village. The locals are worried but tight-lipped. You must uncover the truth.",
            motivation: `${player.name} has heard the rumors from afar and feels an inexplicable pull toward Millhaven, as if this mystery is somehow tied to their own purpose.`,
            status: 'active',
            stages: [
                {
                    id: "stage_1",
                    title: "Speak with the Villagers",
                    description: "Talk to the people of Millhaven to learn about the strange occurrences",
                    objectives: [
                        "Speak with at least 3 different villagers",
                        "Learn about the dreams and missing memories",
                        "Find someone who knows about the village's history"
                    ]
                },
                {
                    id: "stage_2",
                    title: "Uncover the Past",
                    description: "Investigate the history of Millhaven and what lies beneath",
                    objectives: [
                        "Find records or stories about the village's founding",
                        "Locate the source of the disturbances"
                    ]
                }
            ],
            locations: [
                {
                    name: "The Old Temple Ruins",
                    description: "Ancient ruins on the hillside above Millhaven, said to predate the village itself",
                    type: "ruins"
                },
                {
                    name: "The Whispering Woods",
                    description: "A dark forest to the east where strange sounds have been heard at night",
                    type: "forest"
                }
            ],
            rewards: {
                gold: 150,
                experience: 1000,
                items: ["Ancient Medallion"],
                narrative: "Uncovering the truth will reveal the ancient history of Millhaven and your connection to it"
            },
            createdAt: Date.now()
        };
    }

    // ============ Action Narration Methods ============

    /**
     * Generate narration for investigation action
     */
    async generateInvestigationNarration(protagonist, location, context = {}) {
        this.logger.info(`Generating investigation narration for ${location}`);

        const prompt = `You are ${this.personality.name}, the narrator of this RPG.

${protagonist.name} is investigating ${location}.

Context:
- Time of Day: ${context.timeOfDay || 'unknown'}
- Weather: ${context.weather || 'clear'}
- Reason: ${context.reason || 'exploring the area'}
${context.activeQuest ? `- Active Quest: ${context.activeQuest.title}` : ''}

Provide a vivid narration (2-4 sentences) describing:
1. What ${protagonist.name} sees as they investigate
2. Any interesting details about the location
3. The atmosphere and mood of the moment
4. Subtle hints or clues they might discover

Make it atmospheric and immersive. Keep it relevant to their quest if they have one.

Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 200,
                systemPrompt: this._getGMSystemPrompt()
            });

            return narration;
        } catch (error) {
            this.logger.error('Failed to generate investigation narration:', error);
            return this._getFallbackInvestigationNarration(protagonist, location, context);
        }
    }

    /**
     * Generate narration for search action
     */
    async generateSearchNarration(protagonist, location, context = {}) {
        this.logger.info(`Generating search narration for ${location}`);

        const prompt = `You are ${this.personality.name}, the narrator of this RPG.

${protagonist.name} is carefully searching ${location}.

Context:
- Time of Day: ${context.timeOfDay || 'unknown'}
- Weather: ${context.weather || 'clear'}
- Reason: ${context.reason || 'looking for items or clues'}

Provide a narration (2-3 sentences) describing:
1. How ${protagonist.name} searches the area
2. What they examine and where they look
3. The thoroughness of their search
4. Whether they find anything interesting (be subtle)

Make it feel methodical and purposeful.

Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.8,
                maxTokens: 150,
                systemPrompt: this._getGMSystemPrompt()
            });

            return narration;
        } catch (error) {
            this.logger.error('Failed to generate search narration:', error);
            return this._getFallbackSearchNarration(protagonist, location, context);
        }
    }

    /**
     * Generate narration for rest action
     */
    async generateRestNarration(protagonist, location, context = {}) {
        this.logger.info(`Generating rest narration for ${location}`);

        const prompt = `You are ${this.personality.name}, the narrator of this RPG.

${protagonist.name} is taking time to rest in ${location}.

Context:
- Time of Day: ${context.timeOfDay || 'unknown'}
- Weather: ${context.weather || 'clear'}
- Reason: ${context.reason || 'recovering energy'}

Provide a peaceful narration (2-3 sentences) describing:
1. Where ${protagonist.name} finds to rest
2. The act of resting and recovering
3. Their thoughts or reflections during this quiet moment
4. The sense of restoration and renewal

Make it calm and restorative.

Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.75,
                maxTokens: 150,
                systemPrompt: this._getGMSystemPrompt()
            });

            return narration;
        } catch (error) {
            this.logger.error('Failed to generate rest narration:', error);
            return this._getFallbackRestNarration(protagonist, location, context);
        }
    }

    /**
     * Generate narration for trade action
     */
    async generateTradeNarration(protagonist, location, context = {}) {
        this.logger.info(`Generating trade narration for ${location}`);

        const merchantName = context.merchant?.name || 'a local merchant';

        const prompt = `You are ${this.personality.name}, the narrator of this RPG.

${protagonist.name} is engaging in trade with ${merchantName} in ${location}.

Context:
- Time of Day: ${context.timeOfDay || 'unknown'}
- Reason: ${context.reason || 'buying or selling goods'}

Provide a narration (2-3 sentences) describing:
1. The merchant and their wares
2. The haggling or negotiation process
3. The atmosphere of the trade

Make it feel commercial and transactional but with personality.

Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.8,
                maxTokens: 150,
                systemPrompt: this._getGMSystemPrompt()
            });

            return narration;
        } catch (error) {
            this.logger.error('Failed to generate trade narration:', error);
            return this._getFallbackTradeNarration(protagonist, location, context);
        }
    }

    /**
     * Generate narration for travel action
     */
    async generateTravelNarration(protagonist, destination, context = {}) {
        this.logger.info(`Generating travel narration to ${destination}`);

        const prompt = `You are ${this.personality.name}, the narrator of this RPG.

${protagonist.name} is traveling to ${destination}.

Context:
- Time of Day: ${context.timeOfDay || 'unknown'}
- Weather: ${context.weather || 'clear'}
- Reason: ${context.reason || 'journeying to a new location'}

Provide a narration (2-4 sentences) describing:
1. The journey and the landscape they pass through
2. The distance and time it takes
3. Any encounters or sights along the way
4. Their arrival at the destination

Make it feel like an epic journey, even if short.

Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 200,
                systemPrompt: this._getGMSystemPrompt()
            });

            return narration;
        } catch (error) {
            this.logger.error('Failed to generate travel narration:', error);
            return this._getFallbackTravelNarration(protagonist, destination, context);
        }
    }

    // ============ Fallback Narrations for Actions ============

    _getFallbackInvestigationNarration(protagonist, location, context) {
        const timeDesc = {
            morning: 'in the morning light',
            afternoon: 'in the afternoon sun',
            evening: 'in the fading evening light',
            night: 'under the moonlight'
        };

        const desc = timeDesc[context.timeOfDay] || '';
        return `${protagonist.name} carefully examines ${location} ${desc}, looking for anything of interest. The details of the surroundings reveal themselves slowly, each corner holding potential secrets. Nothing escapes their careful scrutiny.`;
    }

    _getFallbackSearchNarration(protagonist, location, context) {
        return `${protagonist.name} methodically searches ${location}, checking every nook and corner. Their hands move with practiced care, lifting, probing, and examining. The search is thorough and deliberate.`;
    }

    _getFallbackRestNarration(protagonist, location, context) {
        return `${protagonist.name} finds a quiet spot in ${location} to rest. As they settle down, the tension of the journey begins to ease. A moment of peace washes over them, restoring body and spirit.`;
    }

    _getFallbackTradeNarration(protagonist, location, context) {
        return `${protagonist.name} approaches a merchant in ${location}. The exchange of goods and coin follows the familiar rhythm of commerce. Business is conducted with efficiency and mutual respect.`;
    }

    _getFallbackTravelNarration(protagonist, destination, context) {
        return `${protagonist.name} sets out on the road toward ${destination}. The journey passes through familiar countryside, each step bringing them closer to their goal. Time and distance fall away beneath determined feet.`;
    }

    // ============ Combat Narration Methods ============

    /**
     * Generate narration for combat start
     */
    async generateCombatStartNarration(protagonist, enemies, encounterData = {}) {
        this.logger.info('Generating combat start narration');

        const enemyNames = enemies.length === 1
            ? enemies[0].name
            : enemies.length === 2
            ? `${enemies[0].name} and ${enemies[1].name}`
            : `${enemies.length} enemies`;

        const prompt = `You are ${this.personality.name}, the narrator of this RPG.

${protagonist.name} has encountered ${enemyNames} in combat!

Encounter Type: ${encounterData.encounterType || 'chance_encounter'}
Location: ${encounterData.location?.name || 'unknown location'}
Time of Day: ${encounterData.timeOfDay || 'unknown'}

Enemy Details:
${enemies.map(e => `- ${e.name}: ${e.backstory || 'A hostile creature'}`).join('\n')}

Context:
${encounterData.description || `${protagonist.name} faces ${enemyNames} in battle!`}

Provide a dramatic, atmospheric narration (3-4 sentences) that:
1. Describes the moment combat begins
2. Sets the tension and stakes
3. Describes the enemies' appearance and demeanor
4. Creates excitement for the battle ahead

Make it cinematic and intense!

Combat Start Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 200,
                systemPrompt: this._getGMSystemPrompt()
            });

            return narration;
        } catch (error) {
            this.logger.error('Failed to generate combat start narration:', error);
            return this._getFallbackCombatStartNarration(protagonist, enemies, encounterData);
        }
    }

    /**
     * Generate narration for a combat round
     */
    async generateCombatRoundNarration(roundNumber, actions, results) {
        this.logger.info(`Generating combat round ${roundNumber} narration`);

        const prompt = `You are ${this.personality.name}, the narrator of this RPG combat.

Round ${roundNumber} of combat has just occurred.

Actions taken:
${actions.map(a => `- ${a.character} used ${a.action}${a.target ? ` on ${a.target}` : ''}`).join('\n')}

Results:
${results.map(r => {
    const result = r.result;
    if (result.hit !== undefined) {
        if (result.hit) {
            return `- ${r.character}'s attack ${result.critical ? 'CRITICALLY ' : ''}hits for ${result.damage} damage!`;
        } else {
            return `- ${r.character}'s attack misses!`;
        }
    } else if (result.message) {
        return `- ${result.message}`;
    }
    return `- ${r.character} acted`;
}).join('\n')}

Provide a brief, exciting narration (2-3 sentences) that:
1. Summarizes the key moments of this round
2. Maintains combat tension and energy
3. Focuses on the most dramatic action
4. Keeps the pace quick and engaging

Round Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 150,
                systemPrompt: this._getGMSystemPrompt()
            });

            return narration;
        } catch (error) {
            this.logger.error('Failed to generate combat round narration:', error);
            return this._getFallbackCombatRoundNarration(roundNumber, actions, results);
        }
    }

    /**
     * Generate narration for combat end
     */
    async generateCombatEndNarration(protagonist, outcome, combatData = {}) {
        this.logger.info(`Generating combat end narration (${outcome})`);

        const outcomeDesc = {
            victory: `${protagonist.name} emerges victorious`,
            defeat: `${protagonist.name} falls in battle`,
            fled: `${protagonist.name} flees from combat`,
            timeout: `The battle reaches a stalemate`
        }[outcome] || `Combat ends`;

        const prompt = `You are ${this.personality.name}, the narrator of this RPG.

Combat has ended: ${outcomeDesc}

Battle Details:
- Rounds: ${combatData.rounds || 'several'}
- Outcome: ${outcome}

Provide a dramatic conclusion narration (2-4 sentences) that:
1. Describes how the combat ended
2. Captures the emotional weight of ${outcome}
3. ${outcome === 'victory' ? 'Celebrates the triumph' : outcome === 'defeat' ? 'Acknowledges the loss with hope for recovery' : 'Describes the resolution'}
4. Transitions back to the story

Make it ${outcome === 'victory' ? 'triumphant' : outcome === 'defeat' ? 'somber but hopeful' : 'reflective'}!

Combat End Narration:`;

        try {
            const narration = await this.ollama.generate(prompt, {
                temperature: 0.85,
                maxTokens: 200,
                systemPrompt: this._getGMSystemPrompt()
            });

            return narration;
        } catch (error) {
            this.logger.error('Failed to generate combat end narration:', error);
            return this._getFallbackCombatEndNarration(protagonist, outcome, combatData);
        }
    }

    // ============ Fallback Combat Narrations ============

    _getFallbackCombatStartNarration(protagonist, enemies, encounterData) {
        const enemyNames = enemies.length === 1
            ? `a ${enemies[0].name}`
            : `${enemies.length} enemies`;

        return `${protagonist.name} finds themselves face to face with ${enemyNames}! The air crackles with tension as weapons are drawn. There is no avoiding this confrontation. Battle is joined!`;
    }

    _getFallbackCombatRoundNarration(roundNumber, actions, results) {
        return `Round ${roundNumber} of combat rages on. Blows are exchanged, each combatant seeking advantage. The battle's outcome remains uncertain.`;
    }

    _getFallbackCombatEndNarration(protagonist, outcome, combatData) {
        const endings = {
            victory: `${protagonist.name} stands victorious over their foes! The battle is won, though not without cost. The path forward is clear once more.`,
            defeat: `${protagonist.name} falls to the ground, consciousness fading. The battle is lost, but this is not the end. They will rise again.`,
            fled: `${protagonist.name} breaks away from combat, escaping to safety. Sometimes discretion is the better part of valor.`,
            timeout: `The battle drags on inconclusively. Both sides disengage, exhausted. Another day, another fight.`
        };

        return endings[outcome] || `Combat comes to an end. ${protagonist.name} continues their journey.`;
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
