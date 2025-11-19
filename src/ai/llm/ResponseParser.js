/**
 * Response Parser for LLM outputs
 * Parses and validates LLM responses
 * 
 * @class ResponseParser
 */
export class ResponseParser {
  /**
   * Parse dialogue response from LLM
   * @param {string} response - Raw LLM response
   * @param {Object} options - Parsing options
   * @returns {Object} Parsed response {text, valid, issues}
   */
  parseDialogue(response, options = {}) {
    if (!response || typeof response !== 'string') {
      return {
        text: '',
        valid: false,
        issues: ['Empty or invalid response']
      };
    }

    let text = response.trim();
    const issues = [];

    // Remove common LLM artifacts
    text = this.cleanResponse(text);

    // Check for meta-commentary (LLM talking about the task)
    if (this.containsMetaCommentary(text)) {
      issues.push('Contains meta-commentary');
      text = this.removeMetaCommentary(text);
    }

    // Check for excessive length
    const sentenceCount = this.countSentences(text);
    if (sentenceCount > 3 && !options.allowLong) {
      issues.push('Response too long');
      text = this.truncateToSentences(text, 2);
    }

    // Check for empty response
    if (!text || text.length < 5) {
      return {
        text: "...",
        valid: false,
        issues: ['Response too short']
      };
    }

    return {
      text,
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Parse thought response from LLM
   * @param {string} response - Raw LLM response
   * @returns {Object} Parsed thought
   */
  parseThought(response) {
    if (!response) {
      return {
        text: '',
        valid: false
      };
    }

    let text = response.trim();
    text = this.cleanResponse(text);

    // Thoughts should be internal, remove quotes if present
    text = text.replace(/^["']|["']$/g, '');

    // Should be one sentence
    const sentences = this.splitIntoSentences(text);
    if (sentences.length > 0) {
      text = sentences[0];
    }

    return {
      text,
      valid: text.length > 0 && text.length < 200
    };
  }

  /**
   * Parse goal response from LLM
   * @param {string} response - Raw LLM response
   * @returns {Object} Parsed goal {text, valid, actionable}
   */
  parseGoal(response) {
    if (!response) {
      return {
        text: '',
        valid: false,
        actionable: false
      };
    }

    let text = response.trim();
    text = this.cleanResponse(text);

    // Remove "I want to", "My goal is", etc.
    text = text.replace(/^(I want to|My goal is to|I would like to|I should|I will)\s+/i, '');

    // Should be one clear sentence
    const sentences = this.splitIntoSentences(text);
    if (sentences.length > 0) {
      text = sentences[0];
    }

    // Check if it's actionable (contains action verbs)
    const actionable = this.isActionable(text);

    return {
      text,
      valid: text.length > 5 && text.length < 100,
      actionable
    };
  }

  /**
   * Clean response of common artifacts
   * @param {string} text - Raw text
   * @returns {string} Cleaned text
   */
  cleanResponse(text) {
    // Remove leading/trailing whitespace
    text = text.trim();

    // Remove markdown formatting
    text = text.replace(/\*\*(.*?)\*\*/g, '$1'); // **bold**
    text = text.replace(/\*(.*?)\*/g, '$1'); // *italic*
    text = text.replace(/`(.*?)`/g, '$1'); // `code`

    // Remove "As [character]..." prefixes
    text = text.replace(/^As\s+\w+,?\s*/i, '');

    // Remove common narrative markers
    text = text.replace(/^\[.*?\]\s*/g, ''); // [action]
    text = text.replace(/^\(.*?\)\s*/g, ''); // (thought)

    // Remove quotes if the entire response is quoted
    if ((text.startsWith('"') && text.endsWith('"')) || 
        (text.startsWith("'") && text.endsWith("'"))) {
      text = text.slice(1, -1);
    }

    return text.trim();
  }

  /**
   * Check if text contains meta-commentary
   * @param {string} text - Text to check
   * @returns {boolean}
   */
  containsMetaCommentary(text) {
    const metaPatterns = [
      /\b(I am|I'm) (an AI|a language model|programmed|designed to)/i,
      /\b(as an AI|as a language model)/i,
      /\bI (cannot|can't|should not|shouldn't) (roleplay|pretend|act as)/i,
      /\bthis is (just|only) a (simulation|game|conversation)/i
    ];

    return metaPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Remove meta-commentary from text
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  removeMetaCommentary(text) {
    const sentences = this.splitIntoSentences(text);
    const cleaned = sentences.filter(s => !this.containsMetaCommentary(s));
    return cleaned.join(' ');
  }

  /**
   * Split text into sentences
   * @param {string} text - Text to split
   * @returns {string[]} Array of sentences
   */
  splitIntoSentences(text) {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Count sentences in text
   * @param {string} text - Text to count
   * @returns {number} Number of sentences
   */
  countSentences(text) {
    return this.splitIntoSentences(text).length;
  }

  /**
   * Truncate to specified number of sentences
   * @param {string} text - Text to truncate
   * @param {number} count - Number of sentences to keep
   * @returns {string} Truncated text
   */
  truncateToSentences(text, count) {
    const sentences = this.splitIntoSentences(text);
    return sentences.slice(0, count).join('. ') + (sentences.length > count ? '.' : '');
  }

  /**
   * Check if text is actionable (contains action verbs)
   * @param {string} text - Text to check
   * @returns {boolean}
   */
  isActionable(text) {
    const actionVerbs = [
      'visit', 'go', 'talk', 'speak', 'find', 'search', 'look', 'get', 'take',
      'buy', 'sell', 'trade', 'give', 'ask', 'tell', 'meet', 'see', 'check',
      'investigate', 'explore', 'return', 'leave', 'enter', 'exit', 'help',
      'assist', 'work', 'rest', 'eat', 'drink', 'sleep', 'wake'
    ];

    const lowerText = text.toLowerCase();
    return actionVerbs.some(verb => lowerText.includes(verb));
  }

  /**
   * Validate response meets requirements
   * @param {string} response - Response to validate
   * @param {Object} requirements - Requirements object
   * @returns {Object} Validation result
   */
  validate(response, requirements = {}) {
    const issues = [];

    if (requirements.minLength && response.length < requirements.minLength) {
      issues.push(`Too short (min: ${requirements.minLength})`);
    }

    if (requirements.maxLength && response.length > requirements.maxLength) {
      issues.push(`Too long (max: ${requirements.maxLength})`);
    }

    if (requirements.mustContain) {
      const missing = requirements.mustContain.filter(word => 
        !response.toLowerCase().includes(word.toLowerCase())
      );
      if (missing.length > 0) {
        issues.push(`Missing required words: ${missing.join(', ')}`);
      }
    }

    if (requirements.mustNotContain) {
      const forbidden = requirements.mustNotContain.filter(word =>
        response.toLowerCase().includes(word.toLowerCase())
      );
      if (forbidden.length > 0) {
        issues.push(`Contains forbidden words: ${forbidden.join(', ')}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}

export default ResponseParser;
