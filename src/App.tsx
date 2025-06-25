import React from 'react';
import { Game } from './components/Game';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* Header épuré et professionnel */}
      <header className="app-header-professional">
        <div className="header-container">
          <div className="header-content">
            <h1 className="app-title-professional">Queens Game</h1>
            <p className="app-subtitle-professional">Puzzle de placement de reines</p>
          </div>
        </div>
      </header>
      
      {/* Contenu principal */}
      <main className="app-main-professional">
        <Game />
      </main>
      
      {/* Footer discret */}
      <footer className="app-footer-professional">
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