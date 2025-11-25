/**
 * Test UI Integration - Verifies StatePublisher -> GameBackendIntegrated -> UI flow
 * 
 * This test creates a headless game session and verifies that:
 * 1. StatePublisher publishes updates
 * 2. GameBackendIntegrated receives them
 * 3. The UI callback is invoked
 * 
 * Run with: node test-ui-integration.js
 */

import { GameBackendIntegrated } from './electron/ipc/GameBackendIntegrated.js';

console.log('='.repeat(80));
console.log('UI Integration Test - Verifying State Flow');
console.log('='.repeat(80));
console.log('');

// Create backend
const backend = new GameBackendIntegrated();

// Track UI callbacks
let uiCallbackCount = 0;
const uiUpdates = [];

// Set UI callback
backend.setUICallback((update) => {
  uiCallbackCount++;
  uiUpdates.push({ count: uiCallbackCount, type: update.type, eventType: update.eventType });
  console.log(`✓ UI Callback #${uiCallbackCount}: ${update.type} - ${update.eventType || update.event?.type || 'N/A'}`);
});

console.log('[Test] UI callback set');
console.log('');

// Initialize game
console.log('[Test] Initializing game backend...');
try {
  await backend.initialize({
    seed: Date.now(),
    playerName: 'TestHero',
    theme: 'fantasy',
    model: 'granite4:3b'
  });
  
  console.log('[Test] Backend initialized successfully');
  console.log('');
  
  // Start autonomous mode for a few seconds
  console.log('[Test] Starting autonomous mode for 10 seconds...');
  await backend.startAutonomousMode({
    enableEventCallback: true
  });
  
  // Wait 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Stop autonomous mode
  console.log('[Test] Stopping autonomous mode...');
  await backend.stopAutonomousMode();
  
  console.log('');
  console.log('='.repeat(80));
  console.log('Test Results');
  console.log('='.repeat(80));
  console.log(`Total UI callbacks received: ${uiCallbackCount}`);
  console.log('');
  
  if (uiCallbackCount > 0) {
    console.log('✓ SUCCESS: UI callbacks ARE being invoked!');
    console.log('');
    console.log('Sample updates:');
    uiUpdates.slice(0, 5).forEach(u => {
      console.log(`  - Update #${u.count}: ${u.type} - ${u.eventType || 'N/A'}`);
    });
  } else {
    console.log('✗ FAILURE: NO UI callbacks were invoked!');
    console.log('This means StatePublisher is not calling the subscriber callbacks.');
  }
  
  console.log('');
  console.log('='.repeat(80));
  
  // Cleanup
  await backend.cleanup();
  process.exit(uiCallbackCount > 0 ? 0 : 1);
  
} catch (error) {
  console.error('[Test] Error:', error);
  process.exit(1);
}
