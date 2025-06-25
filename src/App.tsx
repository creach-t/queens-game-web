import './App.css';
import { Game } from './components/Game';

function App() {
  return (
    <div className="App">
      {/* Header épuré */}
      <header className="app-header-">
        <div className="header-container">
          <div className="header-content">
            <div className="title-block">
              <h1 className="app-title-">Queens Game</h1>
              <p className="app-subtitle-">
                Clone du jeu original, avec des niveaux générés aléatoirement
              </p>
            </div>
            <div className="header-links">
              <a
                href="https://github.com/creach-t"
                target="_blank"
                rel="noopener noreferrer"
                className="header-link"
              >
                Mon GitHub
              </a>
              <a
                href="https://creachtheo.fr"
                className="return-button"
              >
                Retour à creachtheo.fr
              </a>
            </div>
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
          <div className="footer-links">
            <a
              href="https://www.linkedin.com/games/queens"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Jeu original sur LinkedIn
            </a>
            <span className="footer-separator">•</span>
            <a
              href="https://github.com/creach-t/queens-game-web"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Code source sur GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
