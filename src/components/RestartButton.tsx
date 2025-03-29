import React, { useState } from 'react';
import { useGame } from '../game-logic/GameContext';
import '../styles/RestartButton.css';

const RestartButton: React.FC = () => {
  const { dispatch } = useGame();
  const [showConfirm, setShowConfirm] = useState(false);

  const resetGame = () => {
    // Just reset the game and don't start it immediately
    // User will need to click the start button again
    dispatch({ type: 'RESET_GAME' });
    setShowConfirm(false);
  };

  const handleClick = () => {
    setShowConfirm(true);
  };

  const cancelReset = () => {
    setShowConfirm(false);
  };

  return (
    <div className="restart-button-container">
      {!showConfirm ? (
        <button className="reset-button" onClick={handleClick}>
          Restart Game
        </button>
      ) : (
        <div className="confirm-buttons">
          <button className="confirm-yes" onClick={resetGame}>
            Yes, Restart
          </button>
          <button className="confirm-no" onClick={cancelReset}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default RestartButton;