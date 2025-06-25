import React from 'react';
import { GameState } from '../types/game';
import './GameControls.css';

interface GameControlsProps {
  gameState: GameState;
  onResetGame: () => void;
  onNewGame: () => void;
  onGridSizeChange: (size: number) => void;
}

// Composant Statistiques épuré
const GameStats: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const progressPercentage = (gameState.queensPlaced / gameState.queensRequired) * 100;
  
  return (
    <div className="game-stats-professional">
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">
            {gameState.queensPlaced}
          </div>
          <div className="stat-label">Reines placées</div>
          <div className="stat-sublabel">sur {gameState.queensRequired}</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">
            {gameState.moveCount}
          </div>
          <div className="stat-label">Coups</div>
        </div>
        
        <div className="stat-item">
          <div className="stat-value">
            {gameState.gridSize}×{gameState.gridSize}
          </div>
          <div className="stat-label">Grille</div>
        </div>
      </div>
      
      {/* Barre de progression discrète */}
      <div className="progress-container">
        <div 
          className="progress-bar"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

// Message de victoire discret
const VictoryMessage: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="victory-message-professional">
      <div className="victory-content">
        <div className="victory-icon">✓</div>
        <div className="victory-text">
          <h3>Puzzle résolu !</h3>
          <p>Félicitations, toutes les reines sont correctement placées.</p>
        </div>
      </div>
    </div>
  );
};

// Instructions épurées
const GameInstructions: React.FC = () => {
  return (
    <div className="game-instructions-professional">
      <h3>Comment jouer</h3>
      <ul>
        <li><strong>Clic simple :</strong> Placer/enlever un marqueur</li>
        <li><strong>Double-clic :</strong> Placer/enlever une reine</li>
        <li><strong>Objectif :</strong> Une reine par ligne, colonne et région</li>
        <li><strong>Règle :</strong> Les reines ne peuvent pas se toucher</li>
      </ul>
    </div>
  );
};

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  onResetGame,
  onNewGame,
  onGridSizeChange
}) => {
  return (
    <div className="game-controls-professional">
      <VictoryMessage isVisible={gameState.isCompleted} />
      
      <GameStats gameState={gameState} />
      
      {/* Contrôles épurés */}
      <div className="controls-section">
        <div className="size-control">
          <label htmlFor="grid-size" className="control-label">
            Taille de grille
          </label>
          <select 
            id="grid-size"
            value={gameState.gridSize}
            onChange={(e) => onGridSizeChange(Number(e.target.value))}
            className="size-select"
          >
            <option value={4}>4×4</option>
            <option value={5}>5×5</option>
            <option value={6}>6×6</option>
            <option value={7}>7×7</option>
            <option value={8}>8×8</option>
          </select>
        </div>

        <div className="action-buttons">
          <button
            onClick={onResetGame}
            className="btn btn-secondary"
            title="Remettre à zéro le niveau actuel"
          >
            Réinitialiser
          </button>
          
          <button
            onClick={onNewGame}
            className="btn btn-primary"
            title="Générer un nouveau niveau"
          >
            Nouveau jeu
          </button>
        </div>
      </div>
      
      <GameInstructions />
    </div>
  );
};