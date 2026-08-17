import { RotateCcw, Sparkles, Lightbulb } from 'lucide-react';
import React from 'react';
import { MainControlsProps } from '../../types/game';

/** Bouton d'action commun : cible ≥44px, icône + label, feedback tactile */
const baseBtn =
  'flex flex-col items-center justify-center gap-1 min-w-[4.25rem] min-h-[3.25rem] px-2.5 py-2 ' +
  'rounded-lg font-medium text-xs transition-transform duration-150 ' +
  'hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 ' +
  'disabled:cursor-not-allowed focus-visible:outline-none';

export const MainControls: React.FC<MainControlsProps> = ({
  onResetGame,
  onNewGame,
  isCompleted,
  onHint,
  hintCooldown,
  hintPenalty,
  hintDisabled,
}) => {
  const onCooldown = hintCooldown > 0;
  const hintUnavailable = isCompleted || hintDisabled || onCooldown;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg p-2">
      <div className="flex items-stretch gap-2">
        {/* Indice — action d'aide (accent indigo), pénalise le chrono */}
        <button
          type="button"
          onClick={onHint}
          disabled={hintUnavailable}
          aria-label={
            onCooldown
              ? `Indice disponible dans ${hintCooldown} secondes`
              : `Obtenir un indice (ajoute ${hintPenalty} secondes au chrono)`
          }
          title={
            onCooldown
              ? `Prochain indice dans ${hintCooldown}s`
              : `Indice — ajoute ${hintPenalty}s au chrono`
          }
          className={`${baseBtn} text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:bg-gray-50 disabled:text-gray-400`}
        >
          {onCooldown ? (
            <span className="text-lg font-bold leading-none tabular-nums" aria-hidden="true">
              {hintCooldown}
            </span>
          ) : (
            <Lightbulb className="w-5 h-5" aria-hidden="true" />
          )}
          <span className="whitespace-nowrap">Indice</span>
        </button>

        {/* Effacer — réinitialise la grille (secondaire, neutre) */}
        <button
          type="button"
          onClick={onResetGame}
          disabled={isCompleted}
          aria-label="Effacer la grille actuelle"
          title="Réinitialiser la grille actuelle"
          className={`${baseBtn} text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400`}
        >
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Effacer</span>
        </button>

        {/* Nouveau — action primaire (une seule CTA mise en avant) */}
        <button
          type="button"
          onClick={onNewGame}
          aria-label="Charger un nouveau puzzle"
          title="Charger un nouveau puzzle"
          className={`${baseBtn} text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20`}
        >
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          <span className="whitespace-nowrap">Nouveau</span>
        </button>
      </div>
    </div>
  );
};
