import React, { useEffect, useState } from 'react';
import { GameState } from '../types/game';
import './GameControls.css';

interface GameControlsProps {
  gameState: GameState;
  onResetGame: () => void;
  onNewGame: () => void;
  onGridSizeChange: (size: number) => void;
}

const GameStats: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (gameState.moveCount === 0 && !gameState.isCompleted) {
      setTimer(0);
      setIsRunning(false);
    } else if (gameState.moveCount > 0 && !gameState.isCompleted) {
      setIsRunning(true);
    } else if (gameState.isCompleted) {
      setIsRunning(false);
    }
  }, [gameState.moveCount, gameState.isCompleted]);

  useEffect(() => {
    let interval: number;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            {formatTime(timer)}
          </div>
          <div className="stat-label">Temps</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">
            {gameState.gridSize}×{gameState.gridSize}
          </div>
          <div className="stat-label">Grille</div>
        </div>
      </div>

      <div className="progress-container">
        <div
          className="progress-bar"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

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

const GameInstructions: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="game-instructions-professional">
      <button
        className="instructions-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        Comment jouer {isOpen ? '▼' : '▶'}
      </button>

      {isOpen && (
        <div className="instructions-content">
          <ul>
            <li><strong>Clic simple :</strong> Placer/enlever un marqueur</li>
            <li><strong>Double-clic :</strong> Placer/enlever une reine</li>
            <li><strong>Objectif :</strong> Une reine par ligne, colonne et région</li>
            <li><strong>Règle :</strong> Les reines ne peuvent pas se toucher</li>
          </ul>
        </div>
      )}
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