import { Game } from './components/Game';
import { Crown } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
      {/* Header */}
      <header className="text-center py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 flex items-center justify-center gap-4">
            <Crown className="w-12 h-12 text-yellow-400" />
            Queens Game
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-light">
            Version web responsive du célèbre puzzle Queens de LinkedIn
          </p>
        </div>
      </header>

      {/* Main game */}
      <main className="pb-8">
        <Game />
      </main>

      {/* Footer */}
      <footer className="text-center py-6 px-4 bg-black/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-300 mb-1">
            Développé pour la communauté • Inspiré du Queens Game de LinkedIn
          </p>
          <p className="text-sm text-slate-400">
            React • TypeScript • Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;