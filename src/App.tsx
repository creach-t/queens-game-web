import { Game } from './components/Game';
import { GameStats } from './components/GameStats';
// import { Toaster } from './components/ui/toaster';
import { Crown, Github, ExternalLink } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header simplifié et compact */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-3 py-2">
          {/* Desktop: tout sur une ligne */}
          <div className="hidden sm:flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-slate-700" />
              <h1 className="text-base font-semibold text-slate-900">Queens Game</h1>
            </div>
            <GameStats />
            <div className="flex items-center gap-2">
              <a
                href="https://creachtheo.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="creachtheo.fr"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/creach-t"
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition-colors"
                title="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Mobile: empilé */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-slate-700" />
                <h1 className="text-base font-semibold text-slate-900">Queens Game</h1>
              </div>
              <div className="flex items-center gap-1">
                <a
                  href="https://creachtheo.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition-colors"
                  title="creachtheo.fr"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href="https://github.com/creach-t"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded transition-colors"
                  title="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <GameStats />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-0 py-0">
        <Game />
      </main>

      {/* Footer minimaliste */}
      <footer className="border-t bg-white/50 py-3">
        <div className="container mx-auto px-3">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
            <a
              href="https://github.com/creach-t/queens-game-web"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              Source
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="https://www.linkedin.com/games/queens/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors"
            >
              Original
            </a>
            <span className="text-slate-300">•</span>
            <span className="font-mono">v1.1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;