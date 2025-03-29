import React from 'react';
import { useGame } from '../game-logic/GameContext';
import PhaseController from './PhaseController';
import ResourcePanel from './ResourcePanel';
import '../styles/GameStatus.css';

const GameStatus: React.FC = () => {
  const { state } = useGame();

  // Calculate territory control for each player
  const calculateTerritoryControl = () => {
    if (state.board.length === 0) return { A: 0, B: 0, Neutral: 0 };
    
    const territories = state.board.reduce((counts, hex) => {
      counts[hex.zone] = (counts[hex.zone] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    return {
      A: territories['A'] || 0,
      B: territories['B'] || 0,
      Neutral: territories['Neutral'] || 0
    };
  };
  
  const territoryControl = calculateTerritoryControl();
  
  // Count capitals (this is a simple implementation; you might need to adjust based on your game state)
  const countCapitals = () => {
    if (state.board.length === 0) return { A: 0, B: 0 };
    
    return state.board.reduce((counts, hex) => {
      if (hex.capitalOwner) {
        counts[hex.capitalOwner] = (counts[hex.capitalOwner] || 0) + 1;
      }
      return counts;
    }, {} as Record<string, number>);
  };
  
  const capitalCounts = countCapitals();
  
  // Check border control (simplified - actual implementation would depend on your game rules)
  const borderControl = () => {
    // This would check if a player controls all border hexes
    // Simplified implementation for now
    return "Contested";
  };
  
  return (
    <div className="game-status-panel">
      <h2>Game Status</h2>
      
      {/* Phase Controller component that handles phase transitions and descriptions */}
      <PhaseController />

      {/* Resource Panel component */}
      <ResourcePanel />
      
      <div className="status-section">
        <h3 className="status-section-title">Territory</h3>
        <div className="status-grid">
          <div className="status-item">
            <div className="status-label">Player A Territory</div>
            <div className="status-value">{territoryControl.A} hexes</div>
          </div>
          
          <div className="status-item">
            <div className="status-label">Player B Territory</div>
            <div className="status-value">{territoryControl.B} hexes</div>
          </div>
          
          <div className="status-item">
            <div className="status-label">Neutral/Disputed</div>
            <div className="status-value">{territoryControl.Neutral} hexes</div>
          </div>
        </div>
      </div>
      
      <div className="status-section">
        <h3 className="status-section-title">Strategic Points</h3>
        <div className="status-grid">
          <div className="status-item">
            <div className="status-label">Player A Capital</div>
            <div className="status-value">{capitalCounts.A || 0} hexes</div>
          </div>
          
          <div className="status-item">
            <div className="status-label">Player B Capital</div>
            <div className="status-value">{capitalCounts.B || 0} hexes</div>
          </div>
          
          <div className="status-item">
            <div className="status-label">Border Control</div>
            <div className="status-value">{borderControl()}</div>
          </div>
        </div>
      </div>
      
      <div className="status-section">
        <h3 className="status-section-title">Victory Progress</h3>
        <div className="status-grid">
          <div className="status-item">
            <div className="status-label">Domination</div>
            <div className="status-value">0/6 border hexes</div>
          </div>
          
          <div className="status-item">
            <div className="status-label">Capital Health</div>
            <div className="status-value">A: 15 | B: 15</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStatus;