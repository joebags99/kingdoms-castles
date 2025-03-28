import React from 'react';
import { useGame } from '../game-logic/GameContext';
import '../styles/GameStatus.css';

const GameStatus: React.FC = () => {
  const { state, dispatch } = useGame();
  
  const handleNextPhase = () => {
    dispatch({ type: 'NEXT_PHASE' });
  };
  
  return (
    <div className="game-status-panel">
      <h2>Game Status</h2>
      <div className="status-grid">
        <div className="status-item">
          <div className="status-label">Player</div>
          <div className="status-value player-value">
            <span className={`player-indicator player-${state.currentPlayer}`}></span>
            Player {state.currentPlayer}
          </div>
        </div>
        
        <div className="status-item">
          <div className="status-label">Phase</div>
          <div className="status-value phase-value">{state.currentPhase}</div>
        </div>
        
        <div className="status-item">
          <div className="status-label">Turn</div>
          <div className="status-value">{state.turnNumber}</div>
        </div>
        
        <div className="status-item">
          <div className="status-label">Board</div>
          <div className="status-value">{state.board.length} hexes</div>
        </div>
      </div>
      
      <button className="next-phase-button" onClick={handleNextPhase}>
        Next Phase
      </button>
    </div>
  );
};

export default GameStatus;