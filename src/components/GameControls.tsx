import React from 'react';
import { GameState } from '../types/game';
import './GameControls.css';

interface GameControlsProps {
  gameState: GameState;
  onResetGame: () => void;
  onNewGame: () => void;
  onGridSizeChange: (size: number) => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onResetGame,
  onNewGame,
  onGridSizeChange
}) => {
  const progressPercentage = (gameState.queensPlaced / gameState.queensRequired) * 100;

  return (
    <div className="game-controls">
      {/* Statistiques du jeu */}
      <div className="game-stats">
        <div className="stat-card">
          <div className="stat-label">Reines placées</div>
          <div className="stat-value">
            {gameState.queensPlaced} / {gameState.queensRequired}
          </div>
          <div className="stat-progress">
            <div 
              className="stat-progress-bar"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Coups joués</div>
          <div className="stat-value">{gameState.moveCount}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Grille</div>
          <div className="stat-value">{gameState.gridSize}x{gameState.gridSize}</div>
        </div>
      </div>

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

      {/* Instructions */}
      <div className="game-instructions">
        <h4>Comment jouer :</h4>
        <ul>
          <li><strong>Clic simple</strong> : Placer/enlever un marqueur ✗</li>
          <li><strong>Double-clic</strong> : Placer/enlever une reine ♛</li>
          <li><strong>Objectif</strong> : Une reine par ligne, colonne et région colorée</li>
          <li><strong>Contrainte</strong> : Les reines ne peuvent pas se toucher</li>
        </ul>
      </div>

      {/* Contrôles */}
      <div className="game-actions">
        <div className="size-controls">
          <label htmlFor="grid-size">Taille de la grille :</label>
          <select 
            id="grid-size"
            value={gameState.gridSize} 
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="grid-size-select"
          >
            <option value={4}>4x4 (Facile)</option>
            <option value={5}>5x5 (Moyen)</option>
            <option value={6}>6x6 (Difficile)</option>
            <option value={7}>7x7 (Expert)</option>
            <option value={8}>8x8 (Maître)</option>
          </select>
        </div>

        <div className="action-buttons">
          <button 
            onClick={onResetGame}
            className="btn btn--secondary"
            title="Remettre à zéro le niveau actuel"
          >
            🔄 Réinitialiser
          </button>
          
          <button 
            onClick={onNewGame}
            className="btn btn--primary"
            title="Générer un nouveau niveau"
          >
            ✨ Nouveau jeu
          </button>
        </div>
      </div>
    </div>
  );
};