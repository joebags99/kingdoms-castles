// src/game-logic/GameContext.tsx

import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { Hex } from './board'; // Import Hex from board.ts
import { GamePhase } from './constants'; // Import the game phase enum

export interface GameState {
  currentPlayer: 'A' | 'B';
  currentPhase: GamePhase;
  turnNumber: number;
  board: Hex[];
  resources: {
    A: { gold: number },
    B: { gold: number }
  };
}

// Initial state for the game
const initialGameState: GameState = {
  currentPlayer: 'A', // Player A starts
  currentPhase: GamePhase.Resource, // Game begins with Resource phase
  turnNumber: 1, // First turn
  board: [], // Empty board to start
  resources: {
    A: { gold: 5 },
    B: { gold: 5 }
  }
};

// Define the types of actions we can dispatch
type GameAction = 
  | { type: 'NEXT_PHASE' }
  | { type: 'END_PHASE' }
  | { type: 'COLLECT_RESOURCES' }
  | { type: 'SET_BOARD', payload: Hex[] }
  | { type: 'RESET_GAME', payload?: { startingPlayer: 'A' | 'B' } };

// Create the reducer function to handle state changes
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEXT_PHASE': {
      const phases = Object.values(GamePhase);
      const currentIndex = phases.indexOf(state.currentPhase);
      const nextIndex = (currentIndex + 1) % phases.length;
      const nextPhase = phases[nextIndex];
      
      // If we're going from End back to Resource, we change players and increment turn
      if (nextPhase === GamePhase.Resource && state.currentPhase === GamePhase.End) {
        const newPlayer: 'A' | 'B' = state.currentPlayer === 'A' ? 'B' : 'A';
        const newTurnNumber = newPlayer === 'A' ? state.turnNumber + 1 : state.turnNumber;
        
        // First update player and turn
        const playerChangedState: GameState = {
          ...state,
          currentPhase: nextPhase,
          currentPlayer: newPlayer,
          turnNumber: newTurnNumber,
        };
        
        // Then collect resources for the new player
        return gameReducer(playerChangedState, { type: 'COLLECT_RESOURCES' });
      }
      
      // For all other phase transitions, just update the phase
      return {
        ...state,
        currentPhase: nextPhase,
      };
    }
      
    case 'END_PHASE':
      // END_PHASE is the same as NEXT_PHASE in our implementation
      return gameReducer(state, { type: 'NEXT_PHASE' });

    case 'COLLECT_RESOURCES': {
      const player = state.currentPlayer;
      
      // Count how many hexes are generating resources for this player
      const resourceGeneratingHexes = state.board.filter(
        hex => hex.capitalOwner === player && hex.generateResource === true
      ).length;
      
      // Limit active generators by turn number
      // Turn 1 = 1 generator, Turn 2 = 2 generators, etc.
      const activeGenerators = Math.min(resourceGeneratingHexes, state.turnNumber);
      
      console.log(`Player ${player} has ${resourceGeneratingHexes} resource generators, but only ${activeGenerators} are active in turn ${state.turnNumber}`);
      
      // Each active generator provides 1 gold
      const resourceGain = activeGenerators;
      
      // Calculate new gold amount, capped at 20
      const currentGold = state.resources[player].gold;
      const newGold = Math.min(currentGold + resourceGain, 20);
      
      console.log(`Player ${player} gold: ${currentGold} + ${resourceGain} = ${newGold}`);
      
      // Create a new state object with updated resources
      return {
        ...state,
        resources: {
          ...state.resources,
          [player]: { 
            ...state.resources[player],
            gold: newGold
          }
        }
      };
    }
      
    case 'SET_BOARD':
      return {
        ...state,
        board: action.payload,
      };
      
    case 'RESET_GAME': {
      // Create a fresh game state
      const newState = {
        ...initialGameState,
        // Start with 0 resources instead of 5
        resources: {
          A: { gold: 0 },
          B: { gold: 0 }
        },
        // Use the provided starting player or default to 'A'
        currentPlayer: action.payload?.startingPlayer || 'A',
        // Empty board
        board: []
      };
      
      // Log the reset
      console.log(`Game reset. ${newState.currentPlayer === 'A' ? 'Player A' : 'Player B'} will go first.`);
      
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