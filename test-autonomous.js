#!/usr/bin/env node
/**
 * Test script for autonomous game mode without UI
 * Run with: node test-autonomous.js
 */

import { GameBackend } from './electron/ipc/GameBackend.js';

async function main() {
  console.log('='.repeat(60));
  console.log('OllamaRPG Autonomous Mode Test (No UI)');
  console.log('='.repeat(60));

  try {
    // Create game backend
    const gameBackend = new GameBackend();

    console.log('\n[TEST] Initializing game backend...');
    await gameBackend.initialize();

    console.log('\n[TEST] Starting autonomous mode...');

    // Create a mock window object since we don't have a real Electron window
    const mockWindow = {
      isDestroyed: () => false,
      webContents: {
        send: (event, data) => {
          // Log important events
          if (event.includes('action') || event.includes('time-update') || event.includes('message')) {
            console.log(`[UI EVENT] ${event}`, data);
          }
        }
      }
    };

    const result = await gameBackend.startAutonomousMode(mockWindow);
    console.log('[TEST] Autonomous mode started:', result);

    console.log('\n[TEST] Running autonomous mode for 30 seconds...');
    // Let it run for 30 seconds
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('\n[TEST] Stopping autonomous mode...');
    const stopResult = await gameBackend.stopAutonomousMode();
    console.log('[TEST] Autonomous mode stopped:', stopResult);

    console.log('\n[TEST] Checking replay logs...');
    const replayLogger = gameBackend.replayLogger;
    console.log(`  Events logged: ${replayLogger.getEventCount()}`);
    console.log(`  LLM calls logged: ${replayLogger.getLLMCallCount()}`);
    console.log(`  Checkpoints created: ${replayLogger.getCheckpointCount()}`);

    console.log('\n[TEST] Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[TEST ERROR]', error);
    process.exit(1);
  }
}

main();
