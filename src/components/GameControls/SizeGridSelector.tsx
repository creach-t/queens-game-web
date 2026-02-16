import React, { useEffect } from 'react';
import { SizeGridSelectorProps } from '../../types/game';

const GRID_SIZE_STORAGE_KEY = 'queens-game-grid-size';

const difficultyInfo = {
  5: { name: "Tutoriel", color: "bg-green-100 text-green-700" },
  6: { name: "Facile", color: "bg-blue-100 text-blue-700" },
  7: { name: "Normal", color: "bg-yellow-100 text-yellow-700" },
  8: { name: "Difficile", color: "bg-orange-100 text-orange-700" },
  9: { name: "Expert", color: "bg-red-100 text-red-700" },
  10: { name: "Maître", color: "bg-purple-100 text-purple-700" },
  11: { name: "Légendaire", color: "bg-pink-100 text-pink-700" },
  12: { name: "Mythique", color: "bg-gray-100 text-gray-700" }
};

export const SizeGridSelector: React.FC<SizeGridSelectorProps> = ({
  currentGridSize,
  onGridSizeChange,
}) => {
  // Charger la préférence au montage
  useEffect(() => {
    const savedSize = localStorage.getItem(GRID_SIZE_STORAGE_KEY);
    if (savedSize) {
      const size = Number(savedSize);
      if (size >= 5 && size <= 12 && size !== currentGridSize) {
        onGridSizeChange(size);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (newSize: number) => {
    localStorage.setItem(GRID_SIZE_STORAGE_KEY, String(newSize));
    onGridSizeChange(newSize);
  };

  const currentDifficulty = difficultyInfo[currentGridSize as keyof typeof difficultyInfo];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg p-1.5">
      <select
        value={currentGridSize}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-16 sm:w-20 h-8 sm:h-9 border border-gray-300 rounded px-1.5 sm:px-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        title={currentDifficulty?.name}
      >
        <option value={5}>5×5</option>
        <option value={6}>6×6</option>
        <option value={7}>7×7</option>
        <option value={8}>8×8</option>
        <option value={9}>9×9</option>
        <option value={10}>10×10</option>
        <option value={11}>11×11</option>
        <option value={12}>12×12</option>
      </select>
    </div>
  );
};