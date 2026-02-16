import { Game } from './components/Game';
import { GameStats } from './components/GameStats';
// import { Toaster } from './components/ui/toaster';
import { Crown, Github, ExternalLink } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          {/* Boutons de navigation en haut */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <a
              href="https://creachtheo.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
              title="Retour au site principal"
            >
              <ExternalLink className="h-4 w-4" />
              creachtheo.fr
            </a>
            <a
              href="https://github.com/creach-t"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
              title="GitHub de CREACH-T"
            >
              <Github className="h-4 w-4" />
              creach-t
            </a>
          </div>

          {/* Titre principal centré avec stats */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-3">
              <Crown className="h-8 w-8 text-slate-700" />
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-slate-900">
                  Queens Game
                </h1>
                <p className="text-sm text-slate-600">
                  Place queens without conflicts
                </p>
              </div>
            </div>

            {/* Game Stats */}
            <GameStats />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Game />
      </main>

      <footer className="border-t bg-white/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Built with React & TypeScript</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono">v1.1.0</span>
            </div>

            <div className="flex items-center gap-6">
              <a
                href="https://github.com/creach-t/queens-game-web"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                title="Code source sur GitHub"
              >
                <Github className="h-4 w-4" />
                <span className="text-sm">Source Code</span>
              </a>

              <span className="text-slate-300">•</span>

              <a
                href="https://www.linkedin.com/games/queens/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
                title="Jeu Queens original sur LinkedIn"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span className="text-sm">LinkedIn Queens</span>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* <Toaster /> */}
    </div>
  );
}

export default App;