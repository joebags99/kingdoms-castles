// Define the Hex interface for our hexagonal grid
export interface Hex {
  id: string;      // Unique identifier
  q: number;       // Axial coordinate q
  r: number;       // Axial coordinate r
  zone: "A" | "Neutral" | "B";  // Territory ownership
  capitalOwner?: "A" | "B";     // Indicates if this hex is part of a capital
  terrain?: string; // Optional terrain type
}
  
  /**
   * Generates a hexagonal board with the specified dimensions
   * @param width Number of columns in the grid
   * @param height Number of rows in the grid
   * @returns Array of Hex objects representing the board
   */
  export function generateBoard(width: number, height: number): Hex[] {
    const hexes: Hex[] = [];
    const neutralZoneWidth = Math.floor(width / 5); // 20% of board width for neutral zone
    
    // For each row and column, create a hex
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        // Determine the zone based on horizontal position
        let zone: "A" | "Neutral" | "B";
        if (q < (width - neutralZoneWidth) / 2) {
          zone = "A";  // Left side of board
        } else if (q >= (width + neutralZoneWidth) / 2) {
          zone = "B";  // Right side of board
        } else {
          zone = "Neutral"; // Center neutral territory
        }
        
        hexes.push({
          id: `${q},${r}`,
          q, 
          r,
          zone
        });
      }
    }
    
    return hexes;
  }
  
 /**
 * Gets pixel coordinates for hexagon with specified axial coordinates
 * @param q Axial coordinate q
 * @param r Axial coordinate r
 * @param size Size of hexagon (distance from center to corner)
 * @returns {x, y} coordinates for positioning the hex
 */
export function hexToPixel(q: number, r: number, size: number): {x: number, y: number} {
  // Using flat-topped hexagon orientation
  const x = size * (1.5 * q);
  const y = size * (Math.sqrt(3) * (r + q/2));
  
  return {x, y};
}

  /**
 * Gets all adjacent hexes in axial coordinates
 * @param q Axial coordinate q
 * @param r Axial coordinate r
 * @returns Array of adjacent hex coordinates
 */
export function getAdjacentHexes(q: number, r: number): {q: number, r: number}[] {
  // In axial coordinates, these are the 6 directions around a hex
  const directions = [
    {q: 1, r: 0},   // east
    {q: 1, r: -1},  // northeast
    {q: 0, r: -1},  // northwest
    {q: -1, r: 0},  // west
    {q: -1, r: 1},  // southwest
    {q: 0, r: 1}    // southeast
  ];
  
  return directions.map(dir => ({
    q: q + dir.q,
    r: r + dir.r
  }));
}

/**
 * Finds a hex by its coordinates
 * @param board Array of hexes
 * @param q Q coordinate
 * @param r R coordinate
 * @returns The hex at coordinates or undefined if not found
 */
export function findHexByCoordinates(board: Hex[], q: number, r: number): Hex | undefined {
  return board.find(hex => hex.q === q && hex.r === r);
}

/**
 * Places a capital on the board for the specified player
 * @param board Current board state
 * @param owner Owner of the capital ("A" or "B")
 * @param capitalQ Q coordinate for capital placement
 * @param capitalR R coordinate for capital placement
 * @returns Updated board with capital placement
 */
export function placeCapital(board: Hex[], owner: "A" | "B", capitalQ: number, capitalR: number): Hex[] {
  // Create a new board to avoid mutating the original
  const newBoard = [...board];
  
  // Find the center hex
  const centerHex = findHexByCoordinates(newBoard, capitalQ, capitalR);
  if (!centerHex) {
    console.error(`Cannot place capital: No hex found at coordinates (${capitalQ}, ${capitalR})`);
    return board;
  }
  
  // Check if the center hex is in the player's territory
  if (centerHex.zone !== owner) {
    console.warn(`Placing capital at (${capitalQ}, ${capitalR}) is outside player ${owner}'s territory`);
    // We'll still place it, but warn about it
  }
  
  // Mark the center hex as part of the capital
  centerHex.capitalOwner = owner;
  
  // Get adjacent hexes and mark them as part of the capital
  const adjacentPositions = getAdjacentHexes(capitalQ, capitalR);
  
  for (const pos of adjacentPositions) {
    const adjacentHex = findHexByCoordinates(newBoard, pos.q, pos.r);
    if (adjacentHex) {
      adjacentHex.capitalOwner = owner;
    }
  }
  
  return newBoard;
}