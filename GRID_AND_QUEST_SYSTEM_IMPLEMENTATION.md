# Grid Position & Quest System Implementation

## Overview

This document summarizes the implementation of a grid-based positioning system for characters and an enhanced main quest system that's generated before autonomous mode starts.

## Features Implemented

### 1. Grid Position System

#### GridPositionComponent (`src/systems/grid/GridPositionComponent.js`)
- Tracks character position on a location's grid (x, y coordinates)
- Supports movement within a grid
- Calculates distance to other characters (Euclidean and Manhattan)
- Manages location-based positioning
- Provides serialization/deserialization for save/load

**Key Methods:**
- `moveTo(x, y)` - Move to grid coordinates
- `moveToLocation(newLocationId, startX, startY)` - Teleport to different location
- `getPosition()` - Get current position
- `distanceTo(otherPosition)` - Calculate distance to another character
- `isWithinRange(otherPosition, range)` - Check if within distance range

#### LocationGrid (`src/systems/grid/LocationGrid.js`)
- Central manager for all character positions across locations
- Tracks which characters are at which locations
- Provides location-based queries
- Implements pathfinding (BFS) within grids
- Maintains location-to-characters mapping

**Key Methods:**
- `addCharacter(characterId, position)` - Register character on grid
- `getCharactersAt(locationId)` - Get all characters at a location
- `getCharactersInRange(characterId, range)` - Get nearby characters
- `teleportCharacter(characterId, targetLocationId, x, y)` - Move character to new location
- `findPath(startX, startY, targetX, targetY)` - BFS pathfinding

#### Location.js Enhancement
- Added `grid` property with width, height, cellSize
- Default grid: 20x20 with cell size of 1 unit
- Supports custom grid dimensions per location
- Integrated into serialization/deserialization

### 2. NPC Schedule System

#### NPCScheduleSystem (`src/systems/npc/NPCScheduleSystem.js`)
- Manages NPC daily routines and movement
- Links time of day to NPC locations and activities
- Tracks NPC availability based on schedule
- Supports schedule-based NPC positioning

**Key Methods:**
- `registerNPC(npcId, npc)` - Register NPC with schedule
- `updateSchedule(npcId, timeOfDay)` - Update NPC position based on time
- `getNPCsAt(locationId)` - Get NPCs at a location
- `getNPCsInRange(locationId, gridX, gridY, range)` - Get NPCs in range
- `isNPCAvailable(npcId, timeOfDay)` - Check if NPC is available for interaction

### 3. Main Quest System

#### WorldGenerator Enhancements
**Location 255-308:** `generateStartingNPCs()`
- NPCs now have grid positions assigned from fallback data
- Default NPC positions: Gareth (10,10), Lyssa (14,8), Old Tam (7,12)
- Each NPC has a `gridPosition` property with x, y, and locationHint
- NPCs have a `schedule` property defining their daily routine

**Location 337-397:** `generateMainQuest()`
- Enhanced to be more Chronicler-driven and narrative
- Changed quest title to "The Lost Chronicle"
- Added `foundVia: "town_situation"` to indicate how quest is discovered
- Added narrative introduction: "The Chronicler has guided you to..."
- Enhanced description with more narrative depth
- Added discovery frame information
- Quest giver changed from "Gareth" to "Chronicler" (conceptually)

**Location 561-622:** `getFallbackNPCs()`
- Added `schedule` property to each NPC with time-based locations
- Gareth: Morning/Afternoon at mill (10,10), Evening at inn (8,5)
- Lyssa: Morning/Afternoon at market (14,8), Evening at dinner (12,6)
- Old Tam: Morning/Afternoon at bridge (7,12), Evening at home (6,14)

### 4. GameBackend Integration

#### GameBackend.js Changes

**Line 18-20:** Added imports
```javascript
import { LocationGrid } from '../../src/systems/grid/LocationGrid.js';
import { GridPositionComponent } from '../../src/systems/grid/GridPositionComponent.js';
import { NPCScheduleSystem } from '../../src/systems/npc/NPCScheduleSystem.js';
```

**Line 59-61:** Constructor additions
```javascript
// Grid position and NPC schedule systems
this.locationGrid = new LocationGrid();
this.npcScheduleSystem = new NPCScheduleSystem();
```

**Line 587-589:** Initialize grid positions in world setup
```javascript
// Initialize grid positions for player and NPCs
console.log('[GameBackend] Initializing grid positions...');
this._initializeGridPositions(world);
```

**Line 1342-1389:** New method `_initializeGridPositions(world)`
- Registers player at center of town (10, 10)
- Registers all NPCs with their grid positions
- Updates NPC schedules based on current time of day
- Logs position information to console

**Line 742-751:** Enhanced autonomous:action event
- Added `playerLocation` field (town name)
- Added `playerGridPosition` field with x, y coordinates

**Line 869-878:** Enhanced autonomous:action-result event
- Added `playerLocation` field
- Added `playerGridPosition` field

### 5. UI Updates

#### app.js Changes

**Line 433-439:** Enhanced onAutonomousAction listener
- Now displays location information in event log
- Format: "📍 At [Location] (x, y)"
- Added location-info event class

**Line 448-454:** Enhanced onAutonomousActionResult listener
- Displays location for action results
- Same format as above

#### styles.css Changes

**Line 1288-1294:** New .event-location-info style
- Blue background with left border accent
- Coordinates display styling
- Font size 0.95rem, normal weight

## Data Flow

```
Game Start
  ↓
Initialize GameBackend with grid systems
  ↓
Start Autonomous Mode
  ↓
World Generation
  ↓
Initialize Grid Positions
  ├─→ Create GridPositionComponent for player (town center, 10, 10)
  ├─→ Create GridPositionComponent for each NPC (fallback positions)
  ├─→ Register all positions in LocationGrid
  ├─→ Register NPCs with NPCScheduleSystem
  └─→ Update schedules based on current time of day
  ↓
Generate Opening Narration
  ↓
Generate Main Quest (Chronicler-driven)
  ↓
Start Autonomous Loop
  ├─→ Actions include location context
  ├─→ UI displays player location with grid coordinates
  └─→ NPCs can be queried by location/proximity
```

## NPC Schedule Example

**Gareth (Master Miller):**
```
Morning:   At starting_town, work at mill, gridPosition (10, 10)
Afternoon: At starting_town, work at mill, gridPosition (10, 10)
Evening:   At starting_town, drink at inn, gridPosition (8, 5)
```

## Usage Examples

### Query NPCs at Location
```javascript
const npcsInTown = this.npcScheduleSystem.getNPCsAt('starting_town');
// Returns: [{npcId, name, location, activity, gridPosition}]
```

### Get Nearby NPCs
```javascript
const nearby = this.npcScheduleSystem.getNPCsInRange('starting_town', 10, 10, 5);
// Returns: Array of NPCs within Manhattan distance 5 of (10, 10)
```

### Update NPC Schedule
```javascript
this.npcScheduleSystem.updateSchedule('npc_0', 'evening');
// NPC moves to evening location and activity
```

### Find Path
```javascript
const path = this.locationGrid.findPath(10, 10, 5, 5, 20, 20);
// Returns: [{x, y}, {x, y}, ...] path from (10,10) to (5,5)
```

## File Locations

### New Files Created
- `src/systems/grid/GridPositionComponent.js` - Character grid positioning
- `src/systems/grid/LocationGrid.js` - Grid manager
- `src/systems/npc/NPCScheduleSystem.js` - NPC schedule management

### Modified Files
- `src/systems/world/Location.js` - Added grid dimensions
- `src/systems/world/WorldGenerator.js` - NPC grid positions and main quest
- `electron/ipc/GameBackend.js` - Grid system integration
- `ui/app.js` - Display player location
- `ui/styles.css` - Location display styling

## Key Improvements

1. **Spatial Awareness**: Characters now have defined positions on a 20x20 grid within each location
2. **NPC Movement**: NPCs follow daily schedules and move to different grid positions based on time
3. **Player Location Tracking**: Player location is displayed in the event log during autonomous play
4. **Chronicler-Driven Quests**: Main quest is now generated as part of world creation with narrative framing
5. **Distance Calculations**: Can query characters by proximity within a location
6. **Pathfinding**: BFS-based pathfinding for future NPC movement between grid positions
7. **Extensible Design**: All systems are fully serializable for save/load functionality

## Future Enhancements

Possible future improvements:
1. **NPC Movement During Gameplay**: Update NPC positions as game time progresses
2. **Combat Positioning**: Use grid positions to determine combat encounter locations
3. **Quest Location Integration**: Main quest could reference specific grid coordinates
4. **Player Movement**: Allow player to move within grid, find specific NPCs by location
5. **Visual Map Display**: Show grid-based mini map of town with character positions
6. **Dynamic Scheduling**: Generate NPC schedules based on profession/personality
7. **Location-Based Events**: Trigger events when player is at specific locations
8. **NPC Awareness**: NPCs could reference where they saw the player or other NPCs

## Testing Checklist

When testing these features:
- ✓ World generates with main quest
- ✓ Grid positions are initialized for player and NPCs
- ✓ Location information appears in autonomous mode event log
- ✓ Main quest appears before first conversation
- ✓ NPCs have different grid positions
- ✓ NPC schedules can be queried by time of day
- ✓ Console logs show position initialization
- ✓ Location displays with coordinates format: "📍 At [Town] (x, y)"
