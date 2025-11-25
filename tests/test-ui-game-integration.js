/**
 * Integration test that simulates UI by subscribing to game state updates
 * This tests that the game properly publishes state updates that the UI would receive
 */

import { GameBackendIntegrated } from '../electron/ipc/GameBackendIntegrated.js';
import { TextUISimulator } from './test-ui-text-simulator.js';
import { OllamaService } from '../src/services/OllamaService.js';

async function testUIIntegration() {
  console.log('Starting UI Integration Test...\n');

  // Check Ollama availability
  const ollamaService = OllamaService.getInstance({ baseUrl: 'http://localhost:11434' });
  const isAvailable = await ollamaService.isAvailable();
  
  if (!isAvailable) {
    console.error('❌ Ollama is not available at http://localhost:11434');
    console.error('Please start Ollama before running this test.');
    process.exit(1);
  }

  console.log('✅ Ollama is available\n');

  // Create UI simulator
  const uiSimulator = new TextUISimulator();
  uiSimulator.start();

  // Create game backend
  const gameBackend = new GameBackendIntegrated();
  
  // Set UI callback FIRST before initialization
  gameBackend.setUICallback((update) => {
    // This simulates what the UI would receive via IPC
    if (update.type === 'state_update') {
      // StatePublisher passes: gameState, eventType, metadata
      // We need to extract these from the update object
      uiSimulator.handleStateUpdate(update.eventType, update.state, update);
    } else if (update.type === 'game_event') {
      uiSimulator.handleGameEvent(update.event?.type, update.event);
    }
  });

  const gameOptions = {
    playerName: 'Test Hero',
    seed: Date.now(),
    model: 'granite4:3b',
    theme: 'fantasy'
  };
  
  try {
    // Initialize game
    console.log('Initializing game...\n');
    await gameBackend.initialize(gameOptions);
    console.log('✅ Game initialized\n');

    // Start autonomous mode
    console.log('Starting autonomous mode...\n');
    await gameBackend.startAutonomousMode();

    // Let it run for a while
    const runTimeMinutes = 2;
    console.log(`\nRunning game for ${runTimeMinutes} minutes...\n`);
    
    await new Promise(resolve => {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const remaining = (runTimeMinutes * 60) - elapsed;
        
        if (remaining <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });

    // Stop autonomous mode
    console.log('\n\nStopping autonomous mode...\n');
    gameBackend.stopAutonomousMode();

    // Stop UI simulator
    uiSimulator.stop();

    // Validate that we received updates
    console.log('\n' + '='.repeat(80));
    console.log('VALIDATION RESULTS'.center(80));
    console.log('='.repeat(80));

    const validationResults = {
      conversationsReceived: uiSimulator.conversationLog.length > 0,
      actionsReceived: uiSimulator.actionLog.length > 0,
      combatReceived: uiSimulator.combatLog.length > 0,
      questsReceived: uiSimulator.questLog.length > 0,
      framesReceived: uiSimulator.frameCount > 0,
    };

    Object.entries(validationResults).forEach(([key, value]) => {
      const status = value ? '✅' : '❌';
      console.log(`${status} ${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}`);
    });

    const allPassed = Object.values(validationResults).every(v => v);
    
    if (allPassed) {
      console.log('\n✅ All validations passed! UI would receive all game updates.');
    } else {
      console.log('\n❌ Some validations failed. UI may not receive all updates.');
    }

    console.log('='.repeat(80) + '\n');

    // Cleanup
    await gameBackend.cleanup();

    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error(error.stack);
    
    uiSimulator.stop();
    
    try {
      await gameBackend.cleanup();
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }
    
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n\nReceived SIGINT, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\nReceived SIGTERM, cleaning up...');
  process.exit(0);
});

// Run the test
testUIIntegration();
