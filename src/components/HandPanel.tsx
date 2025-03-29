import React from 'react';
import { useGame } from '../game-logic/GameContext';
import { GamePhase } from '../game-logic/constants';
import { Card } from '../game-logic/types';
import '../styles/HandPanel.css';

const HandPanel: React.FC = () => {
  const { state, dispatch } = useGame();
  const playerHand = state.hands[state.currentPlayer];
  const isDevelopmentPhase = state.currentPhase === GamePhase.Dev1 || state.currentPhase === GamePhase.Dev2;
  
  const handleCardClick = (cardId: string) => {
    // If we're in a development phase, select the card
    if (isDevelopmentPhase) {
      dispatch({ type: 'SELECT_CARD', payload: cardId });
    }
  };
  
  const handlePlayCard = () => {
    if (!state.selectedCard) return;
    
    const selectedCard = playerHand.find(card => card.id === state.selectedCard);
    if (!selectedCard) return;
    
    if (selectedCard.type === 'unit') {
      // For unit cards, we need to select a hex
      console.log('Select a hex to deploy this unit');
    } else {
      // For other cards, play them immediately
      dispatch({ 
        type: 'PLAY_CARD', 
        payload: { cardId: state.selectedCard } 
      });
    }
  };
  
  const handleCancelSelection = () => {
    dispatch({ type: 'SELECT_CARD', payload: null });
  };
  
  const isCardPlayable = (card: Card | undefined): boolean => {
    // First check if card exists
    if (!card) return false;
    
    // Check if we're in a development phase
    if (!isDevelopmentPhase) return false;
    
    // Check if the player has enough gold
    return state.resources[state.currentPlayer].gold >= card.cost;
  };
  
  // Determine if the selected card is a unit that needs placement
  const isSelectingUnitPlacement = state.selectedCard && 
    playerHand.find(card => card.id === state.selectedCard)?.type === 'unit';
  
  return (
    <div className="hand-panel">
      <div className="hand-panel-header">
        <h3>Your Hand</h3>
        
        <div className="header-right">
          {isSelectingUnitPlacement && (
            <span className="card-placement-msg">
              Click on a hex in your territory to deploy this unit
            </span>
          )}
          
          {state.selectedCard && !isSelectingUnitPlacement && (
            <div className="card-action-buttons">
                <button 
                className="play-button"
                onClick={handlePlayCard}
                disabled={!state.selectedCard || !isCardPlayable(playerHand.find(card => card.id === state.selectedCard))}
                >
                Play Card
                </button>
              <button className="cancel-button" onClick={handleCancelSelection}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      
      {playerHand.length === 0 ? (
        <div className="hand-panel-empty">No cards in hand</div>
      ) : (
        <div className="cards-container">
          {playerHand.map(card => (
            <div 
              key={card.id} 
              className={`card ${state.selectedCard === card.id ? 'selected' : ''}`}
              onClick={() => handleCardClick(card.id)}
            >
              {isCardPlayable(card) && <div className="playable-indicator" />}
              
              <div className="card-header">
                <h4 className="card-name">{card.name}</h4>
              </div>
              
              <div className="card-content">
                <div className="card-type">{card.type} {card.subtype ? `- ${card.subtype}` : ''}</div>
                <div className="card-description">{card.description}</div>
                
                <div className="card-stats">
                  <div className="card-cost">{card.cost}</div>
                  
                  {card.type === 'unit' && card.unitStats && (
                    <div className="card-power">
                      <div className="card-ap">{card.unitStats.ap}</div>
                      <div className="card-hp">{card.unitStats.hp}</div>
                    </div>
                  )}
                  
                  {card.type === 'resource' && (
                    <div className="card-power">
                      <div className="card-ap">+{card.resourceAmount}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HandPanel;