// src/components/Board.tsx
import React, { useEffect, useState, useRef } from 'react';
import { generateBoard, hexToPixel, Hex, toggleResourceGeneration, getAdjacentHexes } from '../game-logic/board';
import { useGame } from '../game-logic/GameContext';
import { GamePhase } from '../game-logic/constants';
import '../styles/Board.css';

const Board: React.FC = () => {
  const { state, dispatch } = useGame();
  const [hexSize, setHexSize] = useState(22); // Reduced default size
  const [selectedHex, setSelectedHex] = useState<{q: number, r: number} | null>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate the visible boundaries of the board
  const getBoardMetrics = () => {
    if (state.board.length === 0) {
      return { 
        minQ: 0, 
        maxQ: 14, 
        minR: 0, 
        maxR: 6, 
        hexCount: 0,
        width: 15,  // Default width
        height: 7   // Default height
      };
    }
    
    let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
    
    state.board.forEach(hex => {
      minQ = Math.min(minQ, hex.q);
      maxQ = Math.max(maxQ, hex.q);
      minR = Math.min(minR, hex.r);
      maxR = Math.max(maxR, hex.r);
    });
    
    return { 
      minQ, 
      maxQ, 
      minR, 
      maxR, 
      hexCount: state.board.length,
      width: maxQ - minQ + 1,
      height: maxR - minR + 1
    };
  };
  
  // Generate the board when component mounts or when the board is empty
  useEffect(() => {
    // Only generate a new board if it's empty (initial load or after reset)
    if (state.board.length === 0) {
      const boardWidth = 15;  // Horizontal extent (columns)
      const boardHeight = 8;  // Vertical extent (rows): 3 for Player A + 2 for borderlands + 3 for Player B
      const newBoard = generateBoard(boardWidth, boardHeight);
      dispatch({ type: 'SET_BOARD', payload: newBoard });
    }
  }, [dispatch, state.board.length]);
  
  // Adjust hex size when window or container resizes
  useEffect(() => {
    const handleResize = () => {
      if (!boardContainerRef.current) return;
      
      const metrics = getBoardMetrics();
      const containerWidth = boardContainerRef.current.clientWidth - 40;
      const containerHeight = boardContainerRef.current.clientHeight - 40;
      
      // Calculate the horizontal and vertical span for pointy-topped hexes
      const horizontalSpan = (metrics.width + 1) * Math.sqrt(3) * hexSize;
      const verticalSpan = (metrics.height + 1) * 1.5 * hexSize;
      
      // Calculate the maximum size that will fit
      const maxSizeForWidth = containerWidth / horizontalSpan;
      const maxSizeForHeight = containerHeight / verticalSpan;
      
      // Use the smaller size to ensure everything fits
      const newSize = Math.min(maxSizeForWidth, maxSizeForHeight, 30);
      setHexSize(Math.max(newSize, 12)); // Don't go too small
    };
    
    handleResize(); // Initial sizing
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.board, hexSize]);

  // Determine color based on zone and capital status
  const getHexColor = (hex: Hex) => {
    // If this is part of a capital, use a brighter/highlighted color
    if (hex.capitalOwner === 'A') {
      // Resource generating hexes are brighter
      return hex.generateResource ? '#CC0000' : '#9A0000';
    } else if (hex.capitalOwner === 'B') {
      // Resource generating hexes are brighter
      return hex.generateResource ? '#FFD700' : '#FFB733';
    }
    
    // If not part of a capital, use standard zone colors
    switch (hex.zone) {
      case 'A':
        return '#660000'; // Royal Red for Player A
      case 'B': 
        return '#CC9933'; // Belaklara Gold for Player B
      case 'Neutral':
        return '#193B1C'; // Guardian Green for neutral zones
      default:
        return '#FBFBD7'; // Divine Light White as fallback
    }
  };

  // Generate points for a hexagon shape (pointy-topped)
  const hexPoints = (size: number): string => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = 2 * Math.PI / 6 * i + Math.PI/6; // Rotated 30 degrees for pointy-top
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  const [attackTarget, setAttackTarget] = useState<string | null>(null);

  // Handle hex click based on current phase
  const handleHexClick = (hex: Hex) => {
    const { q, r } = hex;
    
    // If in Setup phase and hex is part of a capital, toggle resource generation
    if (state.currentPhase === GamePhase.Setup && hex.capitalOwner) {
      const updatedBoard = toggleResourceGeneration(state.board, q, r);
      dispatch({ type: 'SET_BOARD', payload: updatedBoard });
      return;
    }
    
    // In Development phases, deploy units
    if ((state.currentPhase === GamePhase.Dev1 || state.currentPhase === GamePhase.Dev2) && 
        hex.zone === state.currentPlayer) {
      // Check if this hex is already occupied
      const isOccupied = state.units.some(unit => unit.q === q && unit.r === r);
      if (!isOccupied) {
        // Deploy a basic unit (we'll make these parameters configurable later)
        dispatch({ 
          type: 'DEPLOY_UNIT', 
          payload: { q, r, ap: 3, hp: 5 }
        });
      }
      return;
    }
    
    // In Movement phase, with a selected unit, try to move the unit
    if (state.currentPhase === GamePhase.Movement && state.selectedUnit) {
      const selectedUnitObj = state.units.find(unit => unit.id === state.selectedUnit);
      if (selectedUnitObj && selectedUnitObj.owner === state.currentPlayer) {
        // Try to move the unit to the clicked hex
        dispatch({
          type: 'MOVE_UNIT',
          payload: { unitId: state.selectedUnit, q, r }
        });
      }
      return;
    }
    
    // In Combat phase, with a selected unit, try to attack an enemy unit
  if (state.currentPhase === GamePhase.Combat && state.selectedUnit) {
    const attacker = state.units.find(unit => unit.id === state.selectedUnit);
    if (!attacker || attacker.owner !== state.currentPlayer) return;
    
    // Find if there's a unit on the clicked hex
    const targetUnit = state.units.find(unit => unit.q === q && unit.r === r);
    if (targetUnit && targetUnit.owner !== state.currentPlayer) {
      // Set attack target before launching attack
      setAttackTarget(targetUnit.id);
      
      // Show confirmation UI instead of immediately attacking
      return;
    }
    return;
  }
    
    // Select unit in Movement or Combat phase
    if (state.currentPhase === GamePhase.Movement || state.currentPhase === GamePhase.Combat) {
      setSelectedHex({ q, r });
      
      // Check if there's a unit in this hex
      const unitInHex = state.units.find(unit => unit.q === q && unit.r === r);
      if (unitInHex && unitInHex.owner === state.currentPlayer) {
        // Select this unit
        dispatch({ type: 'SELECT_UNIT', payload: unitInHex.id });
      }
      return;
    }
  };

  const executeAttack = () => {
    if (state.selectedUnit && attackTarget) {
      dispatch({
        type: 'ATTACK_UNIT',
        payload: { attackerId: state.selectedUnit, defenderId: attackTarget }
      });
      // Reset target after attack
      setAttackTarget(null);
    }
  };

      // Cancel attack function
const cancelAttack = () => {
  setAttackTarget(null);
};

// Function to render attack indicators with fantasy-themed highlighting
const renderAttackIndicators = () => {
  if (!state.selectedUnit || state.currentPhase !== GamePhase.Combat) return null;
  
  const unit = state.units.find(u => u.id === state.selectedUnit);
  if (!unit || unit.owner !== state.currentPlayer) return null;
  
  const adjacentHexes = getAdjacentHexes(unit.q, unit.r);
  const attackableUnits = state.units.filter(u => 
    u.owner !== state.currentPlayer && // Enemy units
    adjacentHexes.some(hex => hex.q === u.q && hex.r === u.r) // Adjacent to selected unit
  );
  
  return (
    <>
      {attackableUnits.map((enemyUnit) => {
        const { x: enemyX, y: enemyY } = hexToPixel(enemyUnit.q, enemyUnit.r, hexSize);
        const isTargeted = attackTarget === enemyUnit.id;
        
        return (
          <g 
            key={`attack-${enemyUnit.id}`}
            transform={`translate(${enemyX}, ${enemyY})`}
            className={`attack-indicator ${isTargeted ? 'targeted' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isTargeted) {
                // If already targeted, execute the attack
                executeAttack();
              } else {
                // Otherwise, select this as the target
                setAttackTarget(enemyUnit.id);
              }
            }}
          >
            {/* Fantasy-themed aura/glow for attackable unit */}
            <circle 
              cx="0" 
              cy="0" 
              r={hexSize * 0.6} 
              className="attack-glow"
              fill="url(#attackGradient)"
              opacity={isTargeted ? 0.8 : 0.5}
            />
            
            {/* Decorative "sword" icons at cardinal points */}
            {!isTargeted && (
              <>
                <path 
                  d="M0,-20 L-3,-10 L0,-5 L3,-10 Z" 
                  fill="#F8D100"
                  stroke="#FF0000"
                  strokeWidth="1"
                  className="attack-icon"
                  transform="scale(0.8)"
                />
                <path 
                  d="M0,20 L-3,10 L0,5 L3,10 Z" 
                  fill="#F8D100"
                  stroke="#FF0000"
                  strokeWidth="1"
                  className="attack-icon"
                  transform="scale(0.8) rotate(180)"
                />
                <path 
                  d="M0,-20 L-3,-10 L0,-5 L3,-10 Z" 
                  fill="#F8D100"
                  stroke="#FF0000"
                  strokeWidth="1"
                  className="attack-icon"
                  transform="scale(0.8) rotate(90) translate(0, -20)"
                />
                <path 
                  d="M0,-20 L-3,-10 L0,-5 L3,-10 Z" 
                  fill="#F8D100"
                  stroke="#FF0000" 
                  strokeWidth="1"
                  className="attack-icon"
                  transform="scale(0.8) rotate(270) translate(0, -20)"
                />
              </>
            )}
          </g>
        );
      })}
      
      {/* Draw arrow from attacker to target if target is selected */}
      {attackTarget && (() => {
        const targetUnit = state.units.find(u => u.id === attackTarget);
        const attackerUnit = state.units.find(u => u.id === state.selectedUnit);
        
        if (!targetUnit || !attackerUnit) return null;
        
        const { x: targetX, y: targetY } = hexToPixel(targetUnit.q, targetUnit.r, hexSize);
        const { x: attackerX, y: attackerY } = hexToPixel(attackerUnit.q, attackerUnit.r, hexSize);
        
        // Calculate direction for arrow
        const dx = targetX - attackerX;
        const dy = targetY - attackerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Normalize direction vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate start and end points, slightly offset from centers
        const startX = attackerX + nx * hexSize * 0.5;
        const startY = attackerY + ny * hexSize * 0.5;
        const endX = targetX - nx * hexSize * 0.5;
        const endY = targetY - ny * hexSize * 0.5;
        
        // Calculate control point for curved arrow (perpendicular to direction)
        const controlX = (startX + endX) / 2 + ny * hexSize * 0.5;
        const controlY = (startY + endY) / 2 - nx * hexSize * 0.5;
        
        const arrowId = `attack-arrow-${attackerUnit.id}`;
        
        return (
          <g key="attack-path" className="attack-confirmation">
            {/* Arrow definition */}
            <defs>
              <marker
                id={arrowId}
                viewBox="0 0 10 10"
                refX="1"
                refY="5"
                markerWidth="8"
                markerHeight="8"
                orient="auto"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#FF0000" />
              </marker>
              
              <radialGradient
                id="attackGradient"
                cx="50%"
                cy="50%"
                r="50%"
                fx="50%"
                fy="50%"
              >
                <stop offset="0%" stopColor="#FF9900" stopOpacity="0.1" />
                <stop offset="70%" stopColor="#FF4500" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B0000" stopOpacity="0.5" />
              </radialGradient>
            </defs>
            
            {/* Attack curved arrow */}
            <path
              d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
              stroke="#FF0000"
              strokeWidth="3"
              fill="none"
              markerEnd={`url(#${arrowId})`}
              className="attack-arrow"
            />
            
            {/* Confirmation buttons */}
            <g transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2})`}>
              <rect
                x="-40"
                y="-12"
                width="80"
                height="24"
                rx="5"
                ry="5"
                fill="rgba(0, 0, 0, 0.7)"
                stroke="#CC9933"
                strokeWidth="1"
              />
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#FBFBD7"
                fontSize="12"
                fontWeight="bold"
                pointerEvents="none"
              >
                Confirm Attack
              </text>
              <rect
                x="-40"
                y="-12"
                width="80"
                height="24"
                rx="5"
                ry="5"
                fill="transparent"
                onClick={executeAttack}
                className="attack-confirm-button"
              />
              
              {/* Cancel button */}
              <g transform="translate(0, 25)">
                <rect
                  x="-30"
                  y="-10"
                  width="60"
                  height="20"
                  rx="5"
                  ry="5"
                  fill="rgba(0, 0, 0, 0.7)"
                  stroke="#660000"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FBFBD7"
                  fontSize="10"
                  fontWeight="bold"
                  pointerEvents="none"
                >
                  Cancel
                </text>
                <rect
                  x="-30"
                  y="-10"
                  width="60"
                  height="20"
                  rx="5"
                  ry="5"
                  fill="transparent"
                  onClick={cancelAttack}
                  className="attack-cancel-button"
                />
              </g>
            </g>
          </g>
        );
      })()}
    </>
  );
};

  // Function to render a unit on the board
  const renderUnit = (unit: any) => {
    const { x, y } = hexToPixel(unit.q, unit.r, hexSize);
    const isSelected = unit.id === state.selectedUnit;
    const canMove = state.currentPhase === GamePhase.Movement && 
                  unit.owner === state.currentPlayer && 
                  !unit.hasMoved;
    const canAttack = state.currentPhase === GamePhase.Combat &&
                    unit.owner === state.currentPlayer;
                    
    return (
      <g 
        key={`unit-${unit.id}`} 
        transform={`translate(${x}, ${y})`}
        className={`unit ${isSelected ? 'selected' : ''} ${canMove ? 'can-move' : ''} ${canAttack ? 'can-attack' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if ((state.currentPhase === GamePhase.Movement || state.currentPhase === GamePhase.Combat) && 
              unit.owner === state.currentPlayer) {
            dispatch({ type: 'SELECT_UNIT', payload: unit.id });
          }
        }}
      >
        <circle 
          cx="0" 
          cy="0" 
          r={hexSize * 0.4} 
          fill={unit.owner === 'A' ? '#990000' : '#FFCC00'} 
          stroke={isSelected ? '#FFFFFF' : '#000000'}
          strokeWidth={isSelected ? 2 : 1}
        />
        <text 
          x="0" 
          y="0" 
          textAnchor="middle" 
          dominantBaseline="middle" 
          fill="#FFFFFF" 
          fontSize={hexSize * 0.28}
          fontWeight="bold"
        >
          {unit.ap}/{unit.hp}
        </text>
      </g>
    );
  };
  
  // Function to render movement indicators for selected unit
  const renderMoveIndicators = () => {
    if (!state.selectedUnit || state.currentPhase !== GamePhase.Movement) return null;
    
    const unit = state.units.find(u => u.id === state.selectedUnit);
    if (!unit || unit.owner !== state.currentPlayer || unit.hasMoved) return null;
    
    const adjacentHexes = getAdjacentHexes(unit.q, unit.r);
    const validMoveHexes = adjacentHexes.filter(adjHex => {
      // Check if hex exists on board and is not occupied
      const hexExists = state.board.some(h => h.q === adjHex.q && h.r === adjHex.r);
      const isOccupied = state.units.some(u => u.q === adjHex.q && u.r === adjHex.r);
      return hexExists && !isOccupied;
    });
    
    return validMoveHexes.map((hex, index) => {
      const { x, y } = hexToPixel(hex.q, hex.r, hexSize);
      return (
        <g 
          key={`move-${index}`}
          transform={`translate(${x}, ${y})`}
          className="move-indicator"
          onClick={(e) => {
            e.stopPropagation();
            dispatch({
              type: 'MOVE_UNIT',
              payload: { unitId: state.selectedUnit!, q: hex.q, r: hex.r }
            });
          }}
        >
          <circle 
            cx="0" 
            cy="0" 
            r={hexSize * 0.2} 
            fill="rgba(255, 255, 255, 0.5)" 
            stroke="#FFFFFF"
            strokeWidth="1"
          />
        </g>
      );
    });
  };
  
  const metrics = getBoardMetrics();
  
  // Calculate padding with extra space for the rotated hexes
  const paddingX = hexSize * 3;
  const paddingY = hexSize * 3;
  
  // Calculate SVG viewBox dimensions for pointy-topped hexes
  const minX = Math.sqrt(3) * hexSize * metrics.minQ - paddingX;
  const minY = 1.5 * hexSize * metrics.minR - paddingY;
  const width = Math.sqrt(3) * hexSize * (metrics.width + 2) + 2 * paddingX;
  const height = 1.5 * hexSize * (metrics.height + 2) + 2 * paddingY;
  
  // Render method with added units
  return (
    <div className="board-container" ref={boardContainerRef}>
      <div className="board-wrapper">
        <svg 
          className="board" 
          viewBox={`${minX} ${minY} ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Render the hexes first */}
          {state.board.map((hex) => {
            const { x, y } = hexToPixel(hex.q, hex.r, hexSize);
            return (
              <g 
                key={hex.id} 
                transform={`translate(${x}, ${y})`}
                className="hex-group"
                onClick={() => handleHexClick(hex)}
              >
                <polygon
                  points={hexPoints(hexSize)}
                  fill={getHexColor(hex)}
                  stroke="#2E2B2B"
                  strokeWidth="1"
                  className="hex"
                />
                {hexSize > 15 && (
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#FBFBD7"
                    fontSize={hexSize * 0.35}
                    className="hex-label"
                  >
                    {hex.q},{hex.r}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Render movement indicators */}
          {state.currentPhase === GamePhase.Movement && renderMoveIndicators()}
          
          {/* Render attack indicators */}
          {state.currentPhase === GamePhase.Combat && renderAttackIndicators()}
          
          {/* Render all units on top of the hexes */}
          {state.units.map(unit => renderUnit(unit))}
        </svg>
      </div>
      
      {/* Phase instructions */}
      <div className="phase-instructions">
        {state.currentPhase === GamePhase.Dev1 || state.currentPhase === GamePhase.Dev2 ? (
          <p>Click on a hex in your territory to deploy a unit (costs 5 gold)</p>
        ) : state.currentPhase === GamePhase.Movement ? (
          <p>Select your unit, then click on an adjacent hex to move</p>
        ) : state.currentPhase === GamePhase.Combat ? (
          <p>Select your unit, then click on an adjacent enemy unit to attack</p>
        ) : null}
      </div>
    </div>
  );
};

export default Board;