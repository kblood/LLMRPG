/**
 * Logger - Comprehensive logging utility
 * Logs to console and file with different log levels
 * @author Game Utils
 */

/**
 * Logger class - Provides multi-level logging to console and file
 * Supports debug, info, warn, and error log levels with timestamps
 */
class Logger {
  /**
   * Log level enumeration
   */
  static LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  };

  /**
   * Log level names for display
   */
  static LEVEL_NAMES = {
    0: 'DEBUG',
    1: 'INFO',
    2: 'WARN',
    3: 'ERROR',
  };

  /**
   * ANSI color codes for console output
   */
  static COLORS = {
    RESET: '\x1b[0m',
    DIM: '\x1b[2m',
    RED: '\x1b[31m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    CYAN: '\x1b[36m',
  };

  /**
   * Creates a new Logger instance
   * @param {string} name - Logger name/identifier
   * @param {number} minLevel - Minimum log level to output (default: DEBUG)
   * @param {boolean} useColors - Whether to use ANSI colors in console (default: true)
   * @param {boolean} useFile - Whether to log to file (default: false)
   */
  constructor(
    name = 'Game',
    minLevel = Logger.LEVELS.DEBUG,
    useColors = true,
    useFile = false
  ) {
    this.name = name;
    this.minLevel = minLevel;
    this.useColors = useColors;
    this.useFile = useFile;
    this.logs = []; // In-memory log buffer
    this.maxLogBufferSize = 1000; // Maximum number of logs to keep in memory
  }

  /**
   * Formats a log message with timestamp and metadata
   * @private
   * @param {number} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levelName = Logger.LEVEL_NAMES[level];
    let output = `[${timestamp}] [${this.name}] ${levelName}: ${message}`;

    if (data !== null && typeof data === 'object' && Object.keys(data).length > 0) {
      output += ` | ${JSON.stringify(data)}`;
    }

    return output;
  }

  /**
   * Gets the color code for a log level
   * @private
   * @param {number} level - Log level
   * @returns {string} ANSI color code
   */
  getColorForLevel(level) {
    switch (level) {
      case Logger.LEVELS.DEBUG:
        return Logger.COLORS.CYAN;
      case Logger.LEVELS.INFO:
        return Logger.COLORS.BLUE;
      case Logger.LEVELS.WARN:
        return Logger.COLORS.YELLOW;
      case Logger.LEVELS.ERROR:
        return Logger.COLORS.RED;
      default:
        return Logger.COLORS.RESET;
    }
  }

  /**
   * Logs a message at the specified level
   * @param {number} level - Log level (use Logger.LEVELS)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log (optional)
   */
  log(level, message, data = null) {
    // Check if this level should be logged
    if (level < this.minLevel) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, data);

    // Add to log buffer
    this.addToBuffer(formattedMessage, level);

    // Log to console
    this.logToConsole(level, formattedMessage);

    // Log to file if enabled
    if (this.useFile) {
      this.logToFile(formattedMessage);
    }
  }

  /**
   * Adds a log entry to the in-memory buffer
   * @private
   * @param {string} message - Formatted message
   * @param {number} level - Log level
   */
  addToBuffer(message, level) {
    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
    });

    // Keep buffer size manageable
    if (this.logs.length > this.maxLogBufferSize) {
      this.logs.shift();
    }
  }

  /**
   * Logs to the console
   * @private
   * @param {number} level - Log level
   * @param {string} message - Formatted message
   */
  logToConsole(level, message) {
    const color = this.useColors ? this.getColorForLevel(level) : '';
    const reset = this.useColors ? Logger.COLORS.RESET : '';

    switch (level) {
      case Logger.LEVELS.DEBUG:
        console.log(`${color}${message}${reset}`);
        break;
      case Logger.LEVELS.INFO:
        console.info(`${color}${message}${reset}`);
        break;
      case Logger.LEVELS.WARN:
        console.warn(`${color}${message}${reset}`);
        break;
      case Logger.LEVELS.ERROR:
        console.error(`${color}${message}${reset}`);
        break;
    }
  }

  /**
   * Logs to a file (stub for Node.js environments)
   * @private
   * @param {string} message - Formatted message
   */
  logToFile(message) {
    // This is a stub that can be implemented for Node.js environments
    // In browser environments, this would need to use IndexedDB or similar
    if (typeof window === 'undefined') {
      // Node.js environment
      try {
        // Require fs module dynamically to avoid issues in browser
        // eslint-disable-next-line global-require
        const fs = require('fs');
        const logFile = `./logs/${this.name}.log`;
        fs.appendFileSync(logFile, `${message}\n`);
      } catch (err) {
        // File logging not available
      }
    }
  }

  /**
   * Logs a debug message
   * @param {string} message - Message to log
   * @param {Object} data - Additional data (optional)
   */
  debug(message, data = null) {
    this.log(Logger.LEVELS.DEBUG, message, data);
  }

  /**
   * Logs an info message
   * @param {string} message - Message to log
   * @param {Object} data - Additional data (optional)
   */
  info(message, data = null) {
    this.log(Logger.LEVELS.INFO, message, data);
  }

  /**
   * Logs a warning message
   * @param {string} message - Message to log
   * @param {Object} data - Additional data (optional)
   */
  warn(message, data = null) {
    this.log(Logger.LEVELS.WARN, message, data);
  }

  /**
   * Logs an error message
   * @param {string} message - Message to log
   * @param {Object|Error} data - Additional data or Error object (optional)
   */
  error(message, data = null) {
    if (data instanceof Error) {
      this.log(Logger.LEVELS.ERROR, message, {
        error: data.message,
        stack: data.stack,
      });
    } else {
      this.log(Logger.LEVELS.ERROR, message, data);
    }
  }

  /**
   * Sets the minimum log level
   * @param {number} level - New minimum log level
   */
  setLevel(level) {
    if (!Object.values(Logger.LEVELS).includes(level)) {
      throw new Error('Invalid log level');
    }
    this.minLevel = level;
  }

  /**
   * Sets the logger name
   * @param {string} name - New logger name
   */
  setName(name) {
    this.name = name;
  }

  /**
   * Enables or disables color output
   * @param {boolean} enabled - Whether to use colors
   */
  setColors(enabled) {
    this.useColors = enabled;
  }

  /**
   * Enables or disables file logging
   * @param {boolean} enabled - Whether to log to file
   */
  setFileLogging(enabled) {
    this.useFile = enabled;
  }

  /**
   * Gets all logged messages
   * @returns {Array} Array of log entries
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * Gets logs filtered by level
   * @param {number} level - Log level to filter by
   * @returns {Array} Filtered log entries
   */
  getLogsByLevel(level) {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Gets logs as formatted strings
   * @returns {Array} Array of formatted log messages
   */
  getFormattedLogs() {
    return this.logs.map((log) => log.message);
  }

  /**
   * Clears all logged messages from the buffer
   */
  clear() {
    this.logs = [];
  }

  /**
   * Gets a summary of logs by level
   * @returns {Object} Count of logs at each level
   */
  getSummary() {
    const summary = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      total: this.logs.length,
    };

    this.logs.forEach((log) => {
      switch (log.level) {
        case Logger.LEVELS.DEBUG:
          summary.debug += 1;
          break;
        case Logger.LEVELS.INFO:
          summary.info += 1;
          break;
        case Logger.LEVELS.WARN:
          summary.warn += 1;
          break;
        case Logger.LEVELS.ERROR:
          summary.error += 1;
          break;
      }
    });

    return summary;
  }

  /**
   * Creates a child logger with a specific name
   * @param {string} childName - Name of the child logger
   * @returns {Logger} New Logger instance
   */
  createChild(childName) {
    return new Logger(
      `${this.name}:${childName}`,
      this.minLevel,
      this.useColors,
      this.useFile
    );
  }

  /**
   * Gets the logger name
   * @returns {string} Logger name
   */
  getName() {
    return this.name;
  }

  /**
   * Returns a string representation of the logger
   * @returns {string} Logger description
   */
  toString() {
    return `Logger(${this.name}, level=${Logger.LEVEL_NAMES[this.minLevel]})`;
  }
}

export default Logger;
