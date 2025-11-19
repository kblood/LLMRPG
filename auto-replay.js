#!/usr/bin/env node
/**
 * Automated replay playback - plays through entire replay automatically
 */

import { ReplayFile } from './src/replay/ReplayFile.js';
import { DialogueInterface } from './src/ui/DialogueInterface.js';
import fs from 'fs';
import path from 'path';

const ui = new DialogueInterface().initialize();

async function autoPlayReplay(filename, speedMultiplier = 2.0) {
  try {
    ui.displayHeader('AUTO-REPLAY PLAYBACK');
    ui.displayInfo(`Loading: ${filename}`);
    ui.displayInfo(`Speed: ${speedMultiplier}x`);
    ui.display('');
    
    const replayData = await ReplayFile.load(filename);
    
    // Display header info
    ui.display('━'.repeat(60), { color: 'cyan' });
    ui.display(`Version: ${replayData.header.version} | Created: ${new Date(replayData.header.timestamp).toLocaleString()}`, { color: 'gray' });
    ui.display(`Frames: ${replayData.header.frameCount} | Events: ${replayData.header.eventCount} | LLM Calls: ${replayData.header.llmCallCount}`, { color: 'gray' });
    ui.display('━'.repeat(60), { color: 'cyan' });
    ui.display('');
    
    // Group events by frame
    const eventsByFrame = {};
    replayData.events.forEach(event => {
      if (!eventsByFrame[event.frame]) {
        eventsByFrame[event.frame] = { events: [], llmCalls: [] };
      }
      eventsByFrame[event.frame].events.push(event);
    });
    
    replayData.llmCalls.forEach(call => {
      if (!eventsByFrame[call.frame]) {
        eventsByFrame[call.frame] = { events: [], llmCalls: [] };
      }
      eventsByFrame[call.frame].llmCalls.push(call);
    });
    
    // Play through frames with events
    const frames = Object.keys(eventsByFrame).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      const timeInSeconds = (frame / 60).toFixed(2);
      const progress = ((i + 1) / frames.length * 100).toFixed(0);
      
      ui.display(`\n┌─ Frame ${frame} | ${timeInSeconds}s | ${progress}% ─────────────────`, { color: 'cyan' });
      
      // Display events
      eventsByFrame[frame].events.forEach(event => {
        displayEvent(event);
      });
      
      // Display LLM calls
      eventsByFrame[frame].llmCalls.forEach(call => {
        displayLLMCall(call);
      });
      
      ui.display('└' + '─'.repeat(59), { color: 'cyan' });
      
      // Wait before next frame (simulate playback speed)
      if (i < frames.length - 1) {
        const nextFrame = frames[i + 1];
        const frameDiff = nextFrame - frame;
        const waitTime = (frameDiff / 60) * 1000 / speedMultiplier;
        await sleep(Math.min(waitTime, 500)); // Cap at 500ms
      }
    }
    
    ui.display('');
    ui.displaySuccess('✓ Replay finished!');
    ui.display('');
    
  } catch (error) {
    ui.displayError(`Failed to play replay: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

function displayEvent(event) {
  const charId = event.characterId || 'system';
  
  switch (event.type) {
    case 'game_start':
      ui.display('│ 🎮 GAME START', { color: 'green' });
      if (event.data) {
        Object.entries(event.data).forEach(([key, value]) => {
          ui.display(`│   ${key}: ${value}`, { color: 'gray' });
        });
      }
      break;
      
    case 'dialogue_started':
      ui.display(`│ 💬 [${charId}] Started conversation with ${event.data?.npcId || 'unknown'}`, { color: 'cyan' });
      break;
      
    case 'dialogue_line':
      const speaker = event.data?.speaker || 'unknown';
      const text = event.data?.text || '';
      const speakerColor = speaker === 'player' ? 'green' : 'yellow';
      ui.display(`│   ${speaker.toUpperCase()}: "${text}"`, { color: speakerColor });
      break;
      
    case 'dialogue_ended':
      const duration = event.data?.duration || 0;
      ui.display(`│ 💬 [${charId}] Conversation ended (${duration} frames)`, { color: 'gray' });
      break;
      
    case 'conversation_started':
      ui.display(`│ 💬 Conversation: ${event.data?.playerId} ↔️  ${event.data?.npcId}`, { color: 'cyan' });
      break;
      
    case 'movement':
      ui.display(`│ 🚶 [${charId}] Moved to (${event.data?.x}, ${event.data?.y})`, { color: 'blue' });
      break;
      
    case 'action':
      ui.display(`│ ⚡ [${charId}] Action: ${event.data?.action}`, { color: 'yellow' });
      break;
      
    case 'quest_started':
      ui.display(`│ 📜 [${charId}] Quest started: ${event.data?.questId}`, { color: 'magenta' });
      break;
      
    case 'quest_completed':
      ui.display(`│ ✓ [${charId}] Quest completed: ${event.data?.questId}`, { color: 'green' });
      break;
      
    default:
      ui.display(`│ 📋 [${charId}] ${event.type}`, { color: 'gray' });
      if (event.data && Object.keys(event.data).length > 0) {
        const dataStr = JSON.stringify(event.data, null, 2);
        dataStr.split('\n').forEach(line => {
          ui.display(`│     ${line}`, { color: 'gray' });
        });
      }
  }
}

function displayLLMCall(call) {
  ui.display(`│ 🤖 LLM Call: ${call.characterId}`, { color: 'yellow' });
  
  if (call.prompt) {
    const promptPreview = call.prompt.substring(0, 100).replace(/\n/g, ' ');
    ui.display(`│   📝 Prompt: ${promptPreview}${call.prompt.length > 100 ? '...' : ''}`, { color: 'gray' });
  }
  
  if (call.response) {
    const lines = call.response.split('\n');
    ui.display(`│   💭 Response:`, { color: 'white' });
    lines.forEach(line => {
      if (line.trim()) {
        const truncated = line.length > 65 ? line.substring(0, 65) + '...' : line;
        ui.display(`│      ${truncated}`, { color: 'white' });
      }
    });
  }
  
  if (call.tokensUsed) {
    ui.display(`│   📊 Tokens: ${call.tokensUsed}`, { color: 'gray' });
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function listReplays() {
  const replayDir = './replays';
  
  if (!fs.existsSync(replayDir)) {
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
    ui.displayHeader('AVAILABLE REPLAYS');
    ui.display('');
    
    const replays = await listReplays();
    
    if (replays.length === 0) {
      ui.displayWarning('No replay files found');
      ui.display('Run a game to create replays', { color: 'gray' });
      process.exit(0);
    }
    
    replays.forEach((replay, idx) => {
      ui.display(`${idx + 1}. ${replay.name}`, { color: 'cyan' });
      ui.display(`   ${(replay.stats.size / 1024).toFixed(2)} KB | ${replay.stats.mtime.toLocaleString()}`, { color: 'gray' });
    });
    
    ui.display('');
    ui.display('Usage: node auto-replay.js <file|number> [speed]', { color: 'yellow' });
    ui.display('Example: node auto-replay.js 1        # Play first replay at 2x speed', { color: 'gray' });
    ui.display('Example: node auto-replay.js 1 1.0    # Play at normal speed', { color: 'gray' });
    ui.display('Example: node auto-replay.js 1 4.0    # Play at 4x speed', { color: 'gray' });
    process.exit(0);
  }

  let filename = args[0];
  const speed = args[1] ? parseFloat(args[1]) : 2.0;
  
  // If just a number, use that index
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
  
  await autoPlayReplay(filename, speed);
}

main();
