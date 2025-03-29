// src/components/ResourcePanel.tsx
import React from 'react';
import { useGame } from '../game-logic/GameContext';
import '../styles/ResourcePanel.css';

const ResourcePanel: React.FC = () => {
  const { state } = useGame();
  
  // Count resource generating hexes
  const countResourceGenerators = (player: 'A' | 'B') => {
    return state.board.filter(
      hex => hex.capitalOwner === player && hex.generateResource === true
    ).length;
  };
  
  // Helper function to render resource amounts with player-specific styling
  const renderResourceAmount = (player: 'A' | 'B', resource: string, amount: number) => {
    return (
      <div className={`resource-item player-${player}-resource`}>
        <div className="resource-icon gold-icon"></div>
        <div className="resource-label">{resource}</div>
        <div className="resource-amount">{amount}</div>
      </div>
    );
  };
  
  const resourceGeneratorsA = countResourceGenerators('A');
  const resourceGeneratorsB = countResourceGenerators('B');
  
  return (
    <div className="resource-panel">
      <h3 className="resource-panel-title">Resources</h3>
      
      <div className="player-resources">
        <div className="player-resource-section">
          <div className="player-label player-A-label">
            <span className="player-indicator player-A"></span>
            Player A
          </div>
          <div className="resource-list">
            {renderResourceAmount('A', 'Gold', state.resources.A.gold)}
            {/* Add more resources as you expand the game */}
          </div>
        </div>
        
        <div className="player-resource-section">
          <div className="player-label player-B-label">
            <span className="player-indicator player-B"></span>
            Player B
          </div>
          <div className="resource-list">
            {renderResourceAmount('B', 'Gold', state.resources.B.gold)}
            {/* Add more resources as you expand the game */}
          </div>
        </div>
      </div>
      
      <div className="resource-info">
        <p>Gold income: {Math.min(state.turnNumber, 6)} per turn</p>
        <p>Active generators: A: {resourceGeneratorsA} | B: {resourceGeneratorsB}</p>
        <p>Limit: 20 gold max</p>
      </div>
    </div>
  );
};

export default ResourcePanel;