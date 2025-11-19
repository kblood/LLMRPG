// Test GameBackend directly without Electron

import { GameBackend } from './electron/ipc/GameBackend.js';

async function testBackend() {
  console.log('=== Testing GameBackend ===\n');

  const backend = new GameBackend();

  // Test 1: Check Ollama before initialization
  console.log('Test 1: Checking Ollama availability...');
  try {
    const ollamaCheck = await backend.checkOllama();
    console.log('Ollama check result:', ollamaCheck);
    console.log('Available:', ollamaCheck.available);
  } catch (error) {
    console.error('Ollama check failed:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Initialize GameBackend
  console.log('Test 2: Initializing GameBackend...');
  try {
    const initResult = await backend.initialize({
      seed: Date.now(),
      playerName: 'Tester'
    });
    console.log('Initialization successful!');
    console.log('Session ID:', initResult.sessionId);
    console.log('NPCs count:', initResult.npcsCount);
  } catch (error) {
    console.error('Initialization failed:', error.message);
    console.error('Full error:', error);
  }

  console.log('\n---\n');

  // Test 3: Get NPCs
  if (backend.initialized) {
    console.log('Test 3: Getting NPCs...');
    try {
      const npcs = backend.getNPCs();
      console.log('NPCs loaded:', npcs.length);
      console.log('First NPC:', npcs[0]?.name);
    } catch (error) {
      console.error('Get NPCs failed:', error.message);
    }
  }

  // Cleanup
  backend.cleanup();
  console.log('\nTests complete!');
}

testBackend().catch(console.error);
