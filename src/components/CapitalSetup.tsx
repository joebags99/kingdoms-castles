import React from 'react';
import { useGame } from '../game-logic/GameContext';
import { placeCapital } from '../game-logic/board';
import '../styles/CapitalSetup.css';

const CapitalSetup: React.FC = () => {
  const { state, dispatch } = useGame();
  
  const setupCapitals = () => {
    const boardWidth = state.board.length > 0 ? 
      Math.max(...state.board.map(hex => hex.q)) + 1 : 15;
    const boardHeight = state.board.length > 0 ? 
      Math.max(...state.board.map(hex => hex.r)) + 1 : 8;
    
    // Calculate player territory sizes
    const borderlands = 2;
    const playerRows = (boardHeight - borderlands) / 2;
    
    // Place Player A's capital (in Player A territory)
    const playerACapitalQ = Math.floor(boardWidth / 2);  // Middle column
    const playerACapitalR = Math.floor(playerRows / 2);  // Middle of Player A territory
    
    // Place Player B's capital (in Player B territory)
    const playerBCapitalQ = Math.floor(boardWidth / 2);  // Middle column
    const playerBCapitalR = Math.floor(playerRows + borderlands + playerRows / 2);  // Middle of Player B territory
    
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