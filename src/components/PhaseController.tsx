import React from 'react';
import { useGame } from '../game-logic/GameContext';
import { GamePhase } from '../game-logic/constants';
import SetupCompleteButton from './SetupCompleteButton';
import '../styles/PhaseController.css';

const PhaseController: React.FC = () => {
  const { state, dispatch } = useGame();
  
  // In the handleNextPhase function
  const handleNextPhase = () => {
    console.log("Moving to next phase from", state.currentPhase);
    
    // If we're leaving the Resource phase, show a message about collecting resources
    if (state.currentPhase === GamePhase.Resource) {
      console.log("Collecting resources as player leaves Resource phase");
    }
    
    // If we're in Combat phase, wait a moment to allow combat resolution
    if (state.currentPhase === GamePhase.Combat) {
      // We'll directly proceed to the next phase, but the Board component
      // will handle executing attacks as part of its phase change detection
      console.log("Ending combat phase - attacks will resolve");
            
      // Then after a short delay, move to the next phase
      setTimeout(() => {
        dispatch({ type: 'NEXT_PHASE' });
      }, 500); // 500ms delay to allow combat to resolve
    } else {
      // For other phases, immediately go to the next phase
      dispatch({ type: 'NEXT_PHASE' });
    }
  };
  
  // Get a more user-friendly display name for each phase
  const getPhaseDisplayName = (phase: GamePhase): string => {
    switch (phase) {
      case GamePhase.Setup:
        return 'Setup Phase';
      case GamePhase.Resource:
        return 'Resource Phase';
      case GamePhase.Draw:
        return 'Draw Phase';
      case GamePhase.Dev1:
        return 'Development I';
      case GamePhase.Movement:
        return 'Movement Phase';
      case GamePhase.Combat:
        return 'Combat Phase';
      case GamePhase.Dev2:
        return 'Development II';
      case GamePhase.End:
        return 'End Phase';
      default:
        return String(phase);
    }
  };
  
  // Get a description of what actions are available in each phase
  const getPhaseDescription = (phase: GamePhase): string => {
    switch (phase) {
      case GamePhase.Setup:
        return 'Place your capitals and prepare your kingdom for the game.';
      case GamePhase.Resource:
        return 'Resource generators will activate at the end of this phase. Resources from active generators are based on turn number.';
      case GamePhase.Draw:
        return 'Draw a card from your deck to add to your hand.';
      case GamePhase.Dev1:
        return 'Build structures, deploy units, or upgrade your capital.';
      case GamePhase.Movement:
        return 'Move your units across the battlefield according to their movement values.';
      case GamePhase.Combat:
        return 'Declare attacks and resolve combat between units.';
      case GamePhase.Dev2:
        return 'Build additional structures or deploy reinforcements.';
      case GamePhase.End:
        return 'Resolve end-of-turn effects and check victory conditions.';
      default:
        return '';
    }
  };
  
  // Get current turn number for the active player
  const currentPlayerTurn = state.turnNumber[state.currentPlayer];
  
  // Show a message about what will happen when you click Next Phase
  const getNextPhaseActionDescription = () => {
    if (state.currentPhase === GamePhase.Resource) {
      return `Collect resources from ${Math.min(currentPlayerTurn, 6)} generator(s)`;
    }
    if (state.currentPhase === GamePhase.End) {
      const nextPlayer = state.currentPlayer === 'A' ? 'B' : 'A';
      return `Switch to Player ${nextPlayer}`;
    }
    return "Proceed to next phase";
  };
  
  // Check if the button should be disabled
  const isNextPhaseButtonDisabled = () => {
    return state.currentPhase === GamePhase.Setup;
  };
  
  return (
    <div className="phase-controller">
      <div className="phase-turn-info">
        <div className="turn-display">
          <span className="turn-label">Turn</span>
          <span className="turn-number">{currentPlayerTurn}</span>
        </div>
        <div className={`player-display player-${state.currentPlayer}`}>
          <span className="player-dot"></span>
          <span>Player {state.currentPlayer}</span>
        </div>
      </div>
      
      <div className="phase-info">
        <h3 className="phase-name">{getPhaseDisplayName(state.currentPhase)}</h3>
        <p className="phase-description">{getPhaseDescription(state.currentPhase)}</p>
      </div>
      
      {state.currentPhase === GamePhase.Setup ? (
        <SetupCompleteButton />
      ) : (
        <button 
          className="next-phase-button" 
          onClick={handleNextPhase}
          disabled={isNextPhaseButtonDisabled()}
        >
          {getNextPhaseActionDescription()}
        </button>
      )}
    </div>
  );
};

export default PhaseController;