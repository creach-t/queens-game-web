import { Game } from './components/Game';
import { Toaster } from './components/ui/toaster';
import { Crown } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Game />
      </main>

      <footer className="border-t bg-white/50 py-4 text-center text-xs text-slate-500">
        <p>Built with React & TypeScript</p>
      </footer>

      <Toaster />
    </div>
  );
}

export default App;