# StatePublisher Quick Start Guide

Get started with StatePublisher in 5 minutes!

## What is StatePublisher?

StatePublisher is a pure observer pattern system that lets your UI subscribe to game state updates without driving the game loop. The game publishes state changes, and your UI automatically receives them.

**Key Benefit**: Complete separation between game logic and UI rendering.

## Installation

No installation needed! StatePublisher is already integrated into the LLMRPG codebase.

```javascript
import { statePublisher, EVENT_TYPES } from './src/services/StatePublisher.js';
```

## 5-Minute Tutorial

### Step 1: Create a Subscriber

```javascript
const myUISubscriber = {
  id: 'my-ui',  // Unique identifier

  // Called when game state updates
  onStateUpdate: (state, eventType, metadata) => {
    console.log(`Game state updated: ${eventType}`);
    updateMyUI(state);
  },

  // Called for custom events
  onGameEvent: (event) => {
    console.log(`Game event: ${event.type}`);
    showNotification(event);
  }
};
```

### Step 2: Subscribe

```javascript
const subscriberId = statePublisher.subscribe(myUISubscriber);
```

That's it! Your subscriber will now receive all game state updates automatically.

### Step 3: Use in Your Game Loop (Already Done!)

If you're using `StandaloneAutonomousGame`, StatePublisher is already integrated:

```javascript
const game = new StandaloneAutonomousGame(gameService);
game.run(); // StatePublisher automatically publishes state
```

If you're using a custom game loop:

```javascript
function gameLoop() {
  gameService.tick(1);

  // Publish state after tick
  const state = gameService.getGameState();
  statePublisher.publish(state, EVENT_TYPES.FRAME_UPDATE);
}
```

### Step 4: Clean Up (Optional)

```javascript
// When your UI component unmounts
statePublisher.unsubscribe(subscriberId);
```

## Event Types

Common event types you'll receive:

- `EVENT_TYPES.FRAME_UPDATE` - Game advanced one frame
- `EVENT_TYPES.DIALOGUE_STARTED` - Conversation began
- `EVENT_TYPES.DIALOGUE_LINE` - New dialogue line
- `EVENT_TYPES.ACTION_EXECUTED` - Action completed
- `EVENT_TYPES.QUEST_CREATED` - New quest
- `EVENT_TYPES.PAUSE_TOGGLED` - Game paused/resumed

See `EVENT_TYPES` for all available types.

## Common Patterns

### Pattern 1: State-Only Subscriber

Only need state updates? Omit `onGameEvent`:

```javascript
statePublisher.subscribe({
  id: 'state-only',
  onStateUpdate: (state, eventType) => {
    // Handle state updates
  }
});
```

### Pattern 2: Event-Only Subscriber

Only need events? Omit `onStateUpdate`:

```javascript
statePublisher.subscribe({
  id: 'event-only',
  onGameEvent: (event) => {
    // Handle events
  }
});
```

### Pattern 3: Filtered Subscriber

Only react to specific events:

```javascript
statePublisher.subscribe({
  id: 'dialogue-only',
  onStateUpdate: (state, eventType) => {
    if (eventType === EVENT_TYPES.DIALOGUE_LINE) {
      // Handle dialogue updates
    }
  }
});
```

### Pattern 4: React Integration

```jsx
import { useEffect, useState } from 'react';

function GameUI() {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const subscriber = {
      id: 'react-ui',
      onStateUpdate: (state) => setGameState(state)
    };

    const id = statePublisher.subscribe(subscriber);

    return () => statePublisher.unsubscribe(id);
  }, []);

  return <div>Frame: {gameState?.frame}</div>;
}
```

See `examples/react-ui-subscriber.jsx` for complete React examples.

## Examples

### Run Quick Start Example

```bash
node examples/state-publisher-quickstart.js
```

### Run Full Example

```bash
node examples/state-publisher-example.js
```

### Run Tests

```bash
node tests/test-state-publisher-integration.js
```

## Debugging

Enable debug mode to see what's happening:

```javascript
statePublisher.enableDebug({
  logStateUpdates: true,
  logPerformance: true
});
```

Check metrics:

```javascript
const metrics = statePublisher.getMetrics();
console.log('Subscribers:', metrics.subscriberCount);
console.log('Publishes:', metrics.publishCount);
console.log('Avg time:', metrics.averagePublishTimeMs + 'ms');
```

## Best Practices

1. **Subscribe once** - Don't subscribe in loops or on every frame
2. **Clean up** - Unsubscribe when components unmount
3. **Use event types** - Filter by `eventType` instead of subscribing multiple times
4. **Handle errors** - Wrap your handlers in try-catch
5. **Optimize renders** - Throttle expensive UI updates

## Performance

StatePublisher is fast:
- 10 subscribers: ~0.09ms per publish
- 100 subscribers: ~0.82ms per publish
- 1000 subscribers: ~8.2ms per publish

Perfect for real-time game UIs!

## Common Issues

### "Subscriber not receiving updates"

Check that:
1. You subscribed before the game started
2. Your subscriber has `onStateUpdate` or `onGameEvent`
3. The game is actually publishing (enable debug mode)

### "Too many updates"

Throttle expensive operations:
```javascript
import { throttle } from 'lodash';

const throttledUpdate = throttle(updateUI, 100); // Max once per 100ms
```

### "State is stale"

StatePublisher passes state by reference. Don't modify it:
```javascript
// Good
const myCopy = JSON.parse(JSON.stringify(state));

// Bad
state.frame++; // Don't do this!
```

## Next Steps

- Read the [full documentation](./StatePublisher.md)
- Explore [complete examples](../examples/state-publisher-example.js)
- Check out [React integration](../examples/react-ui-subscriber.jsx)
- Run the [test suite](../tests/test-state-publisher-integration.js)

## API Quick Reference

```javascript
// Subscribe
const id = statePublisher.subscribe(subscriber);

// Unsubscribe
statePublisher.unsubscribe(id);

// Publish (game-side)
statePublisher.publish(gameState, eventType, metadata);

// Broadcast (custom events)
statePublisher.broadcast({ type: 'custom', data: {} });

// Metrics
const metrics = statePublisher.getMetrics();

// Debug
statePublisher.enableDebug({ logStateUpdates: true });

// Clear (testing)
statePublisher.clear();
```

## Help

Need help? Check:
- [Full Documentation](./StatePublisher.md)
- [Examples Directory](../examples/)
- [Test Suite](../tests/test-state-publisher-integration.js)

Happy coding!
