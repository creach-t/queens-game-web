import React from 'react';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex justify-center items-center w-full p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-center h-64 w-64">
          <div className="text-gray-500 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div>Chargement du plateau...</div>
          </div>
        </div>
      </div>
    </div>
  );
};