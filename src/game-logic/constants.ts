// Game phase constants
export enum GamePhase {
  Setup = "Setup",      // New phase for initial setup
  Resource = "Resource",
  Draw = "Draw", 
  Dev1 = "Dev1",
  Movement = "Movement",
  Combat = "Combat",
  Dev2 = "Dev2",
  End = "End"
}
  
// Player constants
export type Player = 'A' | 'B';