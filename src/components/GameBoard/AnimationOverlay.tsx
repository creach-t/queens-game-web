import React from 'react';

interface AnimationOverlayProps {
  isDestroying: boolean;
  isLoading: boolean;
}

export const AnimationOverlay: React.FC<AnimationOverlayProps> = ({
  isDestroying,
  isLoading
}) => {
  if (!isDestroying && !isLoading) {
    return null;
  }

  return (
    <>
      {/* Overlay destruction */}
      {isDestroying && (
        <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center rounded-lg z-50 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-red-200">
            <div className="text-red-600 font-medium text-sm animate-pulse flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce"></div>
              Reconstruction...
            </div>
          </div>
        </div>
      )}

      {/* Overlay construction */}
      {isLoading && (
        <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center rounded-lg z-50 pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-blue-200">
            <div className="text-blue-600 font-medium text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-spin"></div>
              Chargement...
            </div>
          </div>
        </div>
      )}
    </>
  );
};