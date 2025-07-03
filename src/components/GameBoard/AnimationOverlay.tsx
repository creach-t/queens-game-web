import React from 'react';
import { AnimationOverlayProps } from '../../types/game';

export const AnimationOverlay: React.FC<AnimationOverlayProps> = ({
  isDestroying,
  isLoading
}) => {
  if (!isDestroying && !isLoading) {
    return null;
  }

  return (
    <>
      {/* Overlay destruction - GLASSMORPHISM ROUGE */}
      {isDestroying && (
        <div className="absolute inset-0 rounded-lg z-50 pointer-events-none overflow-hidden">
          {/* Gradient animé de fond */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/40 via-pink-500/30 to-red-600/40 animate-pulse"></div>

          {/* Effet glassmorphism principal */}
          <div
            className="absolute inset-0 backdrop-blur-[12px] bg-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              borderRadius: 'inherit'
            }}
          ></div>

          {/* Particules flottantes */}
          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-1 h-1 bg-red-300/60 rounded-full animate-ping`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '2s'
                }}
              ></div>
            ))}
          </div>

          {/* Message central élégant */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative px-8 py-6 rounded-2xl shadow-2xl border border-white/20"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))',
                backdropFilter: 'blur(20px)'
              }}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-400 to-pink-500 animate-spin"></div>
                  <div className="absolute inset-0 w-6 h-6 rounded-full bg-gradient-to-r from-red-400 to-pink-500 animate-ping opacity-75"></div>
                </div>
                <div className="text-red-100 font-semibold text-lg tracking-wide drop-shadow-lg">
                  Reconstruction...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay construction - GLASSMORPHISM BLEU PREMIUM */}
      {isLoading && (
        <div className="absolute inset-0 rounded-lg z-50 pointer-events-none overflow-hidden">
          {/* Gradient animé de fond avec vagues */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 via-cyan-500/30 to-blue-600/40">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-300/20 to-transparent animate-pulse"></div>
          </div>

          {/* Effet glassmorphism principal */}
          <div
            className="absolute inset-0 backdrop-blur-[16px]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
              borderRadius: 'inherit'
            }}
          ></div>

          {/* Mesh gradient overlay pour effet depth */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 20% 50%, rgba(120,119,198,0.3), transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,119,198,0.3), transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(119,198,255,0.3), transparent 50%)
              `
            }}
          ></div>

          {/* Particules flottantes élégantes */}
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-blue-200/40 to-cyan-200/40 animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${4 + Math.random() * 8}px`,
                  height: `${4 + Math.random() * 8}px`,
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              ></div>
            ))}
          </div>

          {/* Message central premium */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative px-10 py-8 rounded-3xl shadow-2xl border border-white/30"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.1))',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
              }}
            >
              <div className="flex items-center gap-5">
                <div className="relative">
                  {/* Spinner avec multiple couches */}
                  <div className="w-8 h-8 rounded-full border-2 border-blue-200/30 border-t-blue-300 animate-spin"></div>
                  <div className="absolute inset-1 w-6 h-6 rounded-full border-2 border-cyan-200/30 border-t-cyan-300 animate-spin animate-reverse"></div>
                  <div className="absolute inset-2 w-4 h-4 rounded-full bg-gradient-to-r from-blue-300 to-cyan-300 animate-pulse"></div>
                </div>
                <div>
                  <div className="text-blue-50 font-bold text-xl tracking-wide drop-shadow-lg">
                    Génération
                  </div>
                  <div className="text-blue-100/80 text-sm font-medium tracking-wider">
                    Création du plateau...
                  </div>
                </div>
              </div>

              {/* Barre de progression élégante */}
              <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-300 to-cyan-300 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-10px) rotate(180deg); opacity: 1; }
        }

        @keyframes animate-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }

        .animate-reverse {
          animation: animate-reverse 1s linear infinite;
        }
      `}</style>
    </>
  );
};