import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Theme Persistence Service
 * Handles saving and loading theme data from JSON files
 */
export class ThemePersistence {
  constructor() {
    this.savesDir = path.join(__dirname, '../../saves');
    this.ensureDirectoryStructure();
  }

  /**
   * Ensure the saves directory structure exists
   */
  ensureDirectoryStructure() {
    if (!fs.existsSync(this.savesDir)) {
      fs.mkdirSync(this.savesDir, { recursive: true });
      console.log('[ThemePersistence] Created saves directory:', this.savesDir);
    }
  }

  /**
   * Get the theme directory path
   */
  getThemeDir(themeId) {
    return path.join(this.savesDir, themeId);
  }

  /**
   * Create a new theme folder
   */
  createThemeFolder(themeId) {
    const themeDir = this.getThemeDir(themeId);
    if (!fs.existsSync(themeDir)) {
      fs.mkdirSync(themeDir, { recursive: true });
      console.log('[ThemePersistence] Created theme folder:', themeDir);
    }
    return themeDir;
  }

  /**
   * Save theme configuration
   */
  saveTheme(themeId, themeData) {
    try {
      const themeDir = this.createThemeFolder(themeId);

      // Save theme.json
      if (themeData.theme) {
        fs.writeFileSync(
          path.join(themeDir, 'theme.json'),
          JSON.stringify(themeData.theme, null, 2)
        );
      }

      // Save config.json
      if (themeData.config) {
        fs.writeFileSync(
          path.join(themeDir, 'config.json'),
          JSON.stringify(themeData.config, null, 2)
        );
      }

      // Save characters.json
      if (themeData.characters) {
        fs.writeFileSync(
          path.join(themeDir, 'characters.json'),
          JSON.stringify(themeData.characters, null, 2)
        );
      }

      // Save items.json
      if (themeData.items) {
        fs.writeFileSync(
          path.join(themeDir, 'items.json'),
          JSON.stringify(themeData.items, null, 2)
        );
      }

      // Save locations.json
      if (themeData.locations) {
        fs.writeFileSync(
          path.join(themeDir, 'locations.json'),
          JSON.stringify(themeData.locations, null, 2)
        );
      }

      // Save introduction.json
      if (themeData.introduction) {
        fs.writeFileSync(
          path.join(themeDir, 'introduction.json'),
          JSON.stringify(themeData.introduction, null, 2)
        );
      }

      console.log('[ThemePersistence] Saved theme:', themeId);
      return { success: true, themeId, path: themeDir };
    } catch (error) {
      console.error('[ThemePersistence] Error saving theme:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load complete theme from files
   */
  loadTheme(themeId) {
    try {
      const themeDir = this.getThemeDir(themeId);

      if (!fs.existsSync(themeDir)) {
        return { success: false, error: `Theme folder not found: ${themeId}` };
      }

      const themeData = {};

      // Load theme.json
      const themePath = path.join(themeDir, 'theme.json');
      if (fs.existsSync(themePath)) {
        themeData.theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
      }

      // Load config.json
      const configPath = path.join(themeDir, 'config.json');
      if (fs.existsSync(configPath)) {
        themeData.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }

      // Load characters.json
      const charactersPath = path.join(themeDir, 'characters.json');
      if (fs.existsSync(charactersPath)) {
        themeData.characters = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));
      }

      // Load items.json
      const itemsPath = path.join(themeDir, 'items.json');
      if (fs.existsSync(itemsPath)) {
        themeData.items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
      }

      // Load locations.json
      const locationsPath = path.join(themeDir, 'locations.json');
      if (fs.existsSync(locationsPath)) {
        themeData.locations = JSON.parse(fs.readFileSync(locationsPath, 'utf8'));
      }

      // Load introduction.json
      const introPath = path.join(themeDir, 'introduction.json');
      if (fs.existsSync(introPath)) {
        themeData.introduction = JSON.parse(fs.readFileSync(introPath, 'utf8'));
      }

      console.log('[ThemePersistence] Loaded theme:', themeId);
      return { success: true, themeId, data: themeData };
    } catch (error) {
      console.error('[ThemePersistence] Error loading theme:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List all available themes
   */
  listThemes() {
    try {
      this.ensureDirectoryStructure();

      const themes = fs
        .readdirSync(this.savesDir)
        .filter(file => {
          const filePath = path.join(this.savesDir, file);
          return fs.statSync(filePath).isDirectory();
        })
        .map(themeId => {
          const configPath = path.join(this.savesDir, themeId, 'config.json');
          let config = { name: themeId };

          if (fs.existsSync(configPath)) {
            try {
              config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            } catch (e) {
              console.error('[ThemePersistence] Error parsing config for', themeId);
            }
          }

          return {
            id: themeId,
            name: config.name || themeId,
            description: config.description || '',
            theme: config.theme || themeId,
            playerName: config.playerName || 'Unknown'
          };
        });

      return { success: true, themes };
    } catch (error) {
      console.error('[ThemePersistence] Error listing themes:', error);
      return { success: false, error: error.message, themes: [] };
    }
  }

  /**
   * Delete a theme
   */
  deleteTheme(themeId) {
    try {
      const themeDir = this.getThemeDir(themeId);

      if (!fs.existsSync(themeDir)) {
        return { success: false, error: `Theme not found: ${themeId}` };
      }

      // Recursively delete directory
      fs.rmSync(themeDir, { recursive: true, force: true });
      console.log('[ThemePersistence] Deleted theme:', themeId);
      return { success: true };
    } catch (error) {
      console.error('[ThemePersistence] Error deleting theme:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if theme exists
   */
  themeExists(themeId) {
    return fs.existsSync(this.getThemeDir(themeId));
  }

  /**
   * Export theme to file
   */
  exportTheme(themeId, exportPath) {
    try {
      const themeDir = this.getThemeDir(themeId);

      if (!fs.existsSync(themeDir)) {
        return { success: false, error: `Theme not found: ${themeId}` };
      }

      // Create export as ZIP or JSON bundle
      const exportData = {};
      const files = fs.readdirSync(themeDir);

      files.forEach(file => {
        const filePath = path.join(themeDir, file);
        if (fs.statSync(filePath).isFile() && file.endsWith('.json')) {
          exportData[file] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      });

      fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
      console.log('[ThemePersistence] Exported theme to:', exportPath);
      return { success: true, path: exportPath };
    } catch (error) {
      console.error('[ThemePersistence] Error exporting theme:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Import theme from file
   */
  importTheme(themeId, importPath) {
    try {
      if (!fs.existsSync(importPath)) {
        return { success: false, error: `Import file not found: ${importPath}` };
      }

      const importData = JSON.parse(fs.readFileSync(importPath, 'utf8'));
      const themeDir = this.createThemeFolder(themeId);

      // Write all JSON files
      Object.entries(importData).forEach(([filename, data]) => {
        if (filename.endsWith('.json')) {
          fs.writeFileSync(
            path.join(themeDir, filename),
            JSON.stringify(data, null, 2)
          );
        }
      });

      console.log('[ThemePersistence] Imported theme:', themeId);
      return { success: true, themeId };
    } catch (error) {
      console.error('[ThemePersistence] Error importing theme:', error);
      return { success: false, error: error.message };
    }
  }
}
