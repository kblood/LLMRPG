#!/usr/bin/env node
/**
 * Simple replay file viewer
 */

import { ReplayFile } from './src/replay/ReplayFile.js';
import { DialogueInterface } from './src/ui/DialogueInterface.js';
import fs from 'fs';
import path from 'path';

const ui = new DialogueInterface().initialize();

async function viewReplay(filename) {
  ui.displayHeader('REPLAY FILE VIEWER');
  ui.display('');
  
  try {
    ui.displayInfo(`Loading replay: ${filename}`);
    const replay = await ReplayFile.load(filename);
    
    ui.display('');
    ui.displayHeader('Header Information');
    ui.display(`Version:        ${replay.header.version}`, { color: 'gray' });
    ui.display(`Timestamp:      ${new Date(replay.header.timestamp).toLocaleString()}`, { color: 'gray' });
    ui.display(`Game Seed:      ${replay.header.gameSeed}`, { color: 'gray' });
    ui.display(`Total Frames:   ${replay.header.frameCount}`, { color: 'gray' });
    ui.display(`Events:         ${replay.header.eventCount}`, { color: 'gray' });
    ui.display(`LLM Calls:      ${replay.header.llmCallCount}`, { color: 'gray' });
    ui.display(`Checkpoints:    ${replay.header.checkpointCount}`, { color: 'gray' });
    
    // File stats
    const stats = fs.statSync(filename);
    ui.display(`File Size:      ${(stats.size / 1024).toFixed(2)} KB (compressed)`, { color: 'gray' });
    
    ui.display('');
    ui.displayHeader('Events Timeline');
    
    if (replay.events.length === 0) {
      ui.displayWarning('No events recorded');
    } else {
      replay.events.forEach((event, idx) => {
        const frameTime = (event.frame / 60).toFixed(1);
        const charId = event.characterId ? ` [${event.characterId}]` : '';
        ui.display(`[${frameTime}s] ${event.type}${charId}`, { color: 'cyan' });
        
        // Show some event data
        if (event.data && Object.keys(event.data).length > 0) {
          const dataStr = JSON.stringify(event.data, null, 2)
            .split('\n')
            .slice(1, -1) // Remove outer braces
            .map(line => '    ' + line.trim())
            .join('\n');
          if (dataStr.trim()) {
            ui.display(dataStr, { color: 'gray' });
          }
        }
      });
    }
    
    if (replay.llmCalls && replay.llmCalls.length > 0) {
      ui.display('');
      ui.displayHeader('LLM Calls');
      
      replay.llmCalls.forEach((call, idx) => {
        const frameTime = (call.frame / 60).toFixed(1);
        ui.display(`\nCall #${idx + 1} [${frameTime}s] - ${call.characterId}`, { color: 'yellow' });
        
        if (call.prompt) {
          ui.display('Prompt:', { color: 'gray' });
          const promptPreview = call.prompt.substring(0, 200) + (call.prompt.length > 200 ? '...' : '');
          ui.display(`  ${promptPreview}`, { color: 'gray' });
        }
        
        if (call.response) {
          ui.display('Response:', { color: 'gray' });
          const responsePreview = call.response.substring(0, 200) + (call.response.length > 200 ? '...' : '');
          ui.display(`  ${responsePreview}`, { color: 'gray' });
        }
        
        if (call.tokensUsed) {
          ui.display(`Tokens: ${call.tokensUsed}`, { color: 'gray' });
        }
      });
    }
    
    if (replay.checkpoints && replay.checkpoints.length > 0) {
      ui.display('');
      ui.displayHeader('Checkpoints');
      
      replay.checkpoints.forEach((checkpoint, idx) => {
        const frameTime = (checkpoint.frame / 60).toFixed(1);
        ui.display(`Checkpoint #${idx + 1} at ${frameTime}s (frame ${checkpoint.frame})`, { color: 'magenta' });
      });
    }
    
    ui.display('');
    ui.displaySuccess('Replay loaded successfully!');
    
  } catch (error) {
    ui.displayError(`Failed to load replay: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

async function listReplays() {
  const replayDir = './replays';
  
  if (!fs.existsSync(replayDir)) {
    ui.displayWarning('No replays directory found');
    return [];
  }
  
  const files = fs.readdirSync(replayDir)
    .filter(f => f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(replayDir, f),
      stats: fs.statSync(path.join(replayDir, f))
    }))
    .sort((a, b) => b.stats.mtime - a.stats.mtime);
  
  return files;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // List available replays
    ui.displayHeader('AVAILABLE REPLAYS');
    ui.display('');
    
    const replays = await listReplays();
    
    if (replays.length === 0) {
      ui.displayWarning('No replay files found in ./replays/');
      ui.display('');
      ui.display('Run "node test-replay-system.js" to create test replays', { color: 'gray' });
      process.exit(0);
    }
    
    replays.forEach((replay, idx) => {
      ui.display(`${idx + 1}. ${replay.name}`, { color: 'cyan' });
      ui.display(`   Size: ${(replay.stats.size / 1024).toFixed(2)} KB`, { color: 'gray' });
      ui.display(`   Modified: ${replay.stats.mtime.toLocaleString()}`, { color: 'gray' });
      ui.display('');
    });
    
    ui.display('Usage: node view-replay.js <filename>', { color: 'yellow' });
    ui.display('   or: node view-replay.js ./replays/test_replay_123456.json', { color: 'yellow' });
    
  } else {
    // View specific replay
    let filename = args[0];
    
    // If just a number, use that index from the list
    if (/^\d+$/.test(filename)) {
      const replays = await listReplays();
      const index = parseInt(filename) - 1;
      if (index >= 0 && index < replays.length) {
        filename = replays[index].path;
      } else {
        ui.displayError(`Invalid replay index: ${filename}`);
        process.exit(1);
      }
    }
    
    // Add replays directory if not specified
    if (!filename.includes('/') && !filename.includes('\\')) {
      filename = path.join('./replays', filename);
    }
    
    if (!fs.existsSync(filename)) {
      ui.displayError(`Replay file not found: ${filename}`);
      process.exit(1);
    }
    
    await viewReplay(filename);
  }
}

main();
