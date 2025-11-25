/**
 * Long Session Test - Verify Travel & Combat Integration
 * 
 * This test runs the game for an extended period to ensure:
 * 1. Protagonist travels between multiple locations
 * 2. Combat encounters occur naturally
 * 3. Combat system functions properly
 * 4. No errors during extended gameplay
 */

import { GameBackendIntegrated } from './electron/ipc/GameBackendIntegrated.js';

async function runLongSession() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║          LONG SESSION TEST - TRAVEL & COMBAT                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    const backend = new GameBackendIntegrated();
    
    // Track comprehensive stats
    const stats = {
        frames: 0,
        travels: 0,
        locationsVisited: new Set(),
        combatStarted: 0,
        combatEnded: 0,
        enemiesDefeated: 0,
        damageDealt: 0,
        damageTaken: 0,
        xpGained: 0,
        goldGained: 0,
        conversations: 0,
        actions: 0,
        errors: [],
        combatDetails: []
    };

    let lastLocation = null;

    // Set UI callback to track all events
    backend.setUICallback((update) => {
        try {
            // Track frames
            if (update.state?.frame !== undefined) {
                stats.frames = update.state.frame;
            }

            // Track actions
            if (update.eventType === 'action_executed') {
                stats.actions++;
                
                if (update.actionType === 'travel' && update.success) {
                    stats.travels++;
                    const loc = update.location || update.destination;
                    if (loc) {
                        stats.locationsVisited.add(loc);
                        if (lastLocation !== loc) {
                            console.log(`\n📍 TRAVEL #${stats.travels}: ${lastLocation || 'Start'} → ${loc}`);
                            lastLocation = loc;
                        }
                    }
                }
            }
            
            // Track combat start
            if (update.eventType === 'combat_started') {
                stats.combatStarted++;
                const enemies = update.enemies || [];
                console.log(`\n⚔️  COMBAT #${stats.combatStarted} STARTED`);
                console.log(`   Enemies: ${enemies.map(e => e.name || e).join(', ')}`);
                
                stats.combatDetails.push({
                    combatNumber: stats.combatStarted,
                    enemies: enemies.map(e => e.name || e),
                    startFrame: stats.frames
                });
            }

            // Track combat end
            if (update.eventType === 'combat_ended') {
                stats.combatEnded++;
                const victory = update.victory || update.result === 'victory';
                const xp = update.xpGained || 0;
                const gold = update.goldGained || 0;
                
                if (victory) {
                    stats.enemiesDefeated += (update.enemies?.length || 1);
                    stats.xpGained += xp;
                    stats.goldGained += gold;
                }
                
                console.log(`   COMBAT ENDED: ${victory ? '✅ Victory' : '❌ Defeat'}`);
                if (xp > 0) console.log(`   +${xp} XP, +${gold} Gold`);
                
                // Update combat details
                const detail = stats.combatDetails[stats.combatDetails.length - 1];
                if (detail) {
                    detail.victory = victory;
                    detail.xpGained = xp;
                    detail.goldGained = gold;
                    detail.endFrame = stats.frames;
                }
            }

            // Track damage
            if (update.eventType === 'combat_damage') {
                if (update.source === 'player' || update.isPlayerAttack) {
                    stats.damageDealt += (update.damage || 0);
                } else {
                    stats.damageTaken += (update.damage || 0);
                }
            }

            // Track conversations
            if (update.eventType === 'conversation_started') {
                stats.conversations++;
            }

        } catch (error) {
            stats.errors.push({
                frame: stats.frames,
                error: error.message,
                stack: error.stack
            });
            console.error(`\n❌ Error at frame ${stats.frames}:`, error.message);
        }
    });

    console.log('Starting game session...\n');
    console.log('Configuration:');
    console.log('  - Theme: fantasy');
    console.log('  - Player: Aldric Ironheart');
    console.log('  - Max Frames: 200 (or until significant activity)');
    console.log('  - Frame Delay: 1000ms');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Initialize game
    await backend.initialize({
        seed: Date.now(),
        playerName: 'Aldric Ironheart',
        theme: 'fantasy',
        model: 'granite4:3b'
    });

    // Start autonomous mode
    await backend.startAutonomousMode({
        maxFrames: 500, // Give plenty of time for exploration and combat
        frameRate: 2 // 2 FPS for faster testing
    });

    // Run for enough time to see travel and combat
    const targetStats = {
        minTravels: 3,      // At least 3 location changes
        minCombats: 2,      // At least 2 combat encounters
        maxFrames: 200,     // Max frames to run
        checkInterval: 10000 // Check every 10 seconds
    };

    let checksRun = 0;
    const maxChecks = 30; // Max 5 minutes

    console.log('Running game session...\n');

    // Run until we hit targets or timeout
    while (checksRun < maxChecks) {
        await new Promise(resolve => setTimeout(resolve, targetStats.checkInterval));
        checksRun++;

        // Print progress
        console.log(`\n┌─ Progress Check #${checksRun} (Frame ${stats.frames}) ─────────────────┐`);
        console.log(`│ Travels: ${stats.travels}/${targetStats.minTravels} | Combats: ${stats.combatStarted}/${targetStats.minCombats} | Actions: ${stats.actions}`);
        console.log(`└──────────────────────────────────────────────────────────────┘`);

        // Check if we've met targets
        if (stats.travels >= targetStats.minTravels && 
            stats.combatStarted >= targetStats.minCombats) {
            console.log('\n✅ Target stats achieved!');
            break;
        }

        // Check if we've exceeded max frames
        if (stats.frames >= targetStats.maxFrames) {
            console.log('\n⚠️  Max frames reached');
            break;
        }

        // Check for errors
        if (stats.errors.length > 5) {
            console.log('\n❌ Too many errors, stopping');
            break;
        }
    }

    // Stop the game
    console.log('\nStopping game session...');
    backend.stopAutonomousMode();
    await backend.cleanup();

    // Print final report
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL REPORT                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📊 Statistics:');
    console.log(`  Total Frames:        ${stats.frames}`);
    console.log(`  Total Actions:       ${stats.actions}`);
    console.log(`  Travels:             ${stats.travels}`);
    console.log(`  Locations Visited:   ${stats.locationsVisited.size} (${Array.from(stats.locationsVisited).join(', ')})`);
    console.log(`  Conversations:       ${stats.conversations}`);
    console.log('');
    console.log('⚔️  Combat Statistics:');
    console.log(`  Combat Started:      ${stats.combatStarted}`);
    console.log(`  Combat Ended:        ${stats.combatEnded}`);
    console.log(`  Enemies Defeated:    ${stats.enemiesDefeated}`);
    console.log(`  Damage Dealt:        ${stats.damageDealt}`);
    console.log(`  Damage Taken:        ${stats.damageTaken}`);
    console.log(`  XP Gained:           ${stats.xpGained}`);
    console.log(`  Gold Gained:         ${stats.goldGained}`);
    console.log('');

    if (stats.combatDetails.length > 0) {
        console.log('⚔️  Combat Details:');
        stats.combatDetails.forEach((combat, idx) => {
            console.log(`  Combat #${idx + 1}:`);
            console.log(`    Enemies: ${combat.enemies.join(', ')}`);
            console.log(`    Result: ${combat.victory ? '✅ Victory' : '❌ Defeat/Unknown'}`);
            if (combat.xpGained) console.log(`    Rewards: +${combat.xpGained} XP, +${combat.goldGained} Gold`);
            console.log(`    Duration: ${combat.endFrame - combat.startFrame} frames`);
        });
        console.log('');
    }

    // Errors
    if (stats.errors.length > 0) {
        console.log('❌ Errors Encountered:');
        stats.errors.forEach((err, idx) => {
            console.log(`  ${idx + 1}. Frame ${err.frame}: ${err.error}`);
        });
        console.log('');
    }

    // Success criteria
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Success Criteria:');
    console.log(`  ${stats.travels >= 3 ? '✅' : '❌'} Travel: ${stats.travels >= 3 ? 'PASS' : 'FAIL'} (${stats.travels}/3 travels)`);
    console.log(`  ${stats.combatStarted >= 2 ? '✅' : '❌'} Combat: ${stats.combatStarted >= 2 ? 'PASS' : 'FAIL'} (${stats.combatStarted}/2 combats)`);
    console.log(`  ${stats.errors.length === 0 ? '✅' : '⚠️'} No Errors: ${stats.errors.length === 0 ? 'PASS' : `WARN (${stats.errors.length} errors)`}`);
    console.log('');

    const allPassed = stats.travels >= 3 && stats.combatStarted >= 2 && stats.errors.length === 0;
    
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED! 🎉');
    } else {
        console.log('⚠️  SOME TESTS FAILED - See details above');
    }
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');

    process.exit(allPassed ? 0 : 1);
}

// Run the test
runLongSession().catch(error => {
    console.error('\n❌ FATAL ERROR:', error);
    console.error(error.stack);
    process.exit(1);
});
