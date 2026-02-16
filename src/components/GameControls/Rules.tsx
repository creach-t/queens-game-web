import {
  ChevronDown,
  ChevronUp,
  Crown,
  HelpCircle,
  X as XIcon
} from 'lucide-react';
import React, { useState } from 'react';

export const Rules: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900 text-sm">Comment jouer</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50">
          <div className="space-y-2 pt-3">
            <div className="flex items-center gap-2">
              <XIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
              <div>
                <span className="font-medium text-xs">Clic simple : </span>
                <span className="text-gray-600 text-xs">Placer/enlever un marqueur</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <div>
                <span className="font-medium text-xs">Double-clic : </span>
                <span className="text-gray-600 text-xs">Placer/enlever une reine</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="font-medium text-xs mb-1.5">Règles :</div>
              <ul className="space-y-0.5 text-xs text-gray-600">
                <li>• Une reine par ligne, colonne et région</li>
                <li>• Les reines ne peuvent pas se toucher</li>
                <li>• Résolvez en plaçant toutes les reines</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};