import { Code, ExternalLink, Github, Home, Linkedin } from 'lucide-react';
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
                className="header-link github-link"
                aria-label="Voir mon profil GitHub"
              >
                <Github size={18} />
                <span>Mon GitHub</span>
              </a>
              <a
                href="https://creachtheo.fr"
                className="header-link return-button"
                aria-label="Retourner au site principal"
              >
                <Home size={18} />
                <span>Retour à creachtheo.fr</span>
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
              className="footer-link linkedin-link"
              aria-label="Jouer au jeu original sur LinkedIn"
            >
              <Linkedin size={16} />
              <span>Jeu original sur LinkedIn</span>
              <ExternalLink size={14} className="external-icon" />
            </a>
            <span className="footer-separator">•</span>
            <a
              href="https://github.com/creach-t/queens-game-web"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link github-link"
              aria-label="Voir le code source sur GitHub"
            >
              <Code size={16} />
              <span>Code source</span>
              <ExternalLink size={14} className="external-icon" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;