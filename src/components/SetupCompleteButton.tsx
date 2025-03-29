import React from 'react';
import { useGame } from '../game-logic/GameContext';
import { GamePhase } from '../game-logic/constants';
import '../styles/SetupCompleteButton.css';

const SetupCompleteButton: React.FC = () => {
  const { state, dispatch } = useGame();
  
  // Check if we have capital placements for both players
  const hasPlayerACapital = state.board.some(hex => hex.capitalOwner === 'A');
  const hasPlayerBCapital = state.board.some(hex => hex.capitalOwner === 'B');
  const capitalsPlaced = hasPlayerACapital && hasPlayerBCapital;

  const handleCompleteSetup = () => {
    dispatch({ type: 'COMPLETE_SETUP' });
  };

  // Only show this button during the Setup phase and when the game has started
  if (state.currentPhase !== GamePhase.Setup || !state.gameStarted || state.setupComplete) {
    return null;
  }

  return (
    <div className="setup-complete-container">
      <button 
        className="setup-complete-button"
        onClick={handleCompleteSetup}
        disabled={!capitalsPlaced}
      >
        {capitalsPlaced 
          ? "Complete Setup & Start Game" 
          : "Place Both Capitals to Continue"}
      </button>
    </div>
  );
};

export default SetupCompleteButton;