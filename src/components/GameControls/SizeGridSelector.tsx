import React from 'react';

interface SizeGridSelectorProps {
  currentGridSize: number;
  onGridSizeChange: (size: number) => void;
  levelCounts: Record<number, number>;
}

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
  levelCounts
}) => {
  const formatLevelCount = (gridSize: number) => {
    const count = levelCounts[gridSize] || 0;
    return count > 0 ? ` (${count} niveaux)` : ' (0 niveau)';
  };

  const currentDifficulty = difficultyInfo[currentGridSize as keyof typeof difficultyInfo];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <label className="font-medium text-gray-900">Difficulté</label>
        {currentDifficulty && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentDifficulty.color}`}>
            {currentDifficulty.name}
          </span>
        )}
      </div>

      <select
        value={currentGridSize}
        onChange={(e) => onGridSizeChange(Number(e.target.value))}
        className="w-full h-12 border border-gray-300 rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value={5}>5×5 — Tutoriel{formatLevelCount(5)}</option>
        <option value={6}>6×6 — Facile{formatLevelCount(6)}</option>
        <option value={7}>7×7 — Normal{formatLevelCount(7)}</option>
        <option value={8}>8×8 — Difficile{formatLevelCount(8)}</option>
        <option value={9}>9×9 — Expert{formatLevelCount(9)}</option>
        <option value={10}>10×10 — Maître{formatLevelCount(10)}</option>
        <option value={11}>11×11 — Légendaire{formatLevelCount(11)}</option>
        <option value={12}>12×12 — Mythique{formatLevelCount(12)}</option>
      </select>
    </div>
  );
};