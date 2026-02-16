import { Game } from './components/Game';
import { GameStats } from './components/GameStats';
// import { Toaster } from './components/ui/toaster';
import { Crown, Github, ExternalLink } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Header simplifié et compact */}
      <header className="border-b bg-white/80 backdrop-blur-sm z-50 relative">
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

      <main className="flex-1 relative">
        {/* SEO Content - Hidden but crawlable */}
        <div className="sr-only">
          <h1>Queens Game Online - Jeu de Puzzle de Logique Gratuit et Illimité</h1>
          <p>
            Jouez au Queens Game, un jeu de puzzle de logique addictif inspiré du célèbre jeu Queens de LinkedIn.
            Placez stratégiquement les reines sur une grille colorée en respectant les règles : une seule reine par
            ligne, colonne et région, et aucune reine ne doit en toucher une autre (diagonales incluses).
          </p>
          <h2>Comment Jouer au Queens Game</h2>
          <p>
            Le Queens Game est un puzzle de logique fascinant qui teste vos compétences en déduction et stratégie.
            Chaque grille contient des régions colorées, et vous devez placer exactement une reine dans chaque région,
            ligne et colonne. Le défi : les reines ne peuvent pas se toucher, même en diagonale !
          </p>
          <h3>Règles du Jeu Queens</h3>
          <ul>
            <li>Placez une reine dans chaque région colorée</li>
            <li>Une seule reine par ligne et par colonne</li>
            <li>Les reines ne peuvent pas se toucher (incluant les diagonales)</li>
            <li>Résolvez le puzzle pour gagner et battre votre record</li>
          </ul>
          <h3>Pourquoi Jouer au Queens Game ?</h3>
          <ul>
            <li>Niveaux illimités générés aléatoirement</li>
            <li>Difficultés variées de 5×5 à 12×12</li>
            <li>Classement en temps réel des meilleurs joueurs</li>
            <li>Gratuit et sans téléchargement</li>
            <li>Jouable sur mobile, tablette et ordinateur</li>
            <li>Sauvegarde automatique de votre progression</li>
          </ul>
          <p>
            Inspiré du problème classique des n-reines en informatique et du jeu Queens de LinkedIn News,
            ce puzzle de logique améliore vos capacités de réflexion stratégique et de résolution de problèmes.
            Parfait pour les amateurs de sudoku, puzzles logiques, et jeux de réflexion !
          </p>
        </div>

        <Game />
      </main>

      {/* Footer minimaliste */}
      <footer className="border-t bg-white/50 py-3 z-50 relative">
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