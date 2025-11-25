/**
 * Simple test to debug autonomous mode
 */

import { GameBackendIntegrated } from './electron/ipc/GameBackendIntegrated.js';

async function test() {
    console.log('Starting simple autonomous test...\n');
    
    const backend = new GameBackendIntegrated();
    
    // Track events with detailed logging
    backend.setUICallback((update) => {
        console.log('[UI UPDATE]', JSON.stringify(update, null, 2));
    });
    
    try {
        console.log('1. Initializing game...');
        await backend.initialize({
            seed: 12345,
            playerName: 'TestHero',
            theme: 'fantasy',
            model: 'granite4:3b'
        });
        console.log('✅ Game initialized\n');
        
        console.log('2. Getting game status...');
        const status = await backend.getStatus();
        console.log('Status:', JSON.stringify(status, null, 2));
        console.log('');
        
        console.log('3. Starting autonomous mode...');
        const result = await backend.startAutonomousMode({
            maxFrames: 5
        });
        console.log('Start result:', result);
        console.log('');
        
        // Wait for autonomous mode to run
        console.log('4. Waiting for 20 seconds for autonomous mode to run...');
        await new Promise(resolve => setTimeout(resolve, 20000));
        
        console.log('5. Checking autonomous status...');
        const autoStatus = backend.getAutonomousStatus();
        console.log('Autonomous status:', JSON.stringify(autoStatus, null, 2));
        console.log('');
        
        console.log('6. Stopping autonomous mode...');
        backend.stopAutonomousMode();
        
        console.log('7. Cleaning up...');
        await backend.cleanup();
        
        console.log('\n✅ Test complete!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error(error.stack);
        process.exit(1);
    }
    
    process.exit(0);
}

test();
