import { EventBus } from './EventBus.js';
import { FallbackLogger } from './FallbackLogger.js';

/**
 * FallbackReplayIntegration
 * Integrates fallback logging with replay system
 * Ensures fallback usage is visible in replays and event logs
 * 
 * @class FallbackReplayIntegration
 */
export class FallbackReplayIntegration {
  /**
   * Initialize fallback replay integration
   * @param {ReplayLogger} replayLogger - Replay logger instance
   */
  static initialize(replayLogger) {
    const eventBus = EventBus.getInstance();
    const fallbackLogger = FallbackLogger.getInstance();

    // Listen for fallback events and log them to replay
    eventBus.on('fallback:used', (data) => {
      if (replayLogger) {
        replayLogger.logEvent(
          replayLogger.frame || 0,
          'fallback_used',
          {
            system: data.system,
            operation: data.operation,
            reason: data.reason,
            preview: data.fallbackPreview,
            warning: fallbackLogger.getUIWarning(data.system, data.operation)
          },
          null // no specific entity
        );
      }

      // Also log to console for immediate visibility
      console.warn(`[Replay] Fallback logged at frame ${replayLogger?.frame || 0}`);
    });

    console.log('[FallbackReplayIntegration] Initialized - fallbacks will be logged to replay');
  }

  /**
   * Add fallback indicator to dialogue message
   * @param {string} message - Original message
   * @param {boolean} wasFallback - Whether this was a fallback
   * @returns {string} Message with fallback indicator if applicable
   */
  static addFallbackIndicator(message, wasFallback) {
    if (wasFallback) {
      return `⚠️ ${message} [FALLBACK]`;
    }
    return message;
  }

  /**
   * Get fallback status for UI display
   * @param {number} windowMs - Time window to check (default: 60 seconds)
   * @returns {Object} Status information
   */
  static getFallbackStatus(windowMs = 60000) {
    const fallbackLogger = FallbackLogger.getInstance();
    const stats = fallbackLogger.getStats();
    const rate = fallbackLogger.getFallbackRate(windowMs);
    
    return {
      hasRecentFallbacks: rate > 0,
      fallbackRate: rate.toFixed(2),
      totalFallbacks: stats.total,
      mostCommonSystem: this.getMostCommonSystem(stats.bySystem),
      mostCommonReason: this.getMostCommonReason(stats.byReason),
      warning: rate > 5 ? 'High fallback rate detected - LLM may be unavailable' : null
    };
  }

  /**
   * Get most common system using fallbacks
   * @private
   */
  static getMostCommonSystem(bySystem) {
    let max = 0;
    let system = null;
    
    for (const [sys, count] of Object.entries(bySystem)) {
      if (count > max) {
        max = count;
        system = sys;
      }
    }
    
    return system;
  }

  /**
   * Get most common fallback reason
   * @private
   */
  static getMostCommonReason(byReason) {
    let max = 0;
    let reason = null;
    
    for (const [rsn, count] of Object.entries(byReason)) {
      if (count > max) {
        max = count;
        reason = rsn;
      }
    }
    
    return reason;
  }

  /**
   * Generate fallback summary for UI
   * @returns {string} HTML-formatted summary
   */
  static generateUIMessage() {
    const status = this.getFallbackStatus();
    
    if (!status.hasRecentFallbacks) {
      return '';
    }

    const lines = [];
    lines.push('<div class="fallback-warning">');
    lines.push('  <strong>⚠️ Fallback Content in Use</strong>');
    lines.push(`  <p>LLM generation failures: ${status.totalFallbacks} total</p>`);
    
    if (status.warning) {
      lines.push(`  <p class="warning-text">${status.warning}</p>`);
    }
    
    lines.push(`  <p>Most affected: ${status.mostCommonSystem}</p>`);
    lines.push(`  <p>Main reason: ${status.mostCommonReason}</p>`);
    lines.push('  <p><em>Using pre-built content as fallback</em></p>');
    lines.push('</div>');
    
    return lines.join('\n');
  }
}

export default FallbackReplayIntegration;
