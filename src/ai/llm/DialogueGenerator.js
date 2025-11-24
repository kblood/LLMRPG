import { PromptBuilder } from './PromptBuilder.js';
import { ResponseParser } from './ResponseParser.js';
import { OllamaService } from '../../services/OllamaService.js';
import { SeedManager } from '../../services/SeedManager.js';
import { ReplayLogger } from '../../replay/ReplayLogger.js';

/**
 * Dialogue Generator
 * High-level API for generating character dialogue
 * 
 * @class DialogueGenerator
 */
export class DialogueGenerator {
  constructor(options = {}) {
    this.ollama = options.ollama || OllamaService.getInstance();
    this.seedManager = options.seedManager || new SeedManager();
    this.promptBuilder = options.promptBuilder || new PromptBuilder();
    this.responseParser = options.responseParser || new ResponseParser();
    
    this.defaultModel = options.model || 'granite4:3b';
    this.defaultTemperature = options.temperature || 0.8;
  }

  /**
   * Generate a greeting from one character to another
   * @param {Character} speaker - Character speaking
   * @param {Character} listener - Character being greeted
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} { text, seed, valid }
   */
  async generateGreeting(speaker, listener, context = {}) {
    const prompt = this.promptBuilder.buildGreetingPrompt(speaker, listener, context);
    const seed = this.seedManager.getNextSeed(speaker.id, 'greeting', context.frame || 0);

    try {
      const response = await this.ollama.generate(prompt, {
        model: context.model || this.defaultModel,
        temperature: context.temperature || this.defaultTemperature,
        seed,
        fallback: this.getFallbackGreeting(speaker, listener)
      });

      // Log LLM call to replay system
      const replayLogger = ReplayLogger.instance;
      if (replayLogger) {
        replayLogger.logLLMCall({
          frame: context.frame || 0,
          characterId: speaker.id,
          prompt: prompt.substring(0, 200), // Truncate for storage
          response: response.substring(0, 200),
          tokensUsed: response.length // Approximation
        });
      }

      const parsed = this.responseParser.parseDialogue(response, { allowLong: false });

      return {
        text: parsed.text,
        seed,
        valid: parsed.valid,
        issues: parsed.issues
      };
    } catch (error) {
      console.error('Error generating greeting:', error);
      
      const fallbackText = this.getFallbackGreeting(speaker, listener);
      
      // Log fallback usage
      this.fallbackLogger.logFallback({
        system: 'DialogueGenerator',
        operation: 'greeting',
        reason: 'LLM_ERROR',
        fallbackValue: fallbackText,
        context: {
          speaker: speaker.name,
          listener: listener?.name,
          friendliness: speaker.personality.friendliness,
          relationship: speaker.relationships.getRelationship(listener?.id)
        },
        error: error
      });
      
      return {
        text: fallbackText,
        seed,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a dialogue response
   * @param {Character} speaker - Character speaking
   * @param {Character} listener - Character being spoken to
   * @param {string} input - What was said to the speaker
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} { text, seed, valid }
   */
  async generateResponse(speaker, listener, input, context = {}) {
    const prompt = this.promptBuilder.buildDialoguePrompt(speaker, listener, {
      ...context,
      input
    });
    
    const seed = this.seedManager.getNextSeed(speaker.id, 'dialogue', context.frame || 0);

    try {
      const response = await this.ollama.generate(prompt, {
        model: context.model || this.defaultModel,
        temperature: context.temperature || this.defaultTemperature,
        seed,
        fallback: this.getFallbackResponse(speaker)
      });

      // Log LLM call to replay system
      const replayLogger = ReplayLogger.instance;
      if (replayLogger) {
        replayLogger.logLLMCall({
          frame: context.frame || 0,
          characterId: speaker.id,
          prompt: prompt.substring(0, 200), // Truncate for storage
          response: response.substring(0, 200),
          tokensUsed: response.length // Approximation
        });
      }

      const parsed = this.responseParser.parseDialogue(response, {
        allowLong: context.allowLong || false
      });

      // Add memory of this conversation
      if (parsed.valid && context.rememberConversation !== false) {
        speaker.memory.addMemory('dialogue', `Said to ${listener.name}: "${parsed.text}"`, {
          participants: [listener.id],
          importance: 40
        });
      }

      return {
        text: parsed.text,
        seed,
        valid: parsed.valid,
        issues: parsed.issues
      };
    } catch (error) {
      console.error('Error generating response:', error);
      
      const fallbackText = this.getFallbackResponse(speaker);
      
      // Log fallback usage
      this.fallbackLogger.logFallback({
        system: 'DialogueGenerator',
        operation: 'response',
        reason: 'LLM_ERROR',
        fallbackValue: fallbackText,
        context: {
          speaker: speaker.name,
          friendliness: speaker.personality.friendliness,
          playerSaid: context.playerSaid?.substring(0, 50)
        },
        error: error
      });
      
      return {
        text: fallbackText,
        seed,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate an internal thought for a character
   * @param {Character} character - Character thinking
   * @param {Object} context - Context for the thought
   * @returns {Promise<Object>} { text, seed, valid }
   */
  async generateThought(character, context = {}) {
    const prompt = this.promptBuilder.buildThoughtPrompt(character, context);
    const seed = this.seedManager.getNextSeed(character.id, 'thought', context.frame || 0);

    try {
      const response = await this.ollama.generate(prompt, {
        model: context.model || this.defaultModel,
        temperature: context.temperature || this.defaultTemperature,
        seed
      });

      const parsed = this.responseParser.parseThought(response);

      return {
        text: parsed.text,
        seed,
        valid: parsed.valid
      };
    } catch (error) {
      console.error('Error generating thought:', error);
      return {
        text: '...',
        seed,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a goal for a character
   * @param {Character} character - Character needing a goal
   * @param {Object} context - World context
   * @returns {Promise<Object>} { text, seed, valid, actionable }
   */
  async generateGoal(character, context = {}) {
    const prompt = this.promptBuilder.buildGoalPrompt(character, context);
    const seed = this.seedManager.getNextSeed(character.id, 'goal', context.frame || 0);

    try {
      const response = await this.ollama.generate(prompt, {
        model: context.model || this.defaultModel,
        temperature: context.temperature || this.defaultTemperature,
        seed
      });

      const parsed = this.responseParser.parseGoal(response);

      // Store goal if valid
      if (parsed.valid && parsed.actionable) {
        character.currentGoal = parsed.text;
      }

      return {
        text: parsed.text,
        seed,
        valid: parsed.valid,
        actionable: parsed.actionable
      };
    } catch (error) {
      console.error('Error generating goal:', error);
      return {
        text: 'Continue daily routine',
        seed,
        valid: false,
        actionable: false,
        error: error.message
      };
    }
  }

  /**
   * Get fallback greeting based on personality
   * @param {Character} speaker - Character speaking
   * @param {Character} listener - Character being greeted
   * @returns {string} Fallback greeting
   */
  getFallbackGreeting(speaker, listener) {
    const friendliness = speaker.personality.friendliness;
    const relationship = speaker.relationships.getRelationship(listener?.id);

    if (friendliness > 70 || relationship > 40) {
      return `Hello ${listener?.name || 'there'}! Good to see you.`;
    } else if (friendliness > 40) {
      return `${listener?.name || 'Hello'}.`;
    } else {
      return `What do you want?`;
    }
  }

  /**
   * Get fallback response based on personality
   * @param {Character} speaker - Character speaking
   * @returns {string} Fallback response
   */
  getFallbackResponse(speaker) {
    const friendliness = speaker.personality.friendliness;

    if (friendliness > 60) {
      return "I'm sorry, I lost my train of thought. What were we talking about?";
    } else {
      return "Hmm.";
    }
  }

  /**
   * Set seed manager (for replay)
   * @param {SeedManager} seedManager
   */
  setSeedManager(seedManager) {
    this.seedManager = seedManager;
  }

  /**
   * Get current seed manager
   * @returns {SeedManager}
   */
  getSeedManager() {
    return this.seedManager;
  }
}

export default DialogueGenerator;
