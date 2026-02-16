import {
  Crown,
  HelpCircle,
  X as XIcon,
  MousePointerClick,
  Grid3x3,
  Slash,
  Target
} from 'lucide-react';
import React, { useState } from 'react';

export const Rules: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Bouton ? */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 shadow-lg rounded-full flex items-center justify-center transition-all hover:scale-110"
        title="Comment jouer"
      >
        <HelpCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600" />
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
          <div className="absolute top-0 left-0 mt-12 z-40 w-80 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-md rounded-xl border-2 border-blue-200 shadow-2xl">
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-bold text-base text-gray-900">Comment jouer</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Objectif */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Target className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm text-blue-900 mb-1">Objectif</div>
                    <p className="text-xs text-blue-700">
                      Placez une reine (<Crown className="w-3 h-3 inline text-yellow-600" />) dans chaque région colorée
                      en respectant les règles du jeu.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contrôles */}
              <div className="space-y-2">
                <div className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                  <MousePointerClick className="w-4 h-4" />
                  Contrôles
                </div>

                <div className="space-y-2 pl-1">
                  <div className="flex items-start gap-2 bg-gray-50 rounded p-2">
                    <XIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-medium text-gray-900">1 clic :</span>
                      <span className="text-gray-600"> Marquer (X) une case vide</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-gray-50 rounded p-2">
                    <Crown className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-medium text-gray-900">2 clics :</span>
                      <span className="text-gray-600"> Placer une reine (👑)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-gray-50 rounded p-2">
                    <RotateCcw className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-medium text-gray-900">3 clics :</span>
                      <span className="text-gray-600"> Effacer la case</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Règles */}
              <div className="border-t-2 border-gray-200 pt-3">
                <div className="font-semibold text-sm text-gray-900 flex items-center gap-1.5 mb-2">
                  <Grid3x3 className="w-4 h-4" />
                  Règles importantes
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">1.</span>
                    <span><strong>Une reine par région</strong> (couleur unique)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">2.</span>
                    <span><strong>Une reine par ligne</strong> (horizontale)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">3.</span>
                    <span><strong>Une reine par colonne</strong> (verticale)</span>
                  </li>
                  <li className="flex items-start gap-2 bg-red-50 border border-red-200 rounded p-2 -mx-1">
                    <Slash className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span><strong className="text-red-700">Aucune reine ne peut se toucher</strong> (même en diagonale !)</span>
                  </li>
                </ul>
              </div>

              {/* Astuce */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                <p className="text-xs text-yellow-800">
                  💡 <strong>Astuce :</strong> Utilisez les marqueurs (X) pour éliminer les cases impossibles !
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import { RotateCcw } from 'lucide-react';