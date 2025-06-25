import './App.css';
import { Game } from './components/Game';

function App() {
  return (
    <div className="App">
      {/* Header épuré et  */}
      <header className="app-header-">
        <div className="header-container">
          <div className="header-content">
            <h1 className="app-title-">Queens Game</h1>
            <p className="app-subtitle-">Puzzle de placement de reines</p>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="app-main-">
        <Game />
      </main>

      {/* Footer discret */}
      <footer className="app-footer-">
        <div className="footer-container">
          <p className="footer-text">
            Développé avec React • TypeScript • CSS Grid
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;