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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Comment jouer</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50">
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3">
              <XIcon className="w-5 h-5 text-red-500" />
              <div>
                <div className="font-medium text-sm">Clic simple</div>
                <div className="text-gray-600 text-sm">Placer/enlever un marqueur</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-600" />
              <div>
                <div className="font-medium text-sm">Double-clic</div>
                <div className="text-gray-600 text-sm">Placer/enlever une reine</div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="font-medium text-sm mb-2">Règles :</div>
              <ul className="space-y-1 text-sm text-gray-600">
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