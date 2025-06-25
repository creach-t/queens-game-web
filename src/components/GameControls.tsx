import React from 'react';
import { GameState } from '../types/game';
import './GameControls.css';

interface GameControlsProps {
  gameState: GameState;
  onResetGame?: () => void;
  onNewGame?: () => void;
  onGridSizeChange?: (size: number) => void;
  showOnlyStats?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
}) => {

  return (
    <div className="game-controls">

      {/* Message de victoire */}
      {gameState.isCompleted && (
        <div className="victory-message">
          <div className="victory-content">
            <div className="victory-emoji">🎉</div>
            <div className="victory-text">
              <h3>Félicitations !</h3>
              <p>Puzzle résolu en {gameState.moveCount} coups</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};