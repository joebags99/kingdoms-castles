// src/App.tsx
import { GameProvider } from './game-logic/GameContext'
import GameStatus from './components/GameStatus'
import Board from './components/Board'
import CapitalSetup from './components/CapitalSetup'
import GameStart from './components/GameStart'
import RestartButton from './components/RestartButton'
import HandPanel from './components/HandPanel'
import './styles/Global.css'

function App() {
  return (
    <GameProvider>
      <div className="App">
        <header className="App-header">
          <h1>Kingdoms & Castles</h1>
        </header>
        
        <GameStart />
        
        <div className="game-layout">
          <div className="left-panel">
            <GameStatus />
          </div>
          
          <div className="right-panel">
            <div className="action-bar">
              <RestartButton />
              <CapitalSetup />
            </div>
            <Board />
            {/* Add HandPanel directly under the Board inside right-panel */}
            <HandPanel />
          </div>
        </div>
      </div>
    </GameProvider>
  )
}

export default App