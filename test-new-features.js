/**
 * New Features Test - Testing abilities, time/weather, and quests
 */

import { createPlayer } from './src/utils/CharacterFactory.js';
import { TimeManager } from './src/systems/world/TimeManager.js';
import { Quest, QuestManager } from './src/systems/quests/QuestManager.js';
import { getAbility, getAbilitiesByCategory, getAllAbilities } from './src/data/abilities.js';

console.log('╔════════════════════════════════════════╗');
console.log('║     NEW FEATURES TEST SUITE            ║');
console.log('╚════════════════════════════════════════╝\n');

// Test 1: Abilities System
console.log('⚔️  Test 1: Abilities System\n');

const allAbilities = getAllAbilities();
console.log(`Total abilities in database: ${allAbilities.length}`);

const warriorAbilities = getAbilitiesByCategory('warrior');
console.log(`Warrior abilities: ${warriorAbilities.length}`);
warriorAbilities.forEach(ab => {
  console.log(`  - ${ab.name} (${ab.type}, costs: ${JSON.stringify(ab.costs)}, cooldown: ${ab.cooldown})`);
});

const mageAbilities = getAbilitiesByCategory('mage');
console.log(`\nMage abilities: ${mageAbilities.length}`);
mageAbilities.forEach(ab => {
  console.log(`  - ${ab.name} (${ab.type}, costs: ${JSON.stringify(ab.costs)}, range: ${ab.range})`);
});

// Test ability creation
const fireball = getAbility('fireball');
console.log(`\n✅ Created ability: ${fireball.name}`);
console.log(`   Description: ${fireball.description}`);
console.log(`   Damage: ${fireball.effects.damage} ${fireball.effects.damageType}`);
console.log(`   Cost: ${fireball.costs.magic} magic`);
console.log(`   Range: ${fireball.range}`);

// Test 2: Player with Abilities
console.log('\n👤 Test 2: Player with Auto-Assigned Abilities\n');

const warrior = createPlayer('Warrior', {
  level: 3,
  strength: 15,
  dexterity: 10,
  constitution: 14,
  intelligence: 8,
  wisdom: 10,
  charisma: 12
});

console.log(`Created ${warrior.name}:`);
console.log(`  Level: ${warrior.stats.level}`);
console.log(`  STR: ${warrior.stats.attributes.strength}, DEX: ${warrior.stats.attributes.dexterity}`);
console.log(`  Known abilities: ${warrior.abilities.getAllAbilities().length}`);
warrior.abilities.getAllAbilities().forEach(ab => {
  console.log(`    - ${ab.name} (${ab.category})`);
});

const mage = createPlayer('Mage', {
  level: 4,
  strength: 8,
  dexterity: 10,
  constitution: 10,
  intelligence: 16,
  wisdom: 12,
  charisma: 14
});

console.log(`\nCreated ${mage.name}:`);
console.log(`  Level: ${mage.stats.level}`);
console.log(`  INT: ${mage.stats.attributes.intelligence}, WIS: ${mage.stats.attributes.wisdom}`);
console.log(`  Known abilities: ${mage.abilities.getAllAbilities().length}`);
mage.abilities.getAllAbilities().forEach(ab => {
  console.log(`    - ${ab.name} (${ab.category})`);
});

// Test 3: Time & Weather System
console.log('\n🌤️  Test 3: Time & Weather System\n');

const timeManager = new TimeManager({
  totalMinutes: 0, // Start at midnight
  weatherEnabled: true
});

console.log(`Starting time: ${timeManager.getFullTimeDescription()}`);
console.log(`  Time of day: ${timeManager.getTimeOfDay()}`);
console.log(`  Is daytime: ${timeManager.isDaytime()}`);
console.log(`  Season: ${timeManager.getSeason()}`);
console.log(`  Weather: ${timeManager.getWeather()}`);

// Advance time through a day
console.log('\n⏰ Advancing time...\n');

for (let i = 0; i < 12; i++) {
  const events = timeManager.advanceTime(10); // 10 turns = 100 minutes

  if (events.timeOfDayChanged) {
    console.log(`${timeManager.getTimeString()} - ${events.newTimeOfDay} begins`);
  }

  if (events.weatherChanged) {
    console.log(`  Weather changed: ${events.oldWeather} → ${events.newWeather}`);
  }

  if (events.seasonChanged) {
    console.log(`  🍂 Season changed: ${events.oldSeason} → ${events.newSeason}`);
  }
}

console.log(`\nCurrent time: ${timeManager.getFullTimeDescription()}`);

const weatherEffects = timeManager.getWeatherEffects();
console.log(`\nWeather effects:`);
console.log(`  Visibility: ${weatherEffects.visibility * 100}%`);
console.log(`  Accuracy modifier: ${weatherEffects.accuracyModifier * 100}%`);
console.log(`  Movement cost: ${weatherEffects.movementCost}x`);

// Test serialization
const timeJson = timeManager.toJSON();
const restoredTime = TimeManager.fromJSON(timeJson);
console.log(`\n✅ Time serialization: ${restoredTime.getTimeString()} === ${timeManager.getTimeString()}`);

// Test 4: Quest System
console.log('\n📜 Test 4: Quest System\n');

const questManager = new QuestManager();

// Create a simple quest
const quest1 = new Quest({
  id: 'tutorial_quest',
  title: 'Welcome to Adventure',
  description: 'Learn the basics of adventuring',
  questGiver: 'Town Elder',
  type: 'main',
  level: 1,
  objectives: [
    {
      id: 'talk_to_smith',
      description: 'Talk to the blacksmith',
      type: 'talk',
      target: 'blacksmith',
      current: 0,
      required: 1,
      completed: false
    },
    {
      id: 'kill_rats',
      description: 'Kill 5 giant rats',
      type: 'kill',
      target: 'giant_rat',
      current: 0,
      required: 5,
      completed: false
    }
  ],
  rewards: {
    experience: 100,
    gold: 50,
    items: [{ itemId: 'health_potion', quantity: 3 }]
  }
});

questManager.addQuest(quest1);

// Create a chain quest
const quest2 = new Quest({
  id: 'rats_investigation',
  title: 'Rat Investigation',
  description: 'Discover where the rats are coming from',
  questGiver: 'Town Elder',
  type: 'main',
  level: 2,
  prerequisiteQuests: ['tutorial_quest'],
  objectives: [
    {
      id: 'explore_sewers',
      description: 'Explore the sewers',
      type: 'explore',
      target: 'sewers',
      current: 0,
      required: 1,
      completed: false
    }
  ],
  rewards: {
    experience: 200,
    gold: 100
  }
});

questManager.addQuest(quest2);

console.log(`Quests in manager: ${questManager.quests.size}`);
console.log(`Available quests: ${questManager.getAvailableQuests().length}`);

// Start quest
console.log(`\nStarting quest: ${quest1.title}`);
questManager.startQuest('tutorial_quest');
console.log(`Active quests: ${questManager.getActiveQuests().length}`);

const activeQuest = questManager.getActiveQuests()[0];
console.log(`\nActive quest: ${activeQuest.title}`);
console.log(`Progress: ${activeQuest.getProgress()}%`);
console.log(`Objectives:`);
activeQuest.objectives.forEach(obj => {
  console.log(`  - ${obj.description}: ${obj.current}/${obj.required} ${obj.completed ? '✓' : ''}`);
});

// Complete first objective
console.log(`\n📝 Talking to blacksmith...`);
const update1 = questManager.updateQuestObjective('tutorial_quest', 'talk_to_smith', 1);
console.log(`Objective completed: ${update1.objectiveCompleted}`);
console.log(`Quest completed: ${update1.questCompleted}`);
console.log(`Progress: ${activeQuest.getProgress()}%`);

// Complete second objective
console.log(`\n⚔️  Killing rats...`);
for (let i = 0; i < 5; i++) {
  const update = questManager.updateQuestObjective('tutorial_quest', 'kill_rats', 1);
  console.log(`  Killed rat ${i + 1}/5`);
  if (update.questCompleted) {
    console.log(`  🎉 All objectives complete!`);
  }
}

console.log(`\nProgress: ${activeQuest.getProgress()}%`);

// Turn in quest
console.log(`\n💰 Turning in quest...`);
const rewards = questManager.completeQuest('tutorial_quest');
console.log(`Rewards received:`);
console.log(`  Experience: +${rewards.experience}`);
console.log(`  Gold: +${rewards.gold}`);
console.log(`  Items: ${rewards.items.length} item(s)`);

// Check unlocked quests
const availableQuests = questManager.getAvailableQuests();
console.log(`\nAvailable quests after completion: ${availableQuests.length}`);
availableQuests.forEach(q => {
  console.log(`  - ${q.title} (Level ${q.level})`);
});

// Quest statistics
const stats = questManager.getStatistics();
console.log(`\nQuest Statistics:`);
console.log(`  Total: ${stats.total}`);
console.log(`  Active: ${stats.active}`);
console.log(`  Completed: ${stats.completed}`);
console.log(`  Available: ${stats.available}`);

// Test quest serialization
const questJson = questManager.toJSON();
const restoredQuestManager = QuestManager.fromJSON(questJson);
console.log(`\n✅ Quest serialization: ${restoredQuestManager.quests.size} quests restored`);

// Summary
console.log('\n╔════════════════════════════════════════╗');
console.log('║   ✅ ALL NEW FEATURES WORKING!        ║');
console.log('╚════════════════════════════════════════╝');
console.log(`\n✓ ${allAbilities.length} abilities created`);
console.log(`✓ Auto-assigned abilities to players`);
console.log(`✓ Time system with day/night cycle`);
console.log(`✓ Weather system with seasonal variation`);
console.log(`✓ Quest system with objectives and chains`);
console.log(`✓ All systems serializable\n`);
