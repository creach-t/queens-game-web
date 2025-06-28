import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

interface TimerProps {
  gameTime: number;
  isCompleted: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  gameTime = 0, // Valeur par défaut
  isCompleted
}) => {
  const formatTime = (seconds: number): string => {
    // Protection contre NaN et valeurs invalides
    const validSeconds = isNaN(seconds) || seconds < 0 ? 0 : Math.floor(seconds);
    const mins = Math.floor(validSeconds / 60);
    const secs = validSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mb-2">
      <div className={`bg-white rounded-xl shadow-lg border px-4 py-2 transition-all duration-300 ${
        isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
      }`}>
        <div className="flex items-center justify-center gap-3">
          <Clock className={`w-6 h-6 transition-colors duration-300 ${
            isCompleted ? 'text-green-600' : 'text-gray-600'
          }`} />
          <div className={`text-xl transition-colors duration-300 ${
            isCompleted ? 'text-green-700' : 'text-gray-800'
          }`}>
            {formatTime(gameTime)}
          </div>
          {isCompleted && (
            <CheckCircle className="w-6 h-6 text-green-500 animate-pulse-subtle" />
          )}
        </div>
      </div>
    </div>
  );
};