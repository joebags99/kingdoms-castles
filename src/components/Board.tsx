// src/components/Board.tsx - Replace the entire file with this updated version

import React, { useEffect, useState, useRef } from 'react';
import { generateBoard, hexToPixel, Hex, toggleResourceGeneration, getAdjacentHexes } from '../game-logic/board';
import { useGame } from '../game-logic/GameContext';
import { GamePhase } from '../game-logic/constants';
import '../styles/Board.css';

interface Attack {
  attackerId: string;
  defenderId: string;
}

const Board: React.FC = () => {
  const { state, dispatch } = useGame();
  const [hexSize, setHexSize] = useState(22);
  const [selectedHex, setSelectedHex] = useState<{q: number, r: number} | null>(null);
  const [pendingAttack, setPendingAttack] = useState<string | null>(null);
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [attackableUnits, setAttackableUnits] = useState<string[]>([]);
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
        width: 15,
        height: 7
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
    if (state.board.length === 0) {
      const boardWidth = 15;
      const boardHeight = 8;
      const newBoard = generateBoard(boardWidth, boardHeight);
      dispatch({ type: 'SET_BOARD', payload: newBoard });
    }
  }, [dispatch, state.board.length]);
  
  // Reset attacks when phase changes
  useEffect(() => {
    if (state.currentPhase !== GamePhase.Combat) {
      setAttacks([]);
      setPendingAttack(null);
      setAttackableUnits([]);
    }
  }, [state.currentPhase]);
  
  // Update attackable units when unit is selected in combat phase
  useEffect(() => {
    if (state.currentPhase === GamePhase.Combat && state.selectedUnit) {
      const unit = state.units.find(u => u.id === state.selectedUnit);
      if (unit && unit.owner === state.currentPlayer) {
        const adjacentHexes = getAdjacentHexes(unit.q, unit.r);
        const attackable = state.units
          .filter(u => 
            u.owner !== state.currentPlayer && 
            adjacentHexes.some(hex => hex.q === u.q && hex.r === u.r) &&
            !attacks.some(attack => attack.attackerId === state.selectedUnit && attack.defenderId === u.id)
          )
          .map(u => u.id);
        
        setAttackableUnits(attackable);
      } else {
        setAttackableUnits([]);
      }
    } else {
      setAttackableUnits([]);
    }
  }, [state.currentPhase, state.selectedUnit, state.units, attacks, state.currentPlayer]);
  
  // Adjust hex size when window or container resizes
  useEffect(() => {
    const handleResize = () => {
      if (!boardContainerRef.current) return;
      
      const metrics = getBoardMetrics();
      const containerWidth = boardContainerRef.current.clientWidth - 40;
      const containerHeight = boardContainerRef.current.clientHeight - 40;
      
      const horizontalSpan = (metrics.width + 1) * Math.sqrt(3) * hexSize;
      const verticalSpan = (metrics.height + 1) * 1.5 * hexSize;
      
      const maxSizeForWidth = containerWidth / horizontalSpan;
      const maxSizeForHeight = containerHeight / verticalSpan;
      
      const newSize = Math.min(maxSizeForWidth, maxSizeForHeight, 30);
      setHexSize(Math.max(newSize, 12));
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.board, hexSize]);

  // Determine color based on zone and capital status
  const getHexColor = (hex: Hex) => {
    if (hex.capitalOwner === 'A') {
      return hex.generateResource ? '#CC0000' : '#9A0000';
    } else if (hex.capitalOwner === 'B') {
      return hex.generateResource ? '#FFD700' : '#FFB733';
    }
    
    switch (hex.zone) {
      case 'A':
        return '#660000';
      case 'B': 
        return '#CC9933';
      case 'Neutral':
        return '#193B1C';
      default:
        return '#FBFBD7';
    }
  };

  // Generate points for a hexagon shape (pointy-topped)
  const hexPoints = (size: number): string => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = 2 * Math.PI / 6 * i + Math.PI/6;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  // Handle hex click based on current phase
  // src/components/Board.tsx - Complete revised handleHexClick function
const handleHexClick = (hex: Hex) => {
  const { q, r } = hex;
  
  // If we're in a development phase and have a unit card selected, try to place it
  if ((state.currentPhase === GamePhase.Dev1 || state.currentPhase === GamePhase.Dev2) && 
      state.selectedCard) {
    
    const selectedCard = state.hands[state.currentPlayer].find(card => card.id === state.selectedCard);
    
    if (selectedCard && selectedCard.type === 'unit') {
      // Check if the hex is in player territory and not occupied
      const isPlayerTerritory = hex.zone === state.currentPlayer;
      const isOccupied = state.units.some(unit => unit.q === q && unit.r === r);
      
      if (isPlayerTerritory && !isOccupied) {
        // Dispatch an action to play the card at this location
        dispatch({
          type: 'PLAY_CARD',
          payload: {
            cardId: state.selectedCard,
            targetHex: { q, r }
          }
        });
        return;
      } else {
        console.log('Cannot deploy unit here');
        return;
      }
    }
  }
  
  // Setup phase - toggle resource generation for capital hexes
  if (state.currentPhase === GamePhase.Setup && hex.capitalOwner) {
    const updatedBoard = toggleResourceGeneration(state.board, q, r);
    dispatch({ type: 'SET_BOARD', payload: updatedBoard });
    return;
  }
  
  // Development phases - deploy units
  if ((state.currentPhase === GamePhase.Dev1 || state.currentPhase === GamePhase.Dev2) && 
      hex.zone === state.currentPlayer) {
    const isOccupied = state.units.some(unit => unit.q === q && unit.r === r);
    if (!isOccupied) {
      dispatch({ 
        type: 'DEPLOY_UNIT', 
        payload: { q, r, ap: 3, hp: 5 }
      });
    }
    return;
  }
  
  // Movement phase - move selected unit
  if (state.currentPhase === GamePhase.Movement && state.selectedUnit) {
    const selectedUnitObj = state.units.find(unit => unit.id === state.selectedUnit);
    if (selectedUnitObj && selectedUnitObj.owner === state.currentPlayer) {
      dispatch({
        type: 'MOVE_UNIT',
        payload: { unitId: state.selectedUnit, q, r }
      });
    }
    return;
  }
  
  // Combat phase - select unit for attack
  if (state.currentPhase === GamePhase.Combat) {
    const unitInHex = state.units.find(unit => unit.q === q && unit.r === r);
    
    // If clicking on one of our units, select it
    if (unitInHex && unitInHex.owner === state.currentPlayer) {
      setPendingAttack(null);
      dispatch({ type: 'SELECT_UNIT', payload: unitInHex.id });
      return;
    }
    
    // If a unit is selected and clicking on an enemy unit
    if (state.selectedUnit && unitInHex && unitInHex.owner !== state.currentPlayer) {
      // Check if this is a valid attack target
      if (attackableUnits.includes(unitInHex.id)) {
        setPendingAttack(unitInHex.id);
      }
      return;
    }
    
    // Clear pending attack if clicking empty hex
    setPendingAttack(null);
  }
  
  // Select hex/unit in other phases
  setSelectedHex({ q, r });
  const unitInHex = state.units.find(unit => unit.q === q && unit.r === r);
  if (unitInHex && (unitInHex.owner === state.currentPlayer || state.currentPhase === GamePhase.Combat)) {
    dispatch({ type: 'SELECT_UNIT', payload: unitInHex.id });
  }
};

  // Confirm an attack
  const confirmAttack = () => {
    if (state.selectedUnit && pendingAttack) {
      // Add to attacks array rather than executing immediately
      setAttacks([...attacks, { 
        attackerId: state.selectedUnit, 
        defenderId: pendingAttack 
      }]);
      
      // Clear pending attack and selected unit
      setPendingAttack(null);
      dispatch({ type: 'SELECT_UNIT', payload: null });
    }
  };

  // Cancel an attack
  const cancelAttack = () => {
    setPendingAttack(null);
  };
  
  // Remove an attack
  const removeAttack = (attackerId: string, defenderId: string) => {
    setAttacks(attacks.filter(attack => 
      !(attack.attackerId === attackerId && attack.defenderId === defenderId)
    ));
  };
  
  // Execute all planned attacks
  const executeAttacks = () => {
    console.log(`Executing ${attacks.length} planned attacks`);
    
    // Actually execute the attacks when ending the combat phase
    attacks.forEach(attack => {
      console.log(`Executing attack from ${attack.attackerId} to ${attack.defenderId}`);
      dispatch({
        type: 'ATTACK_UNIT',
        payload: { attackerId: attack.attackerId, defenderId: attack.defenderId }
      });
    });
    
    // Clear the attacks
    setAttacks([]);
  };
  
  // When ending the combat phase, execute all attacks
  useEffect(() => {
    if (state.currentPhase !== GamePhase.Combat && attacks.length > 0) {
      console.log("Phase changed from Combat - executing attacks");
      executeAttacks();
    }
  }, [state.currentPhase]);

  // Function to render a unit on the board
  // src/components/Board.tsx - Update the renderUnit function
const renderUnit = (unit: any) => {
  const { x, y } = hexToPixel(unit.q, unit.r, hexSize);
  const isSelected = unit.id === state.selectedUnit;
  const canMove = state.currentPhase === GamePhase.Movement && 
                unit.owner === state.currentPlayer && 
                !unit.hasMoved;
  const canAttack = state.currentPhase === GamePhase.Combat &&
                  unit.owner === state.currentPlayer &&
                  !attacks.some(attack => attack.attackerId === unit.id);
  const isAttackable = attackableUnits.includes(unit.id);
  const isPendingTarget = unit.id === pendingAttack;
  const isAttackTarget = attacks.some(attack => attack.defenderId === unit.id);
  
  // Determine colors based on player and state
  const baseColor = unit.owner === 'A' ? '#990000' : '#FFCC00';
  const strokeColor = isSelected ? '#FFFFFF' : 
                     isPendingTarget ? '#FF0000' : 
                     isAttackable ? '#FFFFFF' : '#000000';
  const strokeWidth = isSelected || isPendingTarget ? 2 : 1;
  
  return (
    <g 
      key={`unit-${unit.id}`} 
      transform={`translate(${x}, ${y})`}
      className={`
        unit 
        ${isSelected ? 'selected' : ''} 
        ${canMove ? 'can-move' : ''} 
        ${canAttack ? 'can-attack' : ''} 
        ${isAttackable ? 'attackable' : ''}
        ${isPendingTarget ? 'pending-target' : ''}
        ${isAttackTarget ? 'attack-target' : ''}
      `}
      onClick={(e) => {
        e.stopPropagation();
        if (state.currentPhase === GamePhase.Combat) {
          if (unit.owner === state.currentPlayer) {
            // Select our unit
            dispatch({ type: 'SELECT_UNIT', payload: unit.id });
            setPendingAttack(null);
          } else if (state.selectedUnit && attackableUnits.includes(unit.id)) {
            // Select enemy as attack target
            setPendingAttack(unit.id);
          }
        } else if (state.currentPhase === GamePhase.Movement && 
                 unit.owner === state.currentPlayer) {
          dispatch({ type: 'SELECT_UNIT', payload: unit.id });
        }
      }}
    >
      {/* Drop shadow for depth */}
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="black" floodOpacity="0.5" />
      </filter>
      
      {/* Main unit circle */}
      <circle 
        cx="0" 
        cy="0" 
        r={hexSize * 0.4} 
        fill={baseColor} 
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        filter="url(#shadow)"
      />
      
      {/* Unit stats display */}
      <text 
        x="0" 
        y="0" 
        textAnchor="middle" 
        dominantBaseline="middle" 
        fill="#FFFFFF" 
        fontSize={hexSize * 0.28}
        fontWeight="bold"
        fontFamily="'Spectral', serif"
        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.7)" }}
      >
        {unit.ap}/{unit.hp}
      </text>
      
      {/* Status indicators */}
      {canMove && (
        <circle 
          cx={hexSize * 0.4 * 0.707} 
          cy={hexSize * 0.4 * 0.707} 
          r={hexSize * 0.1} 
          fill="#00FF00" 
          opacity="0.7"
        />
      )}
      
      {canAttack && (
        <circle 
          cx={-hexSize * 0.4 * 0.707} 
          cy={hexSize * 0.4 * 0.707} 
          r={hexSize * 0.1} 
          fill="#FF0000" 
          opacity="0.7"
        />
      )}
      
      {unit.hasMoved && (
        <circle 
          cx={0} 
          cy={-hexSize * 0.4 * 0.8} 
          r={hexSize * 0.1} 
          fill="#888888" 
          opacity="0.7"
        />
      )}
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
  
  // Render attack confirmation UI
  // src/components/Board.tsx - Update the renderAttackConfirmation function
const renderAttackConfirmation = () => {
  if (!pendingAttack || !state.selectedUnit) return null;
  
  const attacker = state.units.find(u => u.id === state.selectedUnit);
  const defender = state.units.find(u => u.id === pendingAttack);
  
  if (!attacker || !defender) return null;
  
  const { x: ax, y: ay } = hexToPixel(attacker.q, attacker.r, hexSize);
  const { x: dx, y: dy } = hexToPixel(defender.q, defender.r, hexSize);
  
  // Calculate midpoint for confirmation buttons
  const mx = (ax + dx) / 2;
  const my = (ay + dy) / 2;
  
  return (
    <g className="attack-confirmation">
      {/* Subtle attack line */}
      <line
        x1={ax}
        y1={ay}
        x2={dx}
        y2={dy}
        stroke="#FF3333"
        strokeWidth="2"
        strokeDasharray="5,3"
        markerEnd="url(#arrowhead)"
        opacity="0.7"
      />
      
      {/* Improved confirmation UI */}
      <g transform={`translate(${mx}, ${my})`}>
        <rect 
          x="-70" 
          y="-20" 
          width="140" 
          height="40" 
          rx="20" 
          fill="rgba(0,0,0,0.8)" 
          stroke="#FBFBD7"
        />
        
        {/* Confirm button */}
        <g transform="translate(-35, 0)" onClick={confirmAttack} style={{ cursor: 'pointer' }}>
          <rect x="-25" y="-12" width="50" height="24" rx="12" fill="#336633" />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontFamily="'Spectral', serif"
          >
            Attack
          </text>
        </g>
        
        {/* Cancel button */}
        <g transform="translate(35, 0)" onClick={cancelAttack} style={{ cursor: 'pointer' }}>
          <rect x="-25" y="-12" width="50" height="24" rx="12" fill="#663333" />
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FFFFFF"
            fontSize="12"
            fontFamily="'Spectral', serif"
          >
            Cancel
          </text>
        </g>
      </g>
    </g>
  );
};
  
const renderPhaseOverlay = () => {
  // Only show in certain phases
  if (![GamePhase.Movement, GamePhase.Combat, GamePhase.Dev1, GamePhase.Dev2].includes(state.currentPhase)) {
    return null;
  }
  
  let color = "rgba(0,0,0,0)";
  let icon = "";
  
  switch (state.currentPhase) {
    case GamePhase.Movement:
      color = "rgba(65, 105, 225, 0.1)"; // Royal blue with low opacity
      icon = "↔️";
      break;
    case GamePhase.Combat:
      color = "rgba(220, 20, 60, 0.1)"; // Crimson with low opacity
      icon = "⚔️";
      break;
    case GamePhase.Dev1:
    case GamePhase.Dev2:
      color = "rgba(50, 205, 50, 0.1)"; // Lime green with low opacity
      icon = "🏗️";
      break;
  }
  
  return (
    <rect
      x={minX}
      y={minY}
      width={width}
      height={height}
      fill={color}
      pointerEvents="none"
    />
  );
};

  // Render planned attacks
  const renderPlannedAttacks = () => {
    if (attacks.length === 0) return null;
    
    return attacks.map((attack, index) => {
      const attacker = state.units.find(u => u.id === attack.attackerId);
      const defender = state.units.find(u => u.id === attack.defenderId);
      
      if (!attacker || !defender) return null;
      
      const { x: ax, y: ay } = hexToPixel(attacker.q, attacker.r, hexSize);
      const { x: dx, y: dy } = hexToPixel(defender.q, defender.r, hexSize);
      
      // Calculate perpendicular offset to curve the line
      const midX = (ax + dx) / 2;
      const midY = (ay + dy) / 2;
      
      return (
        <g key={`attack-${index}`} className="planned-attack">
          {/* Curved attack path instead of straight line */}
          <path
            d={`M ${ax} ${ay} Q ${midX + 10} ${midY - 10}, ${dx} ${dy}`}
            fill="none"
            stroke="#FF3333"
            strokeWidth="2"
            strokeDasharray="5,3"
            markerEnd="url(#arrowhead)"
            opacity="0.8"
          />
          
          {/* Clean cancel button */}
          <g 
            transform={`translate(${midX}, ${midY})`}
            onClick={() => removeAttack(attack.attackerId, attack.defenderId)}
            style={{ cursor: 'pointer' }}
          >
            <circle r="10" fill="rgba(0,0,0,0.8)" stroke="#FBFBD7" strokeWidth="1" />
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#FFFFFF"
              fontSize="14"
              fontWeight="bold"
            >
              ×
            </text>
          </g>
        </g>
      );
    });
  };

  const pendingAttackExecution = useRef(false);
  
  // Update the useEffect that watches for phase changes
  useEffect(() => {
    // If we're entering a new phase and there are pending attacks to execute
    if (pendingAttackExecution.current) {
      // Execute all planned attacks BEFORE cleaning up
      attacks.forEach(attack => {
        const attacker = state.units.find(unit => unit.id === attack.attackerId);
        const defender = state.units.find(unit => unit.id === attack.defenderId);
        
        if (attacker && defender) {
          console.log(`Executing attack: ${attacker.owner}'s unit attacks ${defender.owner}'s unit`);
          
          // Calculate damage (without dispatching yet)
          const attackerNewHp = attacker.hp - defender.ap;
          const defenderNewHp = defender.hp - attacker.ap;
          
          console.log(`Combat result: Attacker HP ${attacker.hp} → ${attackerNewHp}, Defender HP ${defender.hp} → ${defenderNewHp}`);
          
          // Now dispatch the attack
          dispatch({
            type: 'ATTACK_UNIT',
            payload: { attackerId: attack.attackerId, defenderId: attack.defenderId }
          });
        }
      });
      
      // Reset
      pendingAttackExecution.current = false;
      setAttacks([]);
    }
    
    // If leaving combat phase, mark attacks for execution on next render
    if (state.currentPhase !== GamePhase.Combat && attacks.length > 0) {
      pendingAttackExecution.current = true;
    }
  }, [state.currentPhase, dispatch]);
  
  const metrics = getBoardMetrics();
  
  const paddingX = hexSize * 3;
  const paddingY = hexSize * 3;
  
  const minX = Math.sqrt(3) * hexSize * metrics.minQ - paddingX;
  const minY = 1.5 * hexSize * metrics.minR - paddingY;
  const width = Math.sqrt(3) * hexSize * (metrics.width + 2) + 2 * paddingX;
  const height = 1.5 * hexSize * (metrics.height + 2) + 2 * paddingY;
  
  // Check if there are units that can attack in the current phase
  const hasAttackableUnits = state.currentPhase === GamePhase.Combat && 
                            state.units.some(unit => 
                              unit.owner === state.currentPlayer &&
                              !attacks.some(attack => attack.attackerId === unit.id)
                            );
  
  return (
    <div className="board-container" ref={boardContainerRef}>
      <div className="board-wrapper">
        <svg 
          className="board" 
          viewBox={`${minX} ${minY} ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Define arrowhead marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#FF0000" />
            </marker>
          </defs>

            {/* Phase overlay*/}
            {renderPhaseOverlay()}
          
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
          
          {/* Render planned attacks */}
          {state.currentPhase === GamePhase.Combat && renderPlannedAttacks()}
          
          {/* Render all units on top of the hexes */}
          {state.units.map(unit => renderUnit(unit))}
          
          {/* Render attack confirmation UI */}
          {state.currentPhase === GamePhase.Combat && renderAttackConfirmation()}
        </svg>
      </div>
      
      {/* Phase instructions */}
      <div className="phase-instructions">
        {state.currentPhase === GamePhase.Dev1 || state.currentPhase === GamePhase.Dev2 ? (
          <p>Click on a hex in your territory to deploy a unit (costs 5 gold)</p>
        ) : state.currentPhase === GamePhase.Movement ? (
          <p>Select your unit, then click on an adjacent hex to move</p>
        ) : state.currentPhase === GamePhase.Combat ? (
          <>
            <p>
              {attacks.length > 0 
                ? `${attacks.length} attack(s) planned. Select more units to plan additional attacks.` 
                : hasAttackableUnits
                  ? "Select your unit, then click on an adjacent enemy unit to attack"
                  : "No more units available to attack. End phase to resolve combat."}
            </p>
            {attacks.length > 0 && (
              <p><small>Attacks will be resolved when you end the combat phase</small></p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Board;