// src/game-logic/GameContext.tsx

import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { Hex } from './board'; // Import Hex from board.ts
import { GamePhase } from './constants'; // Import the game phase enum

export interface GameState {
  currentPlayer: 'A' | 'B';
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
}

// Initial state for the game
const initialGameState: GameState = {
  currentPlayer: 'A', // Player A starts
  currentPhase: GamePhase.Setup, // Game begins with Setup phase
  turnNumber: {
    A: 0,  // Start at turn 0
    B: 0   // Start at turn 0
  },
  board: [], // Empty board to start
  resources: {
    A: { gold: 0 },
    B: { gold: 0 }
  },
  gameStarted: false,
  setupComplete: false
};

// Define the types of actions we can dispatch
type GameAction = 
  | { type: 'NEXT_PHASE' }
  | { type: 'END_PHASE' }
  | { type: 'COLLECT_RESOURCES' }
  | { type: 'SET_BOARD', payload: Hex[] }
  | { type: 'RESET_GAME', payload?: { startingPlayer: 'A' | 'B' } }
  | { type: 'START_GAME', payload: { startingPlayer: 'A' | 'B' } }
  | { type: 'COMPLETE_SETUP' };

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
      
      // If we're entering the Resource phase for any player
      if (phaseToUse === GamePhase.Resource) {
        // If we're coming from End phase, switch players
        if (state.currentPhase === GamePhase.End) {
          const newPlayer: 'A' | 'B' = state.currentPlayer === 'A' ? 'B' : 'A';
          
          // Switch to the new player
          newState = {
            ...newState,
            currentPlayer: newPlayer
          };
        }
        
        // If setup is complete, increment turn and collect resources
        if (state.setupComplete) {
          // Always increment the current player's turn when they enter Resource phase (after setup)
          const currentPlayer = newState.currentPlayer;
          const newTurn = {
            ...newState.turnNumber,
            [currentPlayer]: newState.turnNumber[currentPlayer] + 1
          };
          
          console.log(`Player ${currentPlayer}'s turn incremented to ${newTurn[currentPlayer]}`);
          
          // Update turn number and then collect resources
          newState = {
            ...newState,
            turnNumber: newTurn
          };
          
          // Then collect resources
          return gameReducer(newState, { type: 'COLLECT_RESOURCES' });
        }
      }
      
      return newState;
    }
      
    case 'END_PHASE':
      // END_PHASE is the same as NEXT_PHASE in our implementation
      return gameReducer(state, { type: 'NEXT_PHASE' });

    case 'COLLECT_RESOURCES': {
      const player = state.currentPlayer;
      
      // If the game hasn't officially started, don't collect resources
      if (!state.gameStarted || !state.setupComplete) {
        console.log("Game not fully started yet, skipping resource collection");
        return state;
      }
      
      // Count how many hexes are generating resources for this player
      const resourceGeneratingHexes = state.board.filter(
        hex => hex.capitalOwner === player && hex.generateResource === true
      ).length;
      
      // Limit active generators by the player's current turn number
      // Turn 1 = 1 generator, Turn 2 = 2 generators, etc.
      const playerTurnNumber = state.turnNumber[player];
      const activeGenerators = Math.min(resourceGeneratingHexes, playerTurnNumber);
      
      console.log(`Player ${player} has ${resourceGeneratingHexes} resource generators, but only ${activeGenerators} are active in their turn ${playerTurnNumber}`);
      
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
    
    case 'START_GAME': {
      console.log(`Starting game with player ${action.payload.startingPlayer} going first`);
      
      // Set up the initial game state with the specified starting player
      return {
        ...state,
        currentPlayer: action.payload.startingPlayer,
        gameStarted: true,
        resources: {
          A: { gold: 0 },
          B: { gold: 0 }
        }
      };
    }
    
    case 'COMPLETE_SETUP': {
      console.log("Setup complete, moving to main game phases");
      
      // Mark setup as complete and move to resource phase
      const newState = {
        ...state,
        setupComplete: true,
        currentPhase: GamePhase.Resource
      };
      
      // Collect initial resources for the starting player
      return gameReducer(newState, { type: 'COLLECT_RESOURCES' });
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
        currentPhase: GamePhase.Setup
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