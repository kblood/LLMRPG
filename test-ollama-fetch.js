// Quick test to verify Ollama connectivity using fetch

async function testOllama() {
  console.log('Testing Ollama connection at http://localhost:11434...');

  try {
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    console.log('Response status:', response.status);
    console.log('Response OK:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('Ollama is available!');
      console.log('Models:', data.models?.length || 0);
      return true;
    } else {
      console.log('Ollama returned non-OK status');
      return false;
    }
  } catch (error) {
    console.error('Failed to connect to Ollama:', error.message);
    return false;
  }
}

testOllama().then(result => {
  console.log('\nOllama available:', result);
  process.exit(result ? 0 : 1);
});
