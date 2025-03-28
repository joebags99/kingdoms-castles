import React from 'react';
import { useGame } from '../game-logic/GameContext';
import { placeCapital } from '../game-logic/board';
import '../styles/CapitalSetup.css';

const CapitalSetup: React.FC = () => {
  const { state, dispatch } = useGame();
  
  const setupCapitals = () => {
    // Find a good position for player A's capital (left side of the board)
    const playerACapitalQ = 2;  // Left side of the board
    const playerACapitalR = 3;  // Middle row approximately
    
    // Find a good position for player B's capital (right side of the board)
    const boardWidth = state.board.length > 0 ? 
      Math.max(...state.board.map(hex => hex.q)) + 1 : 15;
    const playerBCapitalQ = boardWidth - 3;  // Right side of the board
    const playerBCapitalR = 3;  // Middle row approximately
    
    // Place Player A's capital
    let updatedBoard = placeCapital(state.board, "A", playerACapitalQ, playerACapitalR);
    
    // Place Player B's capital
    updatedBoard = placeCapital(updatedBoard, "B", playerBCapitalQ, playerBCapitalR);
    
    // Update the board in the game state
    dispatch({ type: 'SET_BOARD', payload: updatedBoard });
  };
  
  return (
    <div className="capital-setup">
      <button 
        onClick={setupCapitals} 
        className="setup-button"
        disabled={state.board.length === 0}
      >
        Place Capitals
      </button>
    </div>
  );
};

export default CapitalSetup;