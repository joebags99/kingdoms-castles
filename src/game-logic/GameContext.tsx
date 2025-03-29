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
    A: { gold: 0 },
    B: { gold: 0 }
  }
};

// Define the types of actions we can dispatch
type GameAction = 
  | { type: 'NEXT_PHASE' }
  | { type: 'END_PHASE' }
  | { type: 'COLLECT_RESOURCES' }
  | { type: 'SET_BOARD', payload: Hex[] }
  | { type: 'RESET_GAME' };

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
        return {
          ...state,
          currentPhase: nextPhase,
          currentPlayer: state.currentPlayer === 'A' ? 'B' : 'A',
          turnNumber: state.currentPlayer === 'B' ? state.turnNumber + 1 : state.turnNumber,
        };
      }
      
      // If we're entering the Resource phase, automatically collect resources
      if (nextPhase === GamePhase.Resource) {
        // First update the phase
        const newState = {
          ...state,
          currentPhase: nextPhase,
        };
        
        // Then collect resources by calling the reducer recursively
        return gameReducer(newState, { type: 'COLLECT_RESOURCES' });
      }
      
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
        
        // Calculate how many gold resources the current player receives
        // It equals the number of hexes with capitalOwner = current player
        const capitalHexes = state.board.filter(hex => hex.capitalOwner === player).length;
        
        // Resource gain depends on turn number, capped at 6
        const resourceGain = Math.min(state.turnNumber, 6);
        
        // Calculate new gold amount, capped at 20
        const currentGold = state.resources[player].gold;
        const newGold = Math.min(currentGold + resourceGain, 20);
        
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
      
    case 'RESET_GAME':
      return initialGameState;
      
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