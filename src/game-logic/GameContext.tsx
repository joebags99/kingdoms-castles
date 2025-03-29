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
  // Add a flag to track if resources were collected this turn
  resourcesCollectedThisTurn: boolean;
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
  setupComplete: false,
  resourcesCollectedThisTurn: false
};

// Define the types of actions we can dispatch
type GameAction = 
  | { type: 'NEXT_PHASE' }
  | { type: 'END_PHASE' }
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