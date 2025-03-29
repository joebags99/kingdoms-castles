// src/game-logic/types.ts
import { Player } from './constants';

// Define the Unit interface for units on the board
export interface Unit {
  id: string;        // Unique identifier
  owner: Player;     // Which player owns this unit ("A" or "B")
  q: number;         // Axial coordinate q
  r: number;         // Axial coordinate r
  ap: number;        // Attack Power
  hp: number;        // Hit Points
  hasMoved?: boolean; // Flag to track if unit has moved this turn
}

// src/game-logic/types.ts - Add to the end of the file
export interface Card {
    id: string;
    name: string;
    cost: number;
    type: 'unit' | 'resource' | 'spell' | 'building';
    subtype?: string;
    effect: string;
    description: string;
    // Additional properties specific to card types
    unitStats?: {
      ap: number;
      hp: number;
    };
    resourceAmount?: number;
  }
  
  // Update the Player type
  export type PlayerID = 'A' | 'B';