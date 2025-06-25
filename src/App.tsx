import React from 'react';
import { Game } from './components/Game';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        <h1 className="app-title">
          <span className="app-icon">👑</span>
          Queens Game Web
        </h1>
        <p className="app-subtitle">
          Version web responsive du célèbre puzzle Queens de LinkedIn
        </p>
      </header>
      
      <main className="app-main">
        <Game />
      </main>
      
      <footer className="app-footer">
        <p>
          Développé avec ❤️ • Inspiré du Queens Game de LinkedIn
        </p>
        <p className="app-footer-tech">
          React • TypeScript • CSS Grid • Responsive Design
        </p>
      </footer>
    </div>
  );
}

export default App;