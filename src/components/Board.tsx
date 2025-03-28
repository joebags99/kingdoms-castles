import React, { useEffect, useState, useRef } from 'react';
import { generateBoard, hexToPixel, Hex } from '../game-logic/board';
import { useGame } from '../game-logic/GameContext';
import '../styles/Board.css';

const Board: React.FC = () => {
  const { state, dispatch } = useGame();
  const [hexSize, setHexSize] = useState(22); // Reduced default size
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
  
  // Generate the board when component mounts
  useEffect(() => {
    const boardWidth = 15;
    const boardHeight = 7;
    const newBoard = generateBoard(boardWidth, boardHeight);
    dispatch({ type: 'SET_BOARD', payload: newBoard });
  }, [dispatch]);
  
  // Adjust hex size when window or container resizes
  useEffect(() => {
    const handleResize = () => {
      if (!boardContainerRef.current) return;
      
      const metrics = getBoardMetrics();
      const containerWidth = boardContainerRef.current.clientWidth - 40;
      const containerHeight = boardContainerRef.current.clientHeight - 40;
      
      // Calculate the horizontal and vertical span of the board in pixels
      const horizontalSpan = (metrics.maxQ - metrics.minQ + 3) * 1.5;
      const verticalSpan = (metrics.maxR - metrics.minR + 3) * Math.sqrt(3);
      
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
  }, [state.board]);

  // Determine color based on zone and capital status
  const getHexColor = (hex: Hex) => {
    // If this is part of a capital, use a brighter/highlighted color
    if (hex.capitalOwner === 'A') {
      return '#9A0000'; // Brighter Royal Red for Player A's capital
    } else if (hex.capitalOwner === 'B') {
      return '#FFB733'; // Brighter Belaklara Gold for Player B's capital
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

  // Generate points for a hexagon shape
  const hexPoints = (size: number): string => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = 2 * Math.PI / 6 * i;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  };

  const metrics = getBoardMetrics();
  
  // Calculate padding to ensure all hexes are visible
  const paddingX = hexSize * 2; 
  const paddingY = hexSize * 2;
  
  // Calculate SVG viewBox dimensions with generous padding
  const minX = metrics.minQ * hexSize * 1.5 - paddingX;
  const minY = metrics.minR * hexSize * Math.sqrt(3) - paddingY;
  const width = (metrics.maxQ - metrics.minQ + 2) * hexSize * 1.5 + 2 * paddingX;
  const height = (metrics.maxR - metrics.minR + 2) * hexSize * Math.sqrt(3) + 2 * paddingY;

  return (
    <div className="board-container" ref={boardContainerRef}>
      <div className="board-wrapper">
        <svg 
          className="board" 
          viewBox={`${minX} ${minY} ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {state.board.map((hex) => {
            const { x, y } = hexToPixel(hex.q, hex.r, hexSize);
            return (
              <g 
                key={hex.id} 
                transform={`translate(${x}, ${y})`}
                className="hex-group"
              >
                <polygon
                  points={hexPoints(hexSize)}
                  fill={getHexColor(hex)}
                  stroke="#2E2B2B" // Battle Ash Charcoal for borders
                  strokeWidth="1"
                  className="hex"
                />
                {hexSize > 15 && (
                  <text
                    x="0"
                    y="2"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#FBFBD7" // Divine Light White for text
                    fontSize={hexSize * 0.35}
                    className="hex-label"
                  >
                    {hex.q},{hex.r}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export default Board;