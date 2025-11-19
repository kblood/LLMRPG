/**
 * Ollama LLM Service
 * Manages connection to Ollama API with deterministic seeded generation
 * 
 * @class OllamaService
 */
export class OllamaService {
  static instance = null;

  /**
   * Create Ollama service
   * @param {Object} config - Configuration
   */
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.defaultModel = config.defaultModel || 'llama3.1:8b';
    this.defaultTemperature = config.defaultTemperature || 0.7;
    this.timeout = config.timeout || 30000; // 30 seconds
    
    // Response cache for replay determinism
    this.responseCache = new Map();
    this.cacheEnabled = config.cacheEnabled !== false;
    
    // Statistics
    this.stats = {
      totalCalls: 0,
      cacheHits: 0,
      errors: 0,
      totalTokens: 0
    };
  }

  /**
   * Get singleton instance
   * @param {Object} config - Configuration (only used on first call)
   * @returns {OllamaService}
   */
  static getInstance(config = {}) {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService(config);
    }
    return OllamaService.instance;
  }

  /**
   * Reset singleton (for testing)
   */
  static reset() {
    OllamaService.instance = null;
  }

  /**
   * Generate cache key from prompt and options
   * @param {string} prompt - Prompt text
   * @param {Object} options - Generation options
   * @returns {string} Cache key
   */
  getCacheKey(prompt, options) {
    const key = {
      prompt,
      model: options.model || this.defaultModel,
      temperature: options.temperature || this.defaultTemperature,
      seed: options.seed
    };
    return JSON.stringify(key);
  }

  /**
   * Check if Ollama is available
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      console.log('[OllamaService] Checking availability at', this.baseUrl);
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // Increased to 10 seconds
      });
      console.log('[OllamaService] Response received:', response.status, response.ok);
      return response.ok;
    } catch (error) {
      console.error('[OllamaService] Availability check failed:', error.message);
      return false;
    }
  }

  /**
   * List available models
   * @returns {Promise<Array>} Array of model names
   */
  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }

      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Generate text with LLM
   * @param {string} prompt - Prompt text
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, options = {}) {
    this.stats.totalCalls++;

    // Check cache first
    const cacheKey = this.getCacheKey(prompt, options);
    if (this.cacheEnabled && this.responseCache.has(cacheKey)) {
      this.stats.cacheHits++;
      return this.responseCache.get(cacheKey);
    }

    const model = options.model || this.defaultModel;
    const temperature = options.temperature !== undefined ? options.temperature : this.defaultTemperature;
    const seed = options.seed;

    try {
      const requestBody = {
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          ...(seed !== undefined && { seed })
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const generatedText = data.response || '';

      // Update statistics
      if (data.eval_count) {
        this.stats.totalTokens += data.eval_count;
      }

      // Cache response
      if (this.cacheEnabled) {
        this.responseCache.set(cacheKey, generatedText);
      }

      return generatedText;

    } catch (error) {
      this.stats.errors++;
      
      if (error.name === 'AbortError') {
        throw new Error('Ollama request timed out');
      }

      console.error('Error generating with Ollama:', error);
      
      // Return fallback response
      return this.getFallbackResponse(options.fallback);
    }
  }

  /**
   * Generate with streaming (for future use)
   * @param {string} prompt - Prompt text
   * @param {Object} options - Generation options
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<string>} Complete generated text
   */
  async generateStream(prompt, options = {}, onChunk) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature !== undefined ? options.temperature : this.defaultTemperature;
    const seed = options.seed;

    try {
      const requestBody = {
        model,
        prompt,
        stream: true,
        options: {
          temperature,
          ...(seed !== undefined && { seed })
        }
      };

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullText += data.response;
              if (onChunk) onChunk(data.response);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      return fullText;

    } catch (error) {
      console.error('Error streaming from Ollama:', error);
      throw error;
    }
  }

  /**
   * Get fallback response when LLM fails
   * @param {string|Object} fallback - Fallback configuration
   * @returns {string} Fallback text
   */
  getFallbackResponse(fallback) {
    if (typeof fallback === 'string') {
      return fallback;
    }

    if (fallback && fallback.text) {
      return fallback.text;
    }

    return "I'm having trouble thinking right now. Let me gather my thoughts.";
  }

  /**
   * Clear response cache
   */
  clearCache() {
    this.responseCache.clear();
  }

  /**
   * Get service statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.responseCache.size,
      cacheHitRate: this.stats.totalCalls > 0 
        ? (this.stats.cacheHits / this.stats.totalCalls * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Alias for getStats() for backward compatibility
   * @returns {Object} Statistics
   */
  getStatistics() {
    return this.getStats();
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalCalls: 0,
      cacheHits: 0,
      errors: 0,
      totalTokens: 0
    };
  }
}

export default OllamaService;
