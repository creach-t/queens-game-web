import React, { useRef, useState } from 'react';
import { GameCell as GameCellType } from '../types/game';

const QueenIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = ""
}) => (
  <img
    src="/crown.svg"
    width={size}
    height={size}
    className={className}
    alt="Crown"
  />
);

const CrossIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = ""
}) => (
  <img
    src="/cross.svg"
    width={size}
    height={size}
    className={className}
    alt="Cross"
  />
);

interface GameCellProps {
  cell: GameCellType;
  size: number;
  onClick: () => void;
}

export const GameCell: React.FC<GameCellProps> = ({ cell, size, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cellRef = useRef<HTMLButtonElement>(null);

  const getCellContent = () => {
    const iconSize = Math.max(16, size * 0.4);
    switch (cell.state) {
      case 'queen':
        return <QueenIcon size={iconSize} />;
      case 'marker':
        return <CrossIcon size={iconSize} />;
      default:
        return null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      ref={cellRef}
      className={`
        relative cursor-pointer
        flex items-center justify-center font-bold
        ${isHovered ? 'transform scale-105 shadow-lg z-10' : 'shadow-sm'}
        ${cell.isConflict ? 'bg-red-100 ring-2 ring-red-300' : ''}
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50
      `}
      style={{
        backgroundColor: cell.regionColor,
        width: size,
        height: size
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      title={`Cellule ${cell.row + 1}-${String.fromCharCode(65 + cell.col)} (Région ${cell.regionId})`}
    >
      <span className={`
        flex items-center justify-center
        ${isHovered ? 'transform scale-110' : ''}
      `}>
        {getCellContent()}
      </span>

      {/* Overlay subtil au hover */}
      <div className={`
        absolute inset-0 bg-white transition-opacity duration-200
        ${isHovered ? 'opacity-20' : 'opacity-0'}
      `} />
    </button>
  );
};
