/**
 * Quick test to verify conversation system
 */

import { GameBackendIntegrated } from '../electron/ipc/GameBackendIntegrated.js';

console.log('=== Quick Conversation Test ===\n');

async function test() {
  try {
    const backend = new GameBackendIntegrated();
    
    console.log('1. Initializing...');
    await backend.initialize({
      playerName: 'Test Player',
      theme: 'fantasy',
      seed: 12345
    });
    
    console.log('2. Getting state...');
    const state = backend.getGameState();
    console.log(`   Protagonist: ${state.characters?.protagonist?.name}`);
    console.log(`   NPCs: ${state.characters?.npcs?.length}`);
    
    if (state.characters?.npcs?.length > 0) {
      const npc = state.characters.npcs[0];
      console.log(`3. Starting conversation with ${npc.name}...`);
      
      try {
        const conversation = await backend.gameService.startConversation(npc.id);
        console.log(`   Conversation started:`, conversation);
        console.log(`   ID: ${conversation.id}`);
        console.log(`   conversationId: ${conversation.conversationId}`);
        
        if (conversation.id) {
          console.log(`4. Adding conversation turn...`);
          const response = await backend.gameService.addConversationTurn(
            conversation.id,
            'Hello there!'
          );
          console.log(`   Response:`, response);
          console.log('✓ Conversation system works!');
        } else {
          console.error('❌ Conversation ID is missing!');
        }
      } catch (error) {
        console.error('❌ Conversation failed:', error.message);
        throw error;
      }
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

test();
