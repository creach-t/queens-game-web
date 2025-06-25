import React, { useRef, useState } from 'react';
import { GameCell as GameCellType } from '../types/game';
import './GameCell.css';

// Icônes SVG simples et professionnelles
const QueenIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M5 16L3 20v1h18v-1l-2-4H5zM12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zM12 3L10 8l2 2 2-2L12 3zM16.5 8.5L15 12l1.5 1.5L18 12l-1.5-3.5zM7.5 8.5L6 12l1.5 1.5L9 12L7.5 8.5z"
      fill="currentColor"
    />
    <circle cx="12" cy="8" r="1" fill="currentColor"/>
    <circle cx="8" cy="9" r="0.8" fill="currentColor"/>
    <circle cx="16" cy="9" r="0.8" fill="currentColor"/>
  </svg>
);

const CrossIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
    <path
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
      fill="currentColor"
    />
  </svg>
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
        return <QueenIcon size={iconSize} className="text-blue-700" />;
      case 'marker':
        return <CrossIcon size={iconSize} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getBorderStyle = () => {
    const borders: React.CSSProperties = {};
    const borderWidth = 2;
    const borderColor = '#37474F';

    // Bordures pour délimiter les régions
    borders.borderTop = `${borderWidth}px solid ${borderColor}`;
    borders.borderLeft = `${borderWidth}px solid ${borderColor}`;
    borders.borderRight = `${borderWidth}px solid ${borderColor}`;
    borders.borderBottom = `${borderWidth}px solid ${borderColor}`;

    return borders;
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
        relative transition-all duration-200 ease-out cursor-pointer
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
        transition-all duration-150 flex items-center justify-center
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
