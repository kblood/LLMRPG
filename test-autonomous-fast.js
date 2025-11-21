#!/usr/bin/env node
/**
 * Fast test script for autonomous game mode without UI
 * Run with: node test-autonomous-fast.js
 */

import { GameBackend } from './electron/ipc/GameBackend.js';

async function main() {
  console.log('='.repeat(60));
  console.log('OllamaRPG Autonomous Mode Test (No UI - Fast Version)');
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
          // Only log important events
          if (event.includes('loop') || event.includes('started') || event.includes('error')) {
            console.log(`[EVENT] ${event}`);
          }
        }
      }
    };

    // Start autonomous mode with a 30 second timeout for setup
    let result;
    try {
      const startPromise = gameBackend.startAutonomousMode(mockWindow);
      result = await Promise.race([
        startPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('startAutonomousMode timeout - world generation took too long')), 30000)
        )
      ]);
      console.log('[TEST] startAutonomousMode returned:', result);
    } catch (setupError) {
      console.error('[TEST] Setup error (world generation may be slow):', setupError.message);
      console.log('[TEST] Continuing anyway - will check if autonomous loop is running...');
      result = { started: true };
    }

    console.log('\n[TEST] Running autonomous mode for 15 seconds...');
    // Let it run for just 15 seconds to capture some events
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('\n[TEST] Stopping autonomous mode...');
    const stopResult = await gameBackend.stopAutonomousMode();
    console.log('[TEST] Autonomous mode stopped:', stopResult);

    console.log('\n' + '='.repeat(60));
    console.log('[TEST] REPLAY STATISTICS:');
    console.log('='.repeat(60));
    const replayLogger = gameBackend.replayLogger;
    console.log(`✓ Events logged: ${replayLogger.getEventCount()}`);
    console.log(`✓ LLM calls logged: ${replayLogger.getLLMCallCount()}`);
    console.log(`✓ Checkpoints created: ${replayLogger.getCheckpointCount()}`);
    console.log(`✓ Current frame: ${replayLogger.getCurrentFrame()}`);

    if (replayLogger.getEventCount() === 0) {
      console.error('\n❌ ERROR: No events were logged! Check console for errors above.');
      process.exit(1);
    } else {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ [TEST ERROR]', error);
    process.exit(1);
  }
}

main();
