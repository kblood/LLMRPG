/**
 * ConfigService - Configuration management service
 *
 * Extends Service to provide configuration loading, access, and persistence.
 * Loads configuration from config/settings.json on initialization.
 *
 * Features:
 * - Configuration loading from JSON file
 * - Key-value get/set with dot notation support
 * - Default values
 * - Configuration persistence to file
 * - Configuration change tracking
 * - Deep copy to prevent external mutations
 *
 * @example
 * const configService = new ConfigService();
 * await configService.initialize();
 *
 * // Get config values
 * const gameTitle = configService.get('game.title');
 * const fps = configService.get('rendering.fps', 60); // with default
 *
 * // Set config values
 * configService.set('rendering.fps', 120);
 *
 * // Save changes to disk
 * await configService.save();
 *
 * // Get all config
 * const fullConfig = configService.getAll();
 */

import { Service } from './Service.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the directory of the current module
 * @returns {string} Directory path
 */
function getModuleDir() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return __dirname;
}

class ConfigService extends Service {
  /**
   * Create a new ConfigService instance
   * @param {string} configPath - Path to config file (optional, defaults to config/settings.json)
   */
  constructor(configPath = null) {
    super('ConfigService');

    /**
     * Path to configuration file
     * @type {string}
     */
    this.configPath =
      configPath ||
      path.join(getModuleDir(), '../../config/settings.json');

    /**
     * Configuration object
     * @type {Object}
     */
    this.config = {};

    /**
     * Track whether config has been modified
     * @type {boolean}
     */
    this.isDirty = false;

    /**
     * Track if config file exists
     * @type {boolean}
     */
    this.configFileExists = false;
  }

  /**
   * Initialize the service by loading configuration
   * @async
   * @returns {Promise<void>}
   */
  async onInitialize() {
    await this.loadConfig();
  }

  /**
   * Shutdown the service
   * Optionally saves configuration if modified
   * @async
   * @returns {Promise<void>}
   */
  async onShutdown() {
    if (this.isDirty) {
      console.log('[ConfigService] Saving modified configuration...');
      await this.save();
    }
  }

  /**
   * Load configuration from file
   * Creates default config if file doesn't exist
   * @async
   * @private
   * @returns {Promise<void>}
   */
  async loadConfig() {
    try {
      // Check if file exists
      if (fs.existsSync(this.configPath)) {
        const configContent = fs.readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(configContent);
        this.configFileExists = true;
        console.log(`[ConfigService] Loaded configuration from ${this.configPath}`);
      } else {
        // Create default config
        this.config = this.getDefaultConfig();
        this.configFileExists = false;
        console.log(`[ConfigService] Configuration file not found, using defaults`);
        console.log(
          `[ConfigService] To persist config, call save() to create ${this.configPath}`
        );
      }

      this.isDirty = false;
    } catch (error) {
      console.error('[ConfigService] Error loading configuration:', error);
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Get default configuration structure
   * @private
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      game: {
        title: 'OllamaRPG',
        version: '0.1.0'
      },
      rendering: {
        fps: 60,
        width: 1024,
        height: 768
      },
      ai: {
        model: 'default',
        temperature: 0.7
      }
    };
  }

  /**
   * Get a configuration value using dot notation
   * @param {string} key - Configuration key (dot notation: "game.title")
   * @param {any} defaultValue - Default value if key not found (optional)
   * @returns {any} Configuration value or default value
   * @example
   * configService.get('game.title')
   * configService.get('rendering.fps', 60)
   * configService.get('nonexistent', 'default')
   */
  get(key, defaultValue = null) {
    if (!key || typeof key !== 'string') {
      throw new Error('Configuration key must be a non-empty string');
    }

    const keys = key.split('.');
    let value = this.config;

    // Navigate through nested object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    // Return deep copy to prevent external mutations
    return this.deepCopy(value);
  }

  /**
   * Get all configuration
   * @returns {Object} Deep copy of entire configuration
   */
  getAll() {
    return this.deepCopy(this.config);
  }

  /**
   * Set a configuration value using dot notation
   * @param {string} key - Configuration key (dot notation: "game.title")
   * @param {any} value - Value to set
   * @throws {Error} If key is invalid
   * @returns {void}
   * @example
   * configService.set('rendering.fps', 120)
   * configService.set('ai.temperature', 0.8)
   */
  set(key, value) {
    if (!key || typeof key !== 'string') {
      throw new Error('Configuration key must be a non-empty string');
    }

    const keys = key.split('.');
    const lastKey = keys.pop();

    // Navigate/create nested structure
    let current = this.config;
    for (const k of keys) {
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    // Set the value
    const oldValue = current[lastKey];
    current[lastKey] = value;

    // Mark as dirty if value actually changed
    if (oldValue !== value) {
      this.isDirty = true;
      console.log(`[ConfigService] Set "${key}" to:`, value);
    }
  }

  /**
   * Check if a configuration key exists
   * @param {string} key - Configuration key (dot notation)
   * @returns {boolean} True if key exists
   */
  has(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }

    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return false;
      }
    }

    return true;
  }

  /**
   * Delete a configuration key
   * @param {string} key - Configuration key (dot notation)
   * @returns {boolean} True if key was deleted, false if not found
   */
  delete(key) {
    if (!key || typeof key !== 'string') {
      throw new Error('Configuration key must be a non-empty string');
    }

    const keys = key.split('.');
    const lastKey = keys.pop();

    let current = this.config;
    for (const k of keys) {
      if (!(k in current) || typeof current[k] !== 'object') {
        return false;
      }
      current = current[k];
    }

    if (lastKey in current) {
      delete current[lastKey];
      this.isDirty = true;
      console.log(`[ConfigService] Deleted "${key}"`);
      return true;
    }

    return false;
  }

  /**
   * Check if configuration has unsaved changes
   * @returns {boolean} True if configuration is dirty
   */
  isDirtyState() {
    return this.isDirty;
  }

  /**
   * Reset configuration to default values
   * @param {boolean} saveImmediately - Save to file immediately (optional)
   * @async
   * @returns {Promise<void>}
   */
  async reset(saveImmediately = false) {
    this.config = this.getDefaultConfig();
    this.isDirty = true;
    console.log('[ConfigService] Configuration reset to defaults');

    if (saveImmediately) {
      await this.save();
    }
  }

  /**
   * Save configuration to file
   * Creates directory if it doesn't exist
   * @async
   * @throws {Error} If save operation fails
   * @returns {Promise<void>}
   */
  async save() {
    try {
      const dir = path.dirname(this.configPath);

      // Create directory if it doesn't exist
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write configuration to file
      const configJson = JSON.stringify(this.config, null, 2);
      fs.writeFileSync(this.configPath, configJson, 'utf-8');

      this.isDirty = false;
      this.configFileExists = true;
      console.log(`[ConfigService] Configuration saved to ${this.configPath}`);
    } catch (error) {
      console.error('[ConfigService] Error saving configuration:', error);
      throw new Error(`Failed to save configuration: ${error.message}`);
    }
  }

  /**
   * Reload configuration from file (discards unsaved changes)
   * @async
   * @returns {Promise<void>}
   */
  async reload() {
    console.log('[ConfigService] Reloading configuration from file...');
    await this.loadConfig();
  }

  /**
   * Get configuration path
   * @returns {string} Path to configuration file
   */
  getConfigPath() {
    return this.configPath;
  }

  /**
   * Get configuration statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...super.getStatus(),
      configPath: this.configPath,
      configFileExists: this.configFileExists,
      isDirty: this.isDirty,
      keyCount: Object.keys(this.flattenConfig(this.config)).length
    };
  }

  /**
   * Flatten configuration object for statistics
   * @private
   * @param {Object} obj - Object to flatten
   * @param {string} prefix - Key prefix for flattened keys
   * @returns {Object} Flattened configuration
   */
  flattenConfig(obj, prefix = '') {
    const flattened = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          Object.assign(flattened, this.flattenConfig(obj[key], fullKey));
        } else {
          flattened[fullKey] = obj[key];
        }
      }
    }

    return flattened;
  }

  /**
   * Create a deep copy of an object to prevent external mutations
   * @private
   * @param {any} obj - Object to copy
   * @returns {any} Deep copy
   */
  deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map((item) => this.deepCopy(item));
    }

    if (obj instanceof Object) {
      const copy = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = this.deepCopy(obj[key]);
        }
      }
      return copy;
    }
  }
}

export { ConfigService };
export default ConfigService;
