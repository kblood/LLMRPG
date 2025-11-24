import { EventBus } from './EventBus.js';

/**
 * FallbackLogger - Centralized logging for fallback usage
 * Ensures all fallback usage is visible and tracked
 * 
 * Features:
 * - Emits events for replay logging
 * - Console warnings with context
 * - Statistics tracking
 * - Visual indicators for UI
 * 
 * @class FallbackLogger
 */
export class FallbackLogger {
  static instance = null;

  constructor() {
    this.stats = {
      totalFallbacks: 0,
      bySystem: new Map(),
      byReason: new Map(),
      firstOccurrence: null,
      lastOccurrence: null
    };
    
    this.fallbackHistory = [];
    this.maxHistorySize = 1000;
  }

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!FallbackLogger.instance) {
      FallbackLogger.instance = new FallbackLogger();
    }
    return FallbackLogger.instance;
  }

  /**
   * Log a fallback usage
   * @param {Object} details - Fallback details
   * @param {string} details.system - System using fallback (e.g., 'DialogueGenerator', 'GameMaster')
   * @param {string} details.operation - What was being attempted (e.g., 'greeting', 'narration')
   * @param {string} details.reason - Why fallback was used (e.g., 'LLM_TIMEOUT', 'LLM_ERROR', 'LLM_UNAVAILABLE')
   * @param {string} details.fallbackValue - The fallback text/data used
   * @param {Object} details.context - Additional context (optional)
   * @param {Error} details.error - Original error (optional)
   */
  logFallback(details) {
    const timestamp = Date.now();
    const fallbackRecord = {
      id: `fallback_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      ...details
    };

    // Update statistics
    this.stats.totalFallbacks++;
    
    if (!this.stats.firstOccurrence) {
      this.stats.firstOccurrence = timestamp;
    }
    this.stats.lastOccurrence = timestamp;

    // Track by system
    const systemCount = this.stats.bySystem.get(details.system) || 0;
    this.stats.bySystem.set(details.system, systemCount + 1);

    // Track by reason
    const reasonCount = this.stats.byReason.get(details.reason) || 0;
    this.stats.byReason.set(details.reason, reasonCount + 1);

    // Add to history
    this.fallbackHistory.push(fallbackRecord);
    if (this.fallbackHistory.length > this.maxHistorySize) {
      this.fallbackHistory.shift();
    }

    // Console warning with clear visibility
    this.logToConsole(fallbackRecord);

    // Emit event for replay logging and UI
    this.emitFallbackEvent(fallbackRecord);

    return fallbackRecord.id;
  }

  /**
   * Log to console with clear formatting
   * @private
   */
  logToConsole(record) {
    const timestamp = new Date(record.timestamp).toISOString();
    
    console.warn('\n' + '='.repeat(80));
    console.warn('⚠️  FALLBACK USED');
    console.warn('='.repeat(80));
    console.warn(`System:    ${record.system}`);
    console.warn(`Operation: ${record.operation}`);
    console.warn(`Reason:    ${record.reason}`);
    console.warn(`Timestamp: ${timestamp}`);
    
    if (record.context) {
      console.warn(`Context:   ${JSON.stringify(record.context, null, 2)}`);
    }
    
    if (record.error) {
      console.warn(`Error:     ${record.error.message}`);
      if (record.error.stack) {
        console.warn(`Stack:     ${record.error.stack}`);
      }
    }
    
    console.warn(`Fallback:  "${this.truncate(record.fallbackValue, 100)}"`);
    console.warn('='.repeat(80) + '\n');
  }

  /**
   * Emit event for replay and UI
   * @private
   */
  emitFallbackEvent(record) {
    const eventBus = EventBus.getInstance();
    
    eventBus.emit('fallback:used', {
      fallbackId: record.id,
      system: record.system,
      operation: record.operation,
      reason: record.reason,
      timestamp: record.timestamp,
      context: record.context,
      // Truncate fallback value for event payload
      fallbackPreview: this.truncate(record.fallbackValue, 200)
    });

    // Also emit system-specific events
    eventBus.emit(`fallback:${record.system.toLowerCase()}`, {
      fallbackId: record.id,
      operation: record.operation,
      reason: record.reason,
      timestamp: record.timestamp
    });
  }

  /**
   * Get UI-friendly warning message
   * @param {string} system - System name
   * @param {string} operation - Operation name
   * @returns {string} User-friendly warning
   */
  getUIWarning(system, operation) {
    const messages = {
      DialogueGenerator: {
        greeting: '⚠️ Using basic greeting (LLM unavailable)',
        response: '⚠️ Using basic response (LLM unavailable)',
        default: '⚠️ Using basic dialogue (LLM unavailable)'
      },
      GameMaster: {
        narration: '⚠️ Using standard narration (LLM unavailable)',
        opening: '⚠️ Using standard opening (LLM unavailable)',
        victory: '⚠️ Using standard ending (LLM unavailable)',
        default: '⚠️ Using standard text (LLM unavailable)'
      },
      WorldGenerator: {
        locations: '⚠️ Using pre-built locations (LLM unavailable)',
        npcs: '⚠️ Using pre-built NPCs (LLM unavailable)',
        quest: '⚠️ Using pre-built quest (LLM unavailable)',
        default: '⚠️ Using pre-built content (LLM unavailable)'
      },
      ActionSystem: {
        decision: '⚠️ Using basic AI decision (LLM unavailable)',
        default: '⚠️ Using basic action (LLM unavailable)'
      },
      default: '⚠️ Using fallback content (LLM unavailable)'
    };

    const systemMessages = messages[system] || messages.default;
    if (typeof systemMessages === 'string') {
      return systemMessages;
    }
    
    return systemMessages[operation] || systemMessages.default || messages.default;
  }

  /**
   * Get fallback statistics
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      total: this.stats.totalFallbacks,
      bySystem: Object.fromEntries(this.stats.bySystem),
      byReason: Object.fromEntries(this.stats.byReason),
      firstOccurrence: this.stats.firstOccurrence,
      lastOccurrence: this.stats.lastOccurrence,
      recentFallbacks: this.fallbackHistory.slice(-10)
    };
  }

  /**
   * Get recent fallback history
   * @param {number} count - Number of recent fallbacks to retrieve
   * @returns {Array} Recent fallbacks
   */
  getRecentFallbacks(count = 10) {
    return this.fallbackHistory.slice(-count);
  }

  /**
   * Check if system has used fallbacks recently
   * @param {string} system - System name
   * @param {number} windowMs - Time window in milliseconds (default: 60000 = 1 minute)
   * @returns {boolean}
   */
  hasRecentFallbacks(system, windowMs = 60000) {
    const cutoff = Date.now() - windowMs;
    return this.fallbackHistory.some(f => 
      f.system === system && f.timestamp > cutoff
    );
  }

  /**
   * Get fallback rate (fallbacks per minute)
   * @param {number} windowMs - Time window in milliseconds
   * @returns {number} Fallbacks per minute
   */
  getFallbackRate(windowMs = 300000) {
    const cutoff = Date.now() - windowMs;
    const recent = this.fallbackHistory.filter(f => f.timestamp > cutoff);
    const minutes = windowMs / 60000;
    return recent.length / minutes;
  }

  /**
   * Clear statistics (for testing)
   */
  clear() {
    this.stats = {
      totalFallbacks: 0,
      bySystem: new Map(),
      byReason: new Map(),
      firstOccurrence: null,
      lastOccurrence: null
    };
    this.fallbackHistory = [];
  }

  /**
   * Truncate string for display
   * @private
   */
  truncate(str, maxLength) {
    if (typeof str !== 'string') {
      str = String(str);
    }
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Export fallback report
   * @returns {string} Formatted report
   */
  generateReport() {
    const stats = this.getStats();
    const lines = [];
    
    lines.push('='.repeat(80));
    lines.push('FALLBACK USAGE REPORT');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Total Fallbacks: ${stats.total}`);
    
    if (stats.total > 0) {
      lines.push('');
      lines.push('By System:');
      for (const [system, count] of Object.entries(stats.bySystem)) {
        const percentage = ((count / stats.total) * 100).toFixed(1);
        lines.push(`  ${system}: ${count} (${percentage}%)`);
      }
      
      lines.push('');
      lines.push('By Reason:');
      for (const [reason, count] of Object.entries(stats.byReason)) {
        const percentage = ((count / stats.total) * 100).toFixed(1);
        lines.push(`  ${reason}: ${count} (${percentage}%)`);
      }
      
      if (stats.firstOccurrence) {
        lines.push('');
        lines.push(`First Fallback: ${new Date(stats.firstOccurrence).toISOString()}`);
        lines.push(`Last Fallback:  ${new Date(stats.lastOccurrence).toISOString()}`);
      }
      
      lines.push('');
      lines.push('Recent Fallbacks (last 10):');
      stats.recentFallbacks.forEach((f, i) => {
        lines.push(`  ${i + 1}. [${f.system}] ${f.operation} - ${f.reason}`);
        lines.push(`     ${new Date(f.timestamp).toISOString()}`);
      });
    }
    
    lines.push('');
    lines.push('='.repeat(80));
    
    return lines.join('\n');
  }

  /**
   * Reset instance (for testing)
   */
  static reset() {
    FallbackLogger.instance = null;
  }
}

export default FallbackLogger;
