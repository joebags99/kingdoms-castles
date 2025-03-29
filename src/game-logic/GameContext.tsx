// src/game-logic/GameContext.tsx

import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { Hex, getAdjacentHexes } from './board'; // Import Hex and getAdjacentHexes
import { GamePhase, Player } from './constants';
import { Unit, Card } from './types';
import { createPlayerDeck } from '../data/cards';

export interface GameState {
  currentPlayer: Player;
  currentPhase: GamePhase;
  turnNumber: {
    A: number,
    B: number
  };
  board: Hex[];
  resources: {
    A: { gold: number },
    B: { gold: number }
  };
  gameStarted: boolean;
  setupComplete: boolean;
  resourcesCollectedThisTurn: boolean;
  units: Unit[];
  selectedUnit: string | null;
  // Add these new properties
  decks: {
    A: Card[];
    B: Card[];
  };
  hands: {
    A: Card[];
    B: Card[];
  };
  selectedCard: string | null;
}

// Update initialGameState to include empty decks and hands
const initialGameState: GameState = {
  currentPlayer: 'A',
  currentPhase: GamePhase.Setup,
  turnNumber: {
    A: 0,
    B: 0
  },
  board: [],
  resources: {
    A: { gold: 0 },
    B: { gold: 0 }
  },
  gameStarted: false,
  setupComplete: false,
  resourcesCollectedThisTurn: false,
  units: [],
  selectedUnit: null,
  // Add these new properties
  decks: {
    A: [],
    B: []
  },
  hands: {
    A: [],
    B: []
  },
  selectedCard: null
};

// In src/game-logic/GameContext.tsx, update the GameAction type definition:

type GameAction = 
  | { type: 'NEXT_PHASE' }
  | { type: 'END_PHASE' }
  | { type: 'END_COMBAT' } 
  | { type: 'SET_BOARD', payload: Hex[] }
  | { type: 'RESET_GAME', payload?: { startingPlayer: Player } }
  | { type: 'START_GAME', payload: { startingPlayer: Player } }
  | { type: 'COMPLETE_SETUP' }
  | { type: 'DEPLOY_UNIT', payload: { q: number, r: number, ap: number, hp: number } }
  | { type: 'SELECT_UNIT', payload: string | null }
  | { type: 'MOVE_UNIT', payload: { unitId: string, q: number, r: number } }
  | { type: 'ATTACK_UNIT', payload: { attackerId: string, defenderId: string } }
  | { type: 'DRAW_CARD' }
  | { type: 'SELECT_CARD', payload: string | null }
  | { type: 'PLAY_CARD', payload: { cardId: string, targetHex?: { q: number, r: number } } };

// Create the reducer function to handle state changes
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEXT_PHASE': {
      const phases = Object.values(GamePhase);
      const currentIndex = phases.indexOf(state.currentPhase);
      const nextIndex = (currentIndex + 1) % phases.length;
      const nextPhase = phases[nextIndex];
      
      // Skip the Setup phase when cycling through phases after setup is complete
      const phaseToUse = (nextPhase === GamePhase.Setup && state.setupComplete) 
        ? GamePhase.Resource 
        : nextPhase;
      
      let newState = { ...state, currentPhase: phaseToUse };
      
      // If we're LEAVING the End phase and going to Resource, switch players and increment turn
      if (state.currentPhase === GamePhase.End && phaseToUse === GamePhase.Resource) {
        const newPlayer: 'A' | 'B' = state.currentPlayer === 'A' ? 'B' : 'A';
        
        // Increment the turn number for the new player
        const newTurn = {
          ...state.turnNumber,
          [newPlayer]: state.turnNumber[newPlayer] + 1
        };
        
        console.log(`Player ${newPlayer}'s turn incremented to ${newTurn[newPlayer]}`);
        
        // Switch to the new player and update turn number
        newState = {
          ...newState,
          currentPlayer: newPlayer,
          turnNumber: newTurn,
          // Reset the resource collection flag for the new turn
          resourcesCollectedThisTurn: false
        };
        
        // Also reset hasMoved flag for all units of the new player
        const updatedUnits = state.units.map(unit => {
          if (unit.owner === newPlayer) {
            return { ...unit, hasMoved: false };
          }
          return unit;
        });
        
        newState = {
          ...newState,
          units: updatedUnits
        };
      }
      
      // If we're LEAVING the Resource phase, collect resources for the next phase
      // But only if we haven't collected resources already this turn (from setup completion)
      if (state.currentPhase === GamePhase.Resource && state.setupComplete && !state.resourcesCollectedThisTurn) {
        const player = state.currentPlayer;
        
        // Count how many hexes are generating resources for this player
        const resourceGeneratingHexes = state.board.filter(
          hex => hex.capitalOwner === player && hex.generateResource === true
        ).length;
        
        // Limit active generators by turn number
        const playerTurnNumber = state.turnNumber[player];
        const activeGenerators = Math.min(resourceGeneratingHexes, playerTurnNumber);
        
        console.log(`Resource phase ending: Player ${player} gains resources from ${activeGenerators} active generators in turn ${playerTurnNumber}`);
        
        // Calculate resource gain
        const resourceGain = activeGenerators;
        
        // Add resources to the player
        const currentGold = state.resources[player].gold;
        const newGold = Math.min(currentGold + resourceGain, 20);
        
        console.log(`Player ${player} gold: ${currentGold} + ${resourceGain} = ${newGold}`);
        
        // Update the resources in our state
        newState = {
          ...newState,
          resources: {
            ...newState.resources,
            [player]: {
              ...newState.resources[player],
              gold: newGold
            }
          },
          // Mark that we've collected resources this turn
          resourcesCollectedThisTurn: true
        };
      }
      
      return newState;
    }

    // For deploying a new unit
    case 'DEPLOY_UNIT': {
      const { q, r, ap, hp } = action.payload;
      
      // Check if the hex is valid for deployment
      const targetHex = state.board.find(hex => hex.q === q && hex.r === r);
      
      // Validate that:
      // 1. The hex belongs to the current player's territory
      // 2. The hex is not already occupied by another unit
      const hexBelongsToPlayer = targetHex?.zone === state.currentPlayer;
      const isCapitalArea = targetHex?.capitalOwner === state.currentPlayer;
      const isHexOccupied = state.units.some(unit => unit.q === q && unit.r === r);
      
      if (!targetHex || !hexBelongsToPlayer || isHexOccupied) {
        console.log(`Cannot deploy unit: invalid hex or hex already occupied`);
        return state;
      }
      
      // Check if player has enough resources (5 gold per unit)
      const unitCost = 5;
      const playerResources = state.resources[state.currentPlayer].gold;
      
      if (playerResources < unitCost) {
        console.log(`Cannot deploy unit: insufficient gold (${playerResources}/${unitCost})`);
        return state;
      }
      
      // Create a new unit
      const newUnit: Unit = {
        id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Generate unique ID
        owner: state.currentPlayer,
        q,
        r,
        ap,
        hp,
        hasMoved: false
      };
      
      // Spend resources
      const updatedResources = {
        ...state.resources,
        [state.currentPlayer]: {
          ...state.resources[state.currentPlayer],
          gold: playerResources - unitCost
        }
      };
      
      console.log(`Player ${state.currentPlayer} deployed a unit at (${q}, ${r})`);
      
      // Add the new unit to the state
      return {
        ...state,
        units: [...state.units, newUnit],
        resources: updatedResources
      };
    }

    // For selecting a unit
    case 'SELECT_UNIT': {
      return {
        ...state,
        selectedUnit: action.payload
      };
    }

    // For moving a unit
    case 'MOVE_UNIT': {
      const { unitId, q, r } = action.payload;
      
      // Find the unit to move
      const unitIndex = state.units.findIndex(unit => unit.id === unitId);
      if (unitIndex === -1) {
        console.log(`Cannot move unit: unit not found`);
        return state;
      }
      
      const unit = state.units[unitIndex];
      
      // Verify it's the current player's unit and we're in movement phase
      if (unit.owner !== state.currentPlayer) {
        console.log(`Cannot move unit: not your unit`);
        return state;
      }
      
      if (state.currentPhase !== GamePhase.Movement) {
        console.log(`Cannot move unit: not in movement phase`);
        return state;
      }
      
      if (unit.hasMoved) {
        console.log(`Cannot move unit: unit has already moved this turn`);
        return state;
      }
      
      // Check if the target hex is adjacent
      const adjacentHexes = getAdjacentHexes(unit.q, unit.r);
      const isAdjacent = adjacentHexes.some(hex => hex.q === q && hex.r === r);
      
      if (!isAdjacent) {
        console.log(`Cannot move unit: target hex is not adjacent`);
        return state;
      }
      
      // Check if the target hex is already occupied
      const isHexOccupied = state.units.some(u => u.q === q && u.r === r);
      if (isHexOccupied) {
        console.log(`Cannot move unit: target hex is already occupied`);
        return state;
      }
      
      // Check if the target hex exists on the board
      const targetHex = state.board.find(hex => hex.q === q && hex.r === r);
      if (!targetHex) {
        console.log(`Cannot move unit: target hex does not exist`);
        return state;
      }
      
      // Log the movement for debugging
      console.log(`Moving unit from (${unit.q}, ${unit.r}) to (${q}, ${r})`);
      
      // Create a copy of the units array, don't modify directly
      const updatedUnits = [...state.units];
      
      // Update the unit with the new position
      updatedUnits[unitIndex] = {
        ...unit,
        q: q,  // Make sure these are explicitly set
        r: r,  // Make sure these are explicitly set
        hasMoved: true
      };
      
      // Log the updated unit for debugging
      console.log("Updated unit:", updatedUnits[unitIndex]);
      
      return {
        ...state,
        units: updatedUnits,
        selectedUnit: unit.id // Keep the unit selected after moving
      };
    }
      
     // src/game-logic/GameContext.tsx
// Modify the ATTACK_UNIT case to remove the phase check:

case 'ATTACK_UNIT': {
  const { attackerId, defenderId } = action.payload;
  
  // Find the attacker and defender
  const attacker = state.units.find(unit => unit.id === attackerId);
  const defender = state.units.find(unit => unit.id === defenderId);
  
  // Validate both units exist
  if (!attacker || !defender) {
    console.log(`Cannot attack: one or both units not found`);
    return state;
  }
  
  // REMOVE THIS CHECK:
  // if (state.currentPhase !== GamePhase.Combat) {
  //   console.log(`Cannot attack: not in combat phase`);
  //   return state;
  // }
  
  // Verify attacker belongs to current player
  if (attacker.owner !== state.currentPlayer) {
    console.log(`Cannot attack: attacker is not controlled by current player`);
    return state;
  }
  
  // Verify defender belongs to opponent
  if (defender.owner === state.currentPlayer) {
    console.log(`Cannot attack: cannot attack your own units`);
    return state;
  }
  
  // Check if units are adjacent
  const adjacentHexes = getAdjacentHexes(attacker.q, attacker.r);
  const isAdjacent = adjacentHexes.some(hex => hex.q === defender.q && hex.r === defender.r);
  
  if (!isAdjacent) {
    console.log(`Cannot attack: units are not adjacent`);
    return state;
  }
  
  // Calculate simultaneous damage
  const attackerNewHp = attacker.hp - defender.ap;
  const defenderNewHp = defender.hp - attacker.ap;
  
  console.log(`Combat: ${attacker.owner}'s unit (AP: ${attacker.ap}, HP: ${attacker.hp}) ↔ ${defender.owner}'s unit (AP: ${defender.ap}, HP: ${defender.hp})`);
  console.log(`Result: Attacker HP ${attacker.hp} → ${attackerNewHp}, Defender HP ${defender.hp} → ${defenderNewHp}`);
  
  // Create a new array without the dead units
  const updatedUnits = state.units
    .map(unit => {
      if (unit.id === attackerId) {
        return { ...unit, hp: attackerNewHp };
      }
      if (unit.id === defenderId) {
        return { ...unit, hp: defenderNewHp };
      }
      return unit;
    })
    .filter(unit => unit.hp > 0); // Remove dead units
  
  // Log unit deaths if they occurred
  if (attackerNewHp <= 0) {
    console.log(`${attacker.owner}'s unit was destroyed in combat`);
  }
  if (defenderNewHp <= 0) {
    console.log(`${defender.owner}'s unit was destroyed in combat`);
  }
  
  return {
    ...state,
    units: updatedUnits,
    selectedUnit: null // Clear selection after combat
  };
}

    case 'END_PHASE':
      // END_PHASE is the same as NEXT_PHASE in our implementation
      return gameReducer(state, { type: 'NEXT_PHASE' });
      
    case 'SET_BOARD':
      return {
        ...state,
        board: action.payload,
      };
    
      case 'START_GAME': {
        console.log(`Starting game with player ${action.payload.startingPlayer} going first`);
        
        // Create initial decks for both players
        const deckA = createPlayerDeck('A');
        const deckB = createPlayerDeck('B');
        
        // Set up the initial game state with the specified starting player
        return {
          ...state,
          currentPlayer: action.payload.startingPlayer,
          gameStarted: true,
          resources: {
            A: { gold: 0 },
            B: { gold: 0 }
          },
          decks: {
            A: deckA,
            B: deckB
          },
          hands: {
            A: [],
            B: []
          }
        };
      }
    
    case 'COMPLETE_SETUP': {
      console.log("Setup complete, moving to main game phases");
      
      // Mark setup as complete
      const setupCompleteState: GameState = {
        ...state,
        setupComplete: true,
        currentPhase: GamePhase.Resource
      };
      
      // Get the current player
      const player = setupCompleteState.currentPlayer;
      
      // Count how many hexes are generating resources for this player
      const resourceGeneratingHexes = setupCompleteState.board.filter(
        hex => hex.capitalOwner === player && hex.generateResource === true
      ).length;
      
      // Since this is turn 1, limit active generators to 1
      const activeGenerators = Math.min(resourceGeneratingHexes, 1);
      
      console.log(`Initial resource collection: Player ${player} has ${resourceGeneratingHexes} resource generators, but only ${activeGenerators} are active for the first turn`);
      
      // Calculate resource gain (1 per active generator)
      const resourceGain = activeGenerators;
      
      // Add the resources to the current player
      return {
        ...setupCompleteState,
        turnNumber: {
          ...setupCompleteState.turnNumber,
          [player]: 1 // Set to turn 1 explicitly
        },
        resources: {
          ...setupCompleteState.resources,
          [player]: {
            ...setupCompleteState.resources[player],
            gold: resourceGain
          }
        },
        // Mark that resources have been collected this turn
        resourcesCollectedThisTurn: true
      };
    }

    case 'DRAW_CARD': {
      const player = state.currentPlayer;
      const playerDeck = state.decks[player];
      
      // Check if there are cards in the deck
      if (playerDeck.length === 0) {
        console.log(`Player ${player}'s deck is empty, cannot draw`);
        return state;
      }
      
      // Draw the top card from the deck
      const drawnCard = playerDeck[0];
      const newDeck = playerDeck.slice(1); // Remove the top card
      
      console.log(`Player ${player} draws: ${drawnCard.name}`);
      
      // Add the card to the player's hand
      return {
        ...state,
        decks: {
          ...state.decks,
          [player]: newDeck
        },
        hands: {
          ...state.hands,
          [player]: [...state.hands[player], drawnCard]
        }
      };
    }
    
    case 'SELECT_CARD': {
      return {
        ...state,
        selectedCard: action.payload
      };
    }
    
    case 'PLAY_CARD': {
      const { cardId, targetHex } = action.payload;
      const player = state.currentPlayer;
      
      // Find the card in the player's hand
      const cardIndex = state.hands[player].findIndex(card => card.id === cardId);
      if (cardIndex === -1) {
        console.log(`Card ${cardId} not found in player ${player}'s hand`);
        return state;
      }
      
      const card = state.hands[player][cardIndex];
      
      // Check if the player has enough resources to play the card
      if (state.resources[player].gold < card.cost) {
        console.log(`Not enough gold to play ${card.name}`);
        return state;
      }
      
      // Handle card effects based on card type
      let updatedState = {
        ...state,
        // Remove the card from hand
        hands: {
          ...state.hands,
          [player]: [
            ...state.hands[player].slice(0, cardIndex),
            ...state.hands[player].slice(cardIndex + 1)
          ]
        },
        // Deduct the cost
        resources: {
          ...state.resources,
          [player]: {
            ...state.resources[player],
            gold: state.resources[player].gold - card.cost
          }
        },
        // Clear the selected card
        selectedCard: null
      };
      
      // Apply card effects based on type
      switch (card.type) {
        case 'unit': {
          // Deploy a unit if target hex is provided
          if (targetHex) {
            // Check if the hex is valid for deployment
            const targetHexObj = state.board.find(h => h.q === targetHex.q && h.r === targetHex.r);
            const isOccupied = state.units.some(u => u.q === targetHex.q && u.r === targetHex.r);
            
            if (targetHexObj && targetHexObj.zone === player && !isOccupied) {
              const newUnit: Unit = {
                id: `unit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                owner: player,
                q: targetHex.q,
                r: targetHex.r,
                ap: card.unitStats?.ap || 2, // Default if not specified
                hp: card.unitStats?.hp || 3,
                hasMoved: false
              };
              
              updatedState = {
                ...updatedState,
                units: [...updatedState.units, newUnit]
              };
              
              console.log(`Deployed ${card.name} at (${targetHex.q}, ${targetHex.r})`);
            } else {
              console.log(`Invalid target hex for unit deployment`);
              return state; // Don't play the card if target is invalid
            }
          } else {
            console.log(`No target hex provided for unit deployment`);
            return state; // Don't play the card if no target
          }
          break;
        }
        
        case 'resource': {
          // Add resources
          const goldToAdd = card.resourceAmount || 0;
          updatedState = {
            ...updatedState,
            resources: {
              ...updatedState.resources,
              [player]: {
                ...updatedState.resources[player],
                gold: Math.min(updatedState.resources[player].gold + goldToAdd, 20) // Cap at 20
              }
            }
          };
          
          console.log(`Added ${goldToAdd} gold from ${card.name}`);
          break;
        }
        
        case 'building':
        case 'spell':
          // These will be implemented later
          console.log(`Played ${card.type} card: ${card.name}`);
          break;
      }
      
      return updatedState;
    }
      
    case 'RESET_GAME': {
      // Create a fresh game state
      const newState = {
        ...initialGameState,
        // Start with 0 resources
        resources: {
          A: { gold: 0 },
          B: { gold: 0 }
        },
        // Use the provided starting player or default to 'A'
        currentPlayer: action.payload?.startingPlayer || 'A',
        // Reset turn numbers to 0
        turnNumber: {
          A: 0,
          B: 0
        },
        // Empty board
        board: [],
        // Reset game started flag
        gameStarted: false,
        setupComplete: false,
        currentPhase: GamePhase.Setup,
        resourcesCollectedThisTurn: false
      };
      
      // Log the reset
      console.log(`Game reset. Ready for new game.`);
      
      return newState;
    }
      
    default:
      return state;
  }
}

// Create the context
export const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialGameState,
  dispatch: () => null,
});

// Create the provider component
interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

// Create a custom hook for using the game context
export const useGame = () => useContext(GameContext);