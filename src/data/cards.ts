import { Card } from '../game-logic/types';

// Basic unit cards
export const unitCards: Card[] = [
  {
    id: 'unit-1',
    name: 'Footman',
    cost: 3,
    type: 'unit',
    subtype: 'infantry',
    effect: 'Basic infantry unit',
    description: 'A loyal soldier equipped with a sword and shield.',
    unitStats: {
      ap: 2,
      hp: 4
    }
  },
  {
    id: 'unit-2',
    name: 'Archer',
    cost: 4,
    type: 'unit',
    subtype: 'ranged',
    effect: 'Ranged attack unit',
    description: 'Skilled with a bow, can attack from a distance.',
    unitStats: {
      ap: 3,
      hp: 2
    }
  },
  {
    id: 'unit-3',
    name: 'Knight',
    cost: 6,
    type: 'unit',
    subtype: 'cavalry',
    effect: 'Heavy cavalry unit',
    description: 'Mounted warrior with heavy armor and lance.',
    unitStats: {
      ap: 4,
      hp: 5
    }
  }
];

// Resource cards
export const resourceCards: Card[] = [
  {
    id: 'resource-1',
    name: 'Gold Mine',
    cost: 2,
    type: 'resource',
    effect: 'Gain 3 gold',
    description: 'Miners extract precious gold from beneath the earth.',
    resourceAmount: 3
  },
  {
    id: 'resource-2',
    name: 'Royal Treasury',
    cost: 4,
    type: 'resource',
    effect: 'Gain 5 gold',
    description: 'A fortified vault holding the kingdom\'s wealth.',
    resourceAmount: 5
  }
];

// Building cards
export const buildingCards: Card[] = [
  {
    id: 'building-1',
    name: 'Watchtower',
    cost: 3,
    type: 'building',
    effect: 'Reveals adjacent hexes',
    description: 'A tall structure providing visibility over the surrounding area.'
  },
  {
    id: 'building-2',
    name: 'Barracks',
    cost: 5,
    type: 'building',
    effect: 'Reduces unit cost by 1',
    description: 'A training ground for soldiers, reducing recruitment costs.'
  }
];

// Spell cards
export const spellCards: Card[] = [
  {
    id: 'spell-1',
    name: 'Healing Prayer',
    cost: 2,
    type: 'spell',
    effect: 'Heal a unit for 2 HP',
    description: 'A divine blessing that mends wounds and restores strength.'
  },
  {
    id: 'spell-2',
    name: 'Fireball',
    cost: 3,
    type: 'spell',
    effect: 'Deal 2 damage to a unit',
    description: 'A ball of arcane fire that burns enemies.'
  }
];

// Function to create a deck for a player
export function createPlayerDeck(playerId: 'A' | 'B'): Card[] {
  // Create copies of the cards to avoid reference issues
  const unitCopies = unitCards.map(card => ({...card, id: `${card.id}-${playerId}`}));
  const resourceCopies = resourceCards.map(card => ({...card, id: `${card.id}-${playerId}`}));
  const buildingCopies = buildingCards.map(card => ({...card, id: `${card.id}-${playerId}`}));
  const spellCopies = spellCards.map(card => ({...card, id: `${card.id}-${playerId}`}));
  
  // Combine all cards into a deck
  const deck = [
    ...unitCopies, ...unitCopies, // Add two copies of each unit card
    ...resourceCopies, ...resourceCopies,
    ...buildingCopies,
    ...spellCopies
  ];
  
  // Shuffle the deck using Fisher-Yates algorithm
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
}