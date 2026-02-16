import {
  Crown,
  HelpCircle,
  X as XIcon
} from 'lucide-react';
import React, { useState } from 'react';

export const Rules: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Bouton ? */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center transition-all hover:scale-110"
        title="Comment jouer"
      >
        <HelpCircle className="w-5 h-5 text-blue-600" />
      </button>

      {/* Popup des règles */}
      {isOpen && (
        <>
          {/* Overlay transparent pour fermer */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Contenu de la bulle */}
          <div className="absolute top-0 left-0 mt-12 z-40 w-72 bg-white/95 backdrop-blur-sm rounded-lg border border-gray-200 shadow-xl">
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm text-gray-900">Comment jouer</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-0.5 hover:bg-gray-100 rounded"
                >
                  <XIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex items-start gap-2">
                <XIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-medium">Clic simple : </span>
                  <span className="text-gray-600">Placer/enlever un marqueur</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Crown className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-medium">Double-clic : </span>
                  <span className="text-gray-600">Placer/enlever une reine</span>
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
        </>
      )}
    </div>
  );
};