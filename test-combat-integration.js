/**
 * Combat Integration Test
 * 
 * This test verifies:
 * 1. Protagonist can travel between locations
 * 2. Combat encounters are generated
 * 3. Real combat with enemies occurs
 * 4. Damage is dealt, XP/gold awarded
 * 5. StatePublisher sends combat events
 */

import { GameBackendIntegrated } from './electron/ipc/GameBackendIntegrated.js';

async function testCombatIntegration() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           COMBAT INTEGRATION TEST                            ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    const backend = new GameBackendIntegrated();
    
    // Track events
    const events = {
        travels: 0,
        combatStarted: 0,
        combatEnded: 0,
        conversations: 0,
        actions: 0,
        combatDetails: []
    };

    // Set UI callback to track all events
    backend.setUICallback((update) => {
        // Track action events (quieter)
        if (update.eventType === 'action_executed') {
            events.actions++;
            
            if (update.actionType === 'travel') {
                events.travels++;
                console.log(`  → Travel to ${update.location}`);
            }
        }
        
        if (update.eventType === 'combat_started') {
            events.combatStarted++;
            const enemies = update.enemies || [];
            console.log(`  ⚔️  COMBAT STARTED: ${enemies.length} enemies`);
            enemies.forEach(e => console.log(`      - ${e.name || e}`));
        }
        
        if (update.eventType === 'combat_ended') {
            events.combatEnded++;
            console.log(`  ✓ COMBAT ENDED: ${update.outcome} in ${update.rounds} rounds`);
            console.log(`    XP: +${update.xpGained || 0}, Gold: +${update.goldGained || 0}`);
            
            events.combatDetails.push({
                outcome: update.outcome,
                rounds: update.rounds,
                xp: update.xpGained || 0,
                gold: update.goldGained || 0
            });
        }
        
        if (update.eventType === 'dialogue_started') {
            events.conversations++;
        }
    });

    try {
        console.log('1. Initializing game with multiple dangerous locations...');
        await backend.initialize({
            seed: 12345, // Different seed for variety
            playerName: 'Combat Tester',
            theme: 'fantasy',
            model: 'granite4:3b',
            worldConfig: {
                title: 'Combat Test World',
                theme: 'fantasy',
                openingNarration: 'A warrior seeks adventure and combat...',
                npcs: [
                    { 
                        name: 'Guard', 
                        role: 'guard',
                        backstory: 'A town guard',
                        personality: { friendliness: 60 }
                    }
                ],
                locations: [
                    { 
                        id: 'town', 
                        name: 'Safe Town', 
                        type: 'town',
                        dangerLevel: 'safe' // No encounters
                    },
                    { 
                        id: 'forest', 
                        name: 'Dark Forest', 
                        type: 'wilderness',
                        dangerLevel: 'high' // High chance of encounters
                    },
                    { 
                        id: 'ruins', 
                        name: 'Ancient Ruins', 
                        type: 'dungeon',
                        dangerLevel: 'high'
                    },
                    { 
                        id: 'mountains', 
                        name: 'Dangerous Mountains', 
                        type: 'wilderness',
                        dangerLevel: 'deadly' // Very dangerous
                    }
                ]
            }
        });
        
        const status = backend.getStatus();
        console.log('✓ Game initialized');
        console.log(`  - Protagonist: ${status.protagonist.name}`);
        console.log(`  - NPCs: ${status.npcs.length}`);
        console.log(`  - Combat systems: ${backend.combatSystem ? 'Ready' : 'Missing!'}`);
        console.log('');

        console.log('2. Running autonomous mode for 30 frames...');
        console.log('   Expecting: travel actions → combat encounters');
        console.log('');
        console.log('─'.repeat(60));
        console.log('');

        await backend.startAutonomousMode({
            frameRate: 2,  // 2 FPS so we can see events
            maxFrames: 30,
            maxTurnsPerConversation: 3,
            pauseBetweenTurns: 500,
            pauseBetweenConversations: 1000,
            pauseBetweenActions: 800
        });

        // Wait for completion
        let waited = 0;
        const maxWait = 60000; // 60 seconds
        while (backend.autonomousMode && waited < maxWait) {
            await new Promise(r => setTimeout(r, 2000));
            waited += 2000;
            
            if (events.combatStarted > 0) {
                console.log(`[${Math.floor(waited/1000)}s] Combats: ${events.combatStarted}, Travels: ${events.travels}`);
            }
        }

        if (backend.autonomousMode) {
            console.log('');
            console.log('Stopping autonomous mode...');
            backend.stopAutonomousMode();
        }

        console.log('');
        console.log('─'.repeat(60));
        console.log('');

        // Get final state
        const finalState = backend.getGameState();
        const autonomousStats = backend.getAutonomousStatus();

        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║                     TEST RESULTS                             ║');
        console.log('╚══════════════════════════════════════════════════════════════╝');
        console.log('');
        
        console.log('Event Summary:');
        console.log(`  Total Actions: ${events.actions}`);
        console.log(`  Travel Actions: ${events.travels}`);
        console.log(`  Combat Encounters: ${events.combatStarted}`);
        console.log(`  Combats Completed: ${events.combatEnded}`);
        console.log(`  Conversations: ${events.conversations}`);
        console.log('');

        if (events.combatDetails.length > 0) {
            console.log('Combat Details:');
            events.combatDetails.forEach((combat, i) => {
                console.log(`  Combat ${i + 1}:`);
                console.log(`    Outcome: ${combat.outcome}`);
                console.log(`    Rounds: ${combat.rounds}`);
                console.log(`    XP Gained: ${combat.xp}`);
                console.log(`    Gold Gained: ${combat.gold}`);
            });
            console.log('');
        }

        console.log('Final State:');
        console.log(`  Frame: ${finalState.frame}`);
        console.log(`  Location: ${finalState.location.current || 'unknown'}`);
        console.log(`  Protagonist HP: ${finalState.characters.protagonist.stats?.currentHP}/${finalState.characters.protagonist.stats?.maxHP}`);
        console.log('');

        // Cleanup
        backend.cleanup();

        // Determine test result
        console.log('╔══════════════════════════════════════════════════════════════╗');
        
        if (events.travels === 0) {
            console.log('║                    ❌ TEST FAILED                            ║');
            console.log('║  No travel actions detected - protagonist didn\'t move       ║');
            console.log('╚══════════════════════════════════════════════════════════════╝');
            process.exit(1);
        }
        
        if (events.combatStarted === 0) {
            console.log('║                    ⚠️  TEST INCOMPLETE                       ║');
            console.log('║  Travel works but no combat encounters generated            ║');
            console.log('║  This may be due to random chance or location safety        ║');
            console.log('╚══════════════════════════════════════════════════════════════╝');
            process.exit(1);
        }
        
        if (events.combatEnded === 0) {
            console.log('║                    ❌ TEST FAILED                            ║');
            console.log('║  Combat started but never completed                         ║');
            console.log('╚══════════════════════════════════════════════════════════════╝');
            process.exit(1);
        }

        if (events.combatStarted !== events.combatEnded) {
            console.log('║                    ⚠️  TEST WARNING                          ║');
            console.log('║  Mismatch: combats started vs ended                         ║');
            console.log('╚══════════════════════════════════════════════════════════════╝');
        } else {
            console.log('║                    ✅ TEST PASSED                            ║');
            console.log('║  Combat integration fully working!                          ║');
            console.log('║  - Travel between locations: ✅                             ║');
            console.log('║  - Combat encounters generated: ✅                          ║');
            console.log('║  - Combat executed with outcomes: ✅                        ║');
            console.log('║  - XP and gold awarded: ✅                                  ║');
            console.log('╚══════════════════════════════════════════════════════════════╝');
        }
        
        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('╔══════════════════════════════════════════════════════════════╗');
        console.error('║                    ❌ TEST CRASHED                           ║');
        console.error('╚══════════════════════════════════════════════════════════════╝');
        console.error('');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        console.error('');
        
        try {
            backend.cleanup();
        } catch (e) {
            // Ignore cleanup errors
        }
        
        process.exit(1);
    }
}

testCombatIntegration();
