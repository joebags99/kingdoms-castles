import React, { createContext, useReducer, useContext, ReactNode } from 'react';
import { Hex } from './board'; // Import Hex from board.ts

export interface GameState {
  currentPlayer: 'A' | 'B';
  currentPhase: 'Resource' | 'Draw' | 'Development' | 'Movement' | 'Combat' | 'Intrigue' | 'End';
  turnNumber: number;
  board: Hex[];
}

// Initial state for the game
const initialGameState: GameState = {
  currentPlayer: 'A', // Player A starts
  currentPhase: 'Resource', // Game begins with Resource phase
  turnNumber: 1, // First turn
  board: [], // Empty board to start
};

// Define the types of actions we can dispatch
type GameAction = 
  | { type: 'NEXT_PHASE' }
  | { type: 'NEXT_PLAYER' }
  | { type: 'SET_BOARD', payload: Hex[] }
  | { type: 'RESET_GAME' };

// Create the reducer function to handle state changes
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEXT_PHASE':
      const phases: GameState['currentPhase'][] = [
        'Resource', 'Draw', 'Development', 'Movement', 'Combat', 'Intrigue', 'End'
      ];
      const currentIndex = phases.indexOf(state.currentPhase);
      const nextIndex = (currentIndex + 1) % phases.length;
      const nextPhase = phases[nextIndex];
      
      // If we're going from End back to Resource, we change players and increment turn
      if (nextPhase === 'Resource' && state.currentPhase === 'End') {
        return {
          ...state,
          currentPhase: nextPhase,
          currentPlayer: state.currentPlayer === 'A' ? 'B' : 'A',
          turnNumber: state.currentPlayer === 'B' ? state.turnNumber + 1 : state.turnNumber,
        };
      }
      
      return {
        ...state,
        currentPhase: nextPhase,
      };
      
    case 'NEXT_PLAYER':
      return {
        ...state,
        currentPlayer: state.currentPlayer === 'A' ? 'B' : 'A',
      };
      
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