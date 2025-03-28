import { GameProvider } from './game-logic/GameContext'
import GameStatus from './components/GameStatus'
import Board from './components/Board'
import CapitalSetup from './components/CapitalSetup'
import './styles/Global.css'

function App() {
  return (
    <GameProvider>
      <div className="App">
        <header className="App-header">
          <h1>Kingdoms & Castles</h1>
        </header>
        
        <div className="game-layout">
          <div className="left-panel">
            <GameStatus />
          </div>
          
          <div className="right-panel">
            <div className="action-bar">
              <CapitalSetup />
            </div>
            <Board />
          </div>
        </div>
      </div>
    </GameProvider>
  )
}

export default App