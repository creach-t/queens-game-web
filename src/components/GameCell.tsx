import { Crown, X } from 'lucide-react';
import React from 'react';
import { GameCell as GameCellType } from '../types/game';

interface GameCellProps {
  cell: GameCellType;
  size: number;
  onClick: () => void;
  showVictoryAnimation?: boolean;
  isLoading?: boolean;
}

export const GameCell: React.FC<GameCellProps> = ({
  cell,
  size,
  onClick,
  showVictoryAnimation = false,
  isLoading = false
}) => {
  const getCellContent = () => {
    const iconSize = Math.max(20, size * 0.5);

    // Couleur spéciale pour l'animation de victoire
    const getIconColor = () => {
      if (showVictoryAnimation && cell.state === 'queen') {
        return 'text-yellow-400 animate-pulse-subtle animate-bounce ';
      }
      if (cell.isConflict) {
        return 'text-red-600';
      }
      return 'text-slate-800';
    };

    switch (cell.state) {
      case 'queen':
        return (
          <Crown
            size={iconSize}
            className={`transition-all duration-300 ${getIconColor()}`}
            fill="currentColor"
          />
        );

      case 'marker':
        return (
          <X
            size={iconSize-8}
            className={`transition-all duration-200 text-slate-700`}
            strokeWidth={2}
          />
        );

      default:
        return null;
    }
  };

  const getCellClasses = () => {
    let classes = `
      w-full h-full flex items-center justify-center
      cursor-pointer transition-all duration-300
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
      relative overflow-hidden
    `;

    // Animation de victoire
    if (showVictoryAnimation && cell.state === 'queen') {
      classes += 'shadow-lg shadow-yellow-400/50 ring-2 ring-yellow-400';
    }

    // Animation de chargement
    if (isLoading) {
      classes += ' animate-pulse';
    } else {
      classes += ' hover:scale-105 hover:shadow-lg active:scale-95';
    }

    // Conflits
    if (cell.isConflict && !showVictoryAnimation) {
      classes += ' bg-red-50 ring-2 ring-red-200';
    }

    return classes;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  const getCellBackgroundColor = () => {
    return cell.regionColor;
  };

  return (
    <div
      className={getCellClasses()}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        backgroundColor: getCellBackgroundColor(),
        width: size,
        height: size,
        minWidth: size,
        minHeight: size
      }}
      title={`Cellule ${cell.row + 1}-${cell.col + 1} (Région ${cell.regionId})`}
    >
      {/* Animation de chargement - effet de shimmer */}
      {isLoading && (
        <div
          className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{
            animation: 'shimmer 2s infinite'
          }}
        />
      )}

      {getCellContent()}

      {/* Overlay pour les hachures de conflit - SEULEMENT s'il y a des conflits réels */}
      {(cell.isInConflictLine || cell.isInConflictColumn ||
        cell.isInConflictRegion || cell.isAroundConflictQueen) &&
        !showVictoryAnimation && (
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 8px,
              rgba(247,0,0,0.9) 8px,
              rgba(247,0,0,0.4) 16px
            )`
          }}
        />
      )}

      {/* Effet de particules pour l'animation de victoire */}
      {showVictoryAnimation && cell.state === 'queen' && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
              style={{
                top: `${20 + Math.random() * 60}%`,
                left: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 200}ms`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};