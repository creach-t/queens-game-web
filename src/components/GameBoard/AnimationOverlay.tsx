import React from 'react';
import { AnimationOverlayProps } from '../../types/game';

// Positions déterministes pré-calculées (plus de Math.random dans le rendu)
const DESTRUCTION_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  left: `${(i * 13 + 7) % 100}%`,
  top: `${(i * 17 + 11) % 100}%`,
  delay: `${i * 0.2}s`,
}));

const CONSTRUCTION_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 8 + 5) % 100}%`,
  top: `${(i * 11 + 3) % 100}%`,
  width: `${4 + (i % 3) * 4}px`,
  height: `${4 + (i % 3) * 4}px`,
  delay: `${i * 0.3}s`,
  duration: `${3 + (i % 3)}s`,
}));

export const AnimationOverlay: React.FC<AnimationOverlayProps> = ({
  isDestroying,
  isLoading
}) => {
  if (!isDestroying && !isLoading) {
    return null;
  }

  return (
    <>
      {/* Overlay destruction — glassmorphism rouge */}
      {isDestroying && (
        <div className="absolute inset-0 rounded-lg z-50 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-400/40 via-pink-500/30 to-red-600/40 animate-pulse" />
          <div
            className="absolute inset-0 backdrop-blur-[12px] bg-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              borderRadius: 'inherit'
            }}
          />
          <div className="absolute inset-0">
            {DESTRUCTION_PARTICLES.map((p, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-red-300/60 rounded-full animate-ping"
                style={{
                  left: p.left,
                  top: p.top,
                  animationDelay: p.delay,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
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
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-400 to-pink-500 animate-spin" />
                  <div className="absolute inset-0 w-6 h-6 rounded-full bg-gradient-to-r from-red-400 to-pink-500 animate-ping opacity-75" />
                </div>
                <div className="text-red-100 font-semibold text-lg tracking-wide drop-shadow-lg">
                  Reconstruction...
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay construction — glassmorphism bleu */}
      {isLoading && (
        <div className="absolute inset-0 rounded-lg z-50 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 via-cyan-500/30 to-blue-600/40">
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-blue-300/20 to-transparent animate-pulse" />
          </div>
          <div
            className="absolute inset-0 backdrop-blur-[16px]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))',
              borderRadius: 'inherit'
            }}
          />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `
                radial-gradient(circle at 20% 50%, rgba(120,119,198,0.3), transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,119,198,0.3), transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(119,198,255,0.3), transparent 50%)
              `
            }}
          />
          <div className="absolute inset-0">
            {CONSTRUCTION_PARTICLES.map((p, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-blue-200/40 to-cyan-200/40 animate-float"
                style={{
                  left: p.left,
                  top: p.top,
                  width: p.width,
                  height: p.height,
                  animationDelay: p.delay,
                  animationDuration: p.duration,
                }}
              />
            ))}
          </div>
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
                  <div className="w-8 h-8 rounded-full border-2 border-blue-200/30 border-t-blue-300 animate-spin" />
                  <div className="absolute inset-1 w-6 h-6 rounded-full border-2 border-cyan-200/30 border-t-cyan-300 animate-spin animate-reverse-spin" />
                  <div className="absolute inset-2 w-4 h-4 rounded-full bg-gradient-to-r from-blue-300 to-cyan-300 animate-pulse" />
                </div>
                <div>
                  <div className="text-blue-50 font-bold text-xl tracking-wide drop-shadow-lg">
                    Chargement
                  </div>
                  <div className="text-blue-100/80 text-sm font-medium tracking-wider">
                    Préparation du plateau...
                  </div>
                </div>
              </div>
              <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-300 to-cyan-300 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
