import React from 'react';
import { useGame } from '../game-logic/GameContext';
import { GamePhase } from '../game-logic/constants';
import '../styles/PhaseController.css';

const PhaseController: React.FC = () => {
  const { state, dispatch } = useGame();
  
  const handleNextPhase = () => {
    dispatch({ type: 'NEXT_PHASE' });
  };
  
  // Get a more user-friendly display name for each phase
  const getPhaseDisplayName = (phase: GamePhase): string => {
    switch (phase) {
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
      case GamePhase.Resource:
        return 'Collect resources from your buildings and territories.';
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
  
  return (
    <div className="phase-controller">
      <div className="phase-turn-info">
        <div className="turn-display">
          <span className="turn-label">Turn</span>
          <span className="turn-number">{state.turnNumber}</span>
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
      
      <button className="next-phase-button" onClick={handleNextPhase}>
        Next Phase
      </button>
    </div>
  );
};

export default PhaseController;