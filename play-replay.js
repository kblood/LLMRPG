#!/usr/bin/env node
/**
 * Interactive replay playback system
 * Allows you to watch a recorded game session with playback controls
 */

import { ReplayFile } from './src/replay/ReplayFile.js';
import { DialogueInterface } from './src/ui/DialogueInterface.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const ui = new DialogueInterface().initialize();

class ReplayPlayer {
  constructor(replayData) {
    this.replay = replayData;
    this.currentFrame = 0;
    this.currentEventIndex = 0;
    this.isPaused = false;
    this.playbackSpeed = 1.0; // 1.0 = normal speed
    this.frameRate = 60; // frames per second
  }

  /**
   * Display the current frame information
   */
  displayCurrentFrame() {
    const timeInSeconds = (this.currentFrame / this.frameRate).toFixed(2);
    const progress = (this.currentFrame / this.replay.header.frameCount * 100).toFixed(1);
    
    ui.display(`\n${'='.repeat(60)}`);
    ui.display(`Frame: ${this.currentFrame}/${this.replay.header.frameCount} | Time: ${timeInSeconds}s | Progress: ${progress}%`, { color: 'cyan' });
    
    // Find and display events at current frame
    const eventsAtFrame = this.replay.events.filter(e => e.frame === this.currentFrame);
    if (eventsAtFrame.length > 0) {
      ui.display('');
      eventsAtFrame.forEach(event => {
        this.displayEvent(event);
      });
    }

    // Find and display LLM calls at current frame
    const llmCallsAtFrame = this.replay.llmCalls.filter(c => c.frame === this.currentFrame);
    if (llmCallsAtFrame.length > 0) {
      ui.display('');
      ui.display('🤖 LLM INTERACTION', { color: 'yellow' });
      llmCallsAtFrame.forEach(call => {
        this.displayLLMCall(call);
      });
    }

    // Check for checkpoints
    const checkpointAtFrame = this.replay.checkpoints.find(c => c.frame === this.currentFrame);
    if (checkpointAtFrame) {
      ui.display('');
      ui.display('💾 CHECKPOINT SAVED', { color: 'magenta' });
    }
  }

  /**
   * Display an event in a formatted way
   */
  displayEvent(event) {
    const charId = event.characterId || 'system';
    
    switch (event.type) {
      case 'game_start':
        ui.displaySuccess(`🎮 GAME START`);
        if (event.data) {
          Object.entries(event.data).forEach(([key, value]) => {
            ui.display(`  ${key}: ${value}`, { color: 'gray' });
          });
        }
        break;
        
      case 'dialogue_started':
        ui.display(`💬 [${charId}] Started conversation with ${event.data?.npcId || 'unknown'}`, { color: 'cyan' });
        break;
        
      case 'dialogue_line':
        const speaker = event.data?.speaker || 'unknown';
        const text = event.data?.text || '';
        const speakerColor = speaker === 'player' ? 'green' : 'yellow';
        ui.display(`  ${speaker.toUpperCase()}: "${text}"`, { color: speakerColor });
        break;
        
      case 'dialogue_ended':
        const duration = event.data?.duration || 0;
        ui.display(`💬 [${charId}] Conversation ended (${duration} frames)`, { color: 'gray' });
        break;
        
      case 'conversation_started':
        ui.display(`💬 Conversation: ${event.data?.playerId} ↔️ ${event.data?.npcId}`, { color: 'cyan' });
        break;
        
      case 'movement':
        ui.display(`🚶 [${charId}] Moved to ${event.data?.x}, ${event.data?.y}`, { color: 'blue' });
        break;
        
      case 'action':
        ui.display(`⚡ [${charId}] Action: ${event.data?.action}`, { color: 'yellow' });
        break;
        
      default:
        ui.display(`📋 [${charId}] ${event.type}`, { color: 'gray' });
        if (event.data && Object.keys(event.data).length > 0) {
          ui.display(`    ${JSON.stringify(event.data)}`, { color: 'gray' });
        }
    }
  }

  /**
   * Display an LLM call in a formatted way
   */
  displayLLMCall(call) {
    ui.display(`  Character: ${call.characterId}`, { color: 'yellow' });
    
    if (call.prompt) {
      ui.display(`  📝 Prompt:`, { color: 'gray' });
      const promptLines = call.prompt.split('\n').slice(0, 3);
      promptLines.forEach(line => {
        const truncated = line.length > 70 ? line.substring(0, 70) + '...' : line;
        ui.display(`     ${truncated}`, { color: 'gray' });
      });
      if (call.prompt.split('\n').length > 3) {
        ui.display(`     ... (${call.prompt.split('\n').length - 3} more lines)`, { color: 'gray' });
      }
    }
    
    if (call.response) {
      ui.display(`  💭 Response:`, { color: 'white' });
      const responseLines = call.response.split('\n');
      responseLines.forEach(line => {
        const truncated = line.length > 70 ? line.substring(0, 70) + '...' : line;
        ui.display(`     ${truncated}`, { color: 'white' });
      });
    }
    
    if (call.tokensUsed) {
      ui.display(`  📊 Tokens: ${call.tokensUsed}`, { color: 'gray' });
    }
  }

  /**
   * Advance to the next frame
   */
  nextFrame() {
    if (this.currentFrame < this.replay.header.frameCount) {
      this.currentFrame++;
      return true;
    }
    return false;
  }

  /**
   * Go back to previous frame
   */
  previousFrame() {
    if (this.currentFrame > 0) {
      this.currentFrame--;
      return true;
    }
    return false;
  }

  /**
   * Jump to a specific frame
   */
  jumpToFrame(frame) {
    if (frame >= 0 && frame <= this.replay.header.frameCount) {
      this.currentFrame = frame;
      return true;
    }
    return false;
  }

  /**
   * Find the next frame with an event
   */
  nextEvent() {
    for (let i = this.currentFrame + 1; i <= this.replay.header.frameCount; i++) {
      const hasEvent = this.replay.events.some(e => e.frame === i) || 
                       this.replay.llmCalls.some(c => c.frame === i);
      if (hasEvent) {
        this.currentFrame = i;
        return true;
      }
    }
    return false;
  }

  /**
   * Find the previous frame with an event
   */
  previousEvent() {
    for (let i = this.currentFrame - 1; i >= 0; i--) {
      const hasEvent = this.replay.events.some(e => e.frame === i) || 
                       this.replay.llmCalls.some(c => c.frame === i);
      if (hasEvent) {
        this.currentFrame = i;
        return true;
      }
    }
    return false;
  }

  /**
   * Display playback controls
   */
  displayControls() {
    ui.display('');
    ui.display('Controls:', { color: 'cyan' });
    ui.display('  [SPACE]   - Play/Pause', { color: 'gray' });
    ui.display('  [→]       - Next frame', { color: 'gray' });
    ui.display('  [←]       - Previous frame', { color: 'gray' });
    ui.display('  [N]       - Next event', { color: 'gray' });
    ui.display('  [P]       - Previous event', { color: 'gray' });
    ui.display('  [J]       - Jump to frame', { color: 'gray' });
    ui.display('  [S]       - Change speed', { color: 'gray' });
    ui.display('  [I]       - Show info', { color: 'gray' });
    ui.display('  [Q]       - Quit', { color: 'gray' });
    ui.display('');
  }

  /**
   * Display replay information
   */
  displayInfo() {
    ui.display('');
    ui.displayHeader('REPLAY INFORMATION');
    ui.display(`Version:      ${this.replay.header.version}`, { color: 'gray' });
    ui.display(`Created:      ${new Date(this.replay.header.timestamp).toLocaleString()}`, { color: 'gray' });
    ui.display(`Game Seed:    ${this.replay.header.gameSeed}`, { color: 'gray' });
    ui.display(`Total Frames: ${this.replay.header.frameCount}`, { color: 'gray' });
    ui.display(`Duration:     ${(this.replay.header.frameCount / this.frameRate).toFixed(2)}s`, { color: 'gray' });
    ui.display(`Events:       ${this.replay.header.eventCount}`, { color: 'gray' });
    ui.display(`LLM Calls:    ${this.replay.header.llmCallCount}`, { color: 'gray' });
    ui.display(`Checkpoints:  ${this.replay.header.checkpointCount}`, { color: 'gray' });
    ui.display(`Speed:        ${this.playbackSpeed}x`, { color: 'gray' });
    ui.display('');
  }
}

async function playReplay(filename) {
  try {
    ui.displayHeader('REPLAY PLAYBACK');
    ui.displayInfo(`Loading: ${filename}`);
    
    const replayData = await ReplayFile.load(filename);
    const player = new ReplayPlayer(replayData);
    
    ui.displaySuccess('Replay loaded!');
    player.displayInfo();
    player.displayControls();
    
    // Setup readline for interactive input
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    let isPlaying = false;
    let playInterval = null;

    function startPlayback() {
      if (playInterval) return;
      
      isPlaying = true;
      ui.displayInfo('▶️  Playing...');
      
      playInterval = setInterval(() => {
        if (!player.nextFrame()) {
          stopPlayback();
          ui.displaySuccess('Replay finished!');
          ui.display('Press Q to quit or J to jump to a frame', { color: 'gray' });
        } else {
          player.displayCurrentFrame();
        }
      }, (1000 / player.frameRate) / player.playbackSpeed);
    }

    function stopPlayback() {
      if (playInterval) {
        clearInterval(playInterval);
        playInterval = null;
      }
      isPlaying = false;
      ui.displayInfo('⏸️  Paused');
    }

    // Handle keyboard input
    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        return;
      }

      switch (key.name) {
        case 'space':
          if (isPlaying) {
            stopPlayback();
          } else {
            startPlayback();
          }
          break;

        case 'right':
          stopPlayback();
          if (player.nextFrame()) {
            player.displayCurrentFrame();
          } else {
            ui.displayWarning('At end of replay');
          }
          break;

        case 'left':
          stopPlayback();
          if (player.previousFrame()) {
            player.displayCurrentFrame();
          } else {
            ui.displayWarning('At beginning of replay');
          }
          break;

        case 'n':
          stopPlayback();
          if (player.nextEvent()) {
            player.displayCurrentFrame();
          } else {
            ui.displayWarning('No more events');
          }
          break;

        case 'p':
          stopPlayback();
          if (player.previousEvent()) {
            player.displayCurrentFrame();
          } else {
            ui.displayWarning('No previous events');
          }
          break;

        case 'j':
          stopPlayback();
          ui.display('\nEnter frame number (0-' + player.replay.header.frameCount + '): ', { color: 'yellow' });
          // This would need proper async input handling
          break;

        case 's':
          stopPlayback();
          // Cycle through speeds: 0.5x, 1x, 2x, 4x
          const speeds = [0.5, 1.0, 2.0, 4.0];
          const currentIndex = speeds.indexOf(player.playbackSpeed);
          player.playbackSpeed = speeds[(currentIndex + 1) % speeds.length];
          ui.displayInfo(`Speed: ${player.playbackSpeed}x`);
          break;

        case 'i':
          stopPlayback();
          player.displayInfo();
          player.displayControls();
          break;

        case 'q':
          cleanup();
          break;
      }
    });

    function cleanup() {
      stopPlayback();
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      ui.display('\n');
      ui.displaySuccess('Thanks for watching!');
      process.exit(0);
    }

    // Start at frame 0
    player.displayCurrentFrame();
    
  } catch (error) {
    ui.displayError(`Failed to play replay: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
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
      ui.display(`   Size: ${(replay.stats.size / 1024).toFixed(2)} KB`, { color: 'gray' });
      ui.display(`   Modified: ${replay.stats.mtime.toLocaleString()}`, { color: 'gray' });
      ui.display('');
    });
    
    ui.display('Usage: node play-replay.js <filename>', { color: 'yellow' });
    ui.display('   or: node play-replay.js 1         (play first in list)', { color: 'yellow' });
    process.exit(0);
  }

  let filename = args[0];
  
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
  
  await playReplay(filename);
}

main();
