import React, { useEffect, useState } from 'react';
import { useGameLogic } from '../hooks/useGameLogic';
import './Game.css';
import { GameBoard } from './GameBoard';
import { GameControls } from './GameControls';

export const Game: React.FC = () => {
  const {
    gameState,
    handleCellClick,
    resetGame,
    newGame
  } = useGameLogic(5); // Commencer avec une grille 5x5

  // Timer state
  const [seconds, setSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Instructions dropdown state
  const [showInstructions, setShowInstructions] = useState(false);

  const handleGridSizeChange = (newSize: number) => {
    newGame(newSize);
    setSeconds(0);
    setIsTimerActive(true);
  };

  const handleReset = () => {
    resetGame();
  };

  const handleNewGame = () => {
    newGame();
    setSeconds(0);
    setIsTimerActive(true);
  };

  // Timer logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isTimerActive) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
      }, 1000);
    } else if (!isTimerActive && seconds !== 0) {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, seconds]);

  // Start timer at mount
  useEffect(() => {
    setIsTimerActive(true);
  }, []);

  // Stop timer when game is completed
  useEffect(() => {
    if (gameState.isCompleted) {
      setIsTimerActive(false);
    }
  }, [gameState.isCompleted]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game">
      {/* Timer discret en haut à droite */}
      <div style={{
        top: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px',
        borderRadius: '14px',
        fontSize: '0.9rem',
        color: '#666',
        fontFamily: 'monospace',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        zIndex: 10
      }}>
        ⏱️ {formatTime(seconds)}
      </div>

      <div className="game-container">
        {/* Plateau de jeu avec boutons en dessous */}
        <div className="game-board-section">
          <GameBoard
            gameState={gameState}
            onCellClick={handleCellClick}
          />

          {/* Boutons sous la grille */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginTop: '20px',
            maxWidth: '400px',
            margin: '20px auto 0'
          }}>
            {/* Sélecteur de taille */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <label
                htmlFor="grid-size"
                style={{
                  fontWeight: '500',
                  color: '#333',
                  whiteSpace: 'nowrap'
                }}
              >
                Taille de la grille :
              </label>
              <select
                id="grid-size"
                value={gameState.gridSize}
                onChange={(e) => handleGridSizeChange(Number(e.target.value))}
                className="grid-size-select"
              >
                <option value={4}>4x4 (Facile)</option>
                <option value={5}>5x5 (Moyen)</option>
                <option value={6}>6x6 (Difficile)</option>
                <option value={7}>7x7 (Expert)</option>
                <option value={8}>8x8 (Maître)</option>
              </select>
            </div>

            {/* Boutons d'action */}
            <div className="action-buttons">
              <button
                onClick={handleReset}
                className="btn btn--secondary"
                title="Remettre à zéro le niveau actuel"
              >
                🔄 Réinitialiser
              </button>

              <button
                onClick={handleNewGame}
                className="btn btn--primary"
                title="Générer un nouveau niveau"
              >
                ✨ Nouveau jeu
              </button>
            </div>
          </div>

          {/* Instructions dropdown */}
          <div style={{
            maxWidth: '400px',
            margin: '15px auto 0',
            background: '#f8f9fa',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              style={{
                width: '100%',
                padding: '15px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '1.1rem',
                fontWeight: '500',
                color: '#0077b5',
                transition: 'background-color 0.2s ease'
              }}
            >
              <span>💡 Comment jouer</span>
              <span style={{
                transform: showInstructions ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
                fontSize: '0.8rem'
              }}>
                ▼
              </span>
            </button>

            <div style={{
              maxHeight: showInstructions ? '200px' : '0',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease',
              borderTop: showInstructions ? '1px solid #e1e5e9' : 'none'
            }}>
              <div className="game-instructions" style={{
                background: 'white',
                borderLeft: 'none',
                borderRadius: '0'
              }}>
                <ul>
                  <li><strong>Clic simple</strong> : Placer/enlever un marqueur ✗</li>
                  <li><strong>Double-clic</strong> : Placer/enlever une reine ♛</li>
                  <li><strong>Objectif</strong> : Une reine par ligne, colonne et région colorée</li>
                  <li><strong>Contrainte</strong> : Les reines ne peuvent pas se toucher</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contrôles et statistiques */}
        <div className="game-controls-section">
          <GameControls
            gameState={gameState}
            onResetGame={handleReset}
            onNewGame={handleNewGame}
            onGridSizeChange={handleGridSizeChange}
            showOnlyStats={true}
          />
        </div>
      </div>
    </div>
  );
};