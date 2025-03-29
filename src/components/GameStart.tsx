import React, { useState } from 'react';
import { useGame } from '../game-logic/GameContext';
import '../styles/GameStart.css';

const GameStart: React.FC = () => {
  const { dispatch } = useGame();
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [showDiceResult, setShowDiceResult] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    // Roll a d6 dice
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceResult(roll);
    setShowDiceResult(true);
    
    // Determine starting player
    const startingPlayer: 'A' | 'B' = roll % 2 === 0 ? 'A' : 'B';
    
    // Reset game and set starting player
    dispatch({ type: 'RESET_GAME', payload: { startingPlayer } });
    
    // Hide the dice result after 2 seconds and then collect initial resources
    setTimeout(() => {
      setShowDiceResult(false);
      setGameStarted(true);
      
      // Explicitly collect resources for the starting player
      dispatch({ type: 'COLLECT_RESOURCES' });
    }, 2000);
  };

  const resetGame = () => {
    setGameStarted(false);
    setDiceResult(null);
    dispatch({ type: 'RESET_GAME', payload: { startingPlayer: 'A' } });
  };

  return (
    <div className="game-start">
      {!gameStarted ? (
        <div className="start-screen">
          <h2>Kingdoms & Castles</h2>
          <p>Roll a die to determine who goes first:</p>
          <p>Even (2,4,6): Player A | Odd (1,3,5): Player B</p>
          <button className="start-button" onClick={startGame}>
            Roll Dice & Start Game
          </button>
          
          {showDiceResult && diceResult && (
            <div className="dice-result">
              <div className="dice">{diceResult}</div>
              <p>
                {diceResult % 2 === 0 
                  ? "Player A goes first!"
                  : "Player B goes first!"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <React.Fragment />
      )}
    </div>
  );
};

export default GameStart;