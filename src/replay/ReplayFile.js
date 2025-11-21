import fs from 'fs';
import path from 'path';
import pako from 'pako';

/**
 * @typedef {Object} ReplayHeader
 * @property {string} version - Replay file format version
 * @property {number} timestamp - When replay was created
 * @property {number} gameSeed - RNG seed used in the game
 * @property {number} frameCount - Total number of frames
 * @property {number} eventCount - Total number of events logged
 * @property {number} llmCallCount - Total number of LLM calls
 * @property {number} checkpointCount - Total number of checkpoints
 */

/**
 * @typedef {Object} ReplayData
 * @property {ReplayHeader} header - Replay metadata
 * @property {*} initialState - Initial game state
 * @property {Array} events - Array of recorded events
 * @property {Array} llmCalls - Array of LLM calls
 * @property {Array} checkpoints - Array of game state checkpoints
 */

/**
 * Handles replay file format creation, loading, saving, and compression.
 * Uses pako for gzip compression to reduce file size.
 */
class ReplayFile {
  /**
   * Creates a new replay data structure
   * @param {ReplayHeader} header - Replay metadata
   * @param {Array} events - Array of events
   * @param {Array} llmCalls - Array of LLM calls
   * @param {Array} checkpoints - Array of checkpoints
   * @returns {ReplayData}
   */
  static create(header, events, llmCalls, checkpoints) {
    return {
      header,
      initialState: null,
      events: events || [],
      llmCalls: llmCalls || [],
      checkpoints: checkpoints || []
    };
  }

  /**
   * Loads a replay file from disk
   * @param {string} filename - Path to the replay file
   * @returns {Promise<ReplayData>} - The loaded replay data
   * @throws {Error} If file not found or corrupt
   */
  static async load(filename) {
    return new Promise((resolve, reject) => {
      fs.readFile(filename, (err, data) => {
        if (err) {
          reject(new Error(`Failed to read replay file ${filename}: ${err.message}`));
          return;
        }

        try {
          console.log(`[ReplayFile] Loaded compressed replay file: ${filename} (${data.length} bytes)`);
          const decompressed = ReplayFile.decompress(data);
          console.log(`[ReplayFile] Decompressed replay data: ${decompressed.length} characters`);
          const replayData = JSON.parse(decompressed);
          console.log(`[ReplayFile] Parsed replay data - Events: ${replayData.events?.length || 0}, LLM Calls: ${replayData.llmCalls?.length || 0}`);

          // Validate replay data structure
          if (!replayData.header || !Array.isArray(replayData.events)) {
            throw new Error('Invalid replay file structure');
          }

          resolve(replayData);
        } catch (parseError) {
          reject(new Error(`Failed to parse replay file: ${parseError.message}`));
        }
      });
    });
  }

  /**
   * Saves replay data to a file with compression
   * @param {string} filename - Path to save the replay file
   * @param {ReplayData} replayData - The replay data to save
   * @returns {Promise<void>}
   * @throws {Error} If write fails
   */
  static async save(filename, replayData) {
    return new Promise((resolve, reject) => {
      try {
        // Validate replay data
        if (!replayData.header) {
          throw new Error('Replay data must contain header');
        }

        console.log(`[ReplayFile] Saving replay with ${replayData.events?.length || 0} events to ${filename}`);

        // Create directory if it doesn't exist
        const dir = path.dirname(filename);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // Serialize and compress
        const jsonString = JSON.stringify(replayData);
        console.log(`[ReplayFile] Serialized JSON: ${jsonString.length} characters`);
        const compressed = ReplayFile.compress(jsonString);
        console.log(`[ReplayFile] Compressed size: ${compressed.length} bytes`);

        fs.writeFile(filename, compressed, (err) => {
          if (err) {
            reject(new Error(`Failed to write replay file: ${err.message}`));
            return;
          }
          console.log(`[ReplayFile] Replay saved successfully: ${filename}`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Compresses data using gzip via pako
   * @param {string|Buffer} data - Data to compress
   * @returns {Buffer} - Compressed data
   */
  static compress(data) {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;
    const compressed = pako.gzip(dataBuffer);
    return Buffer.from(compressed);
  }

  /**
   * Decompresses data that was compressed with gzip
   * @param {Buffer} compressedData - Compressed data
   * @returns {string} - Decompressed string data
   */
  static decompress(compressedData) {
    try {
      const decompressed = pako.ungzip(compressedData);
      return Buffer.from(decompressed).toString('utf-8');
    } catch (error) {
      throw new Error(`Failed to decompress replay data: ${error.message}`);
    }
  }

  /**
   * Gets file information without fully loading it
   * @param {string} filename - Path to replay file
   * @returns {Promise<{size: number, created: Date, modified: Date}>}
   */
  static async getFileInfo(filename) {
    return new Promise((resolve, reject) => {
      fs.stat(filename, (err, stats) => {
        if (err) {
          reject(new Error(`Failed to get file info: ${err.message}`));
          return;
        }

        resolve({
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        });
      });
    });
  }

  /**
   * Validates that a file is a valid replay file
   * @param {string} filename - Path to replay file
   * @returns {Promise<boolean>}
   */
  static async isValidReplayFile(filename) {
    try {
      const replayData = await ReplayFile.load(filename);
      return (
        replayData.header &&
        typeof replayData.header.version === 'string' &&
        Array.isArray(replayData.events) &&
        Array.isArray(replayData.llmCalls) &&
        Array.isArray(replayData.checkpoints)
      );
    } catch {
      return false;
    }
  }
}

export { ReplayFile };
