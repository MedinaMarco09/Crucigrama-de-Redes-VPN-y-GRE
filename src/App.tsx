/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Cell, Direction, HighScore } from './types';
import { COLS, ROWS, CLUES } from './constants';
import { CrosswordGrid } from './components/CrosswordGrid';
import { ClueList } from './components/ClueList';
import { Leaderboard } from './components/Leaderboard';
import { audio } from './components/AudioEngine';
import { 
  Play, 
  RotateCcw, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  ChevronRight, 
  Zap, 
  Clock, 
  Activity, 
  Database, 
  Cpu, 
  Award, 
  Sparkles, 
  RefreshCw,
  ListFilter,
  CheckCircle2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Game Setup State
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState<'estandar' | 'practica'>('estandar');
  const [isGameActive, setIsGameActive] = useState(false);
  
  // Active Game State
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [activeDirection, setActiveDirection] = useState<Direction>('H');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [correctClueIds, setCorrectClueIds] = useState<Set<string>>(new Set());
  
  // Game Feedback / Verification
  const [isGameCompleted, setIsGameCompleted] = useState(false);
  const [showIncompleteAlert, setShowIncompleteAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  // Leaderboard lists
  const [leaderboard, setLeaderboard] = useState<HighScore[]>([]);

  // Refs for tracking timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Real-time grid completeness helper for header HUD progress
  const calculateProgressPercent = () => {
    if (!grid || grid.length === 0) return 0;
    let totalPlayable = 0;
    let correctMatches = 0;
    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.correctChar !== '') {
          totalPlayable++;
          if (cell.inputChar === cell.correctChar) {
            correctMatches++;
          }
        }
      });
    });
    if (totalPlayable === 0) return 0;
    return Math.round((correctMatches / totalPlayable) * 100);
  };

  // --- Initial Setup and Highscores Loading ---
  useEffect(() => {
    // Load leaderboard
    const stored = localStorage.getItem('redes_crossword_highscores');
    if (stored) {
      try {
        setLeaderboard(JSON.parse(stored));
      } catch (e) {
        console.error("No se pudieron cargar las puntuaciones: ", e);
      }
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (isGameActive && !isPaused && !isGameCompleted) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isGameActive, isPaused, isGameCompleted]);

  // Audio Toggle Controller
  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    audio.toggleSound(newState);
    audio.playClick(900, 0.08);
  };

  // --- Initializing New Game Grid ---
  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    audio.playClick(1000, 0.1);

    const initialName = playerName.trim() || 'Ingeniero de Redes';
    setPlayerName(initialName);
    
    // Build initial blank crossword cells
    const newGrid: Cell[][] = Array.from({ length: ROWS }, (_, r) =>
      Array.from({ length: COLS }, (_, c) => ({
        row: r,
        col: c,
        correctChar: '',
        inputChar: '',
        isConfirmed: false,
      }))
    );

    // Map each clue to cells
    CLUES.forEach(clue => {
      for (let i = 0; i < clue.length; i++) {
        const r = clue.startRow + (clue.direction === 'V' ? i : 0);
        const c = clue.startCol + (clue.direction === 'H' ? i : 0);
        
        const cell = newGrid[r][c];
        cell.correctChar = clue.word[i];
        
        // Label the starting cell
        if (i === 0) {
          cell.numberLabel = clue.number;
        }

        if (clue.direction === 'H') {
          cell.horizontalClueId = clue.id;
        } else {
          cell.verticalClueId = clue.id;
        }
      }
    });

    setGrid(newGrid);
    setTimerSeconds(0);
    setHintsUsed(0);
    setCorrectClueIds(new Set());
    setIsGameCompleted(false);
    setIsPaused(false);
    
    // Select first cell of H1
    setSelectedCell({ row: 1, col: 1 });
    setActiveDirection('H');
    setIsGameActive(true);
  };

  // Check which words are currently complete and correct
  const checkClueCorrectness = (currGrid: Cell[][], revealCheck = false) => {
    const newlyCorrect = new Set<string>();

    CLUES.forEach(clue => {
      let wordCorrect = true;
      for (let i = 0; i < clue.length; i++) {
        const r = clue.startRow + (clue.direction === 'V' ? i : 0);
        const c = clue.startCol + (clue.direction === 'H' ? i : 0);
        const cell = currGrid[r][c];
        
        if (cell.inputChar !== cell.correctChar) {
          wordCorrect = false;
          break;
        }
      }

      if (wordCorrect) {
        newlyCorrect.add(clue.id);
      }
    });

    // Sound chime if a word just got solved
    if (newlyCorrect.size > correctClueIds.size && !revealCheck) {
      audio.playWordMatch();
    }

    setCorrectClueIds(newlyCorrect);

    // Check if the whole crossword is complete (all 12 words correct)
    if (newlyCorrect.size === CLUES.length && !isGameCompleted) {
      handleCompleteGame(currGrid);
    }
  };

  // --- GAME COMPLETION ---
  const handleCompleteGame = (currGrid: Cell[][]) => {
    setIsGameCompleted(true);
    audio.playComplete();

    // Mark all cells as confirmed
    const finalGrid = currGrid.map(row => 
      row.map(cell => ({ ...cell, isConfirmed: cell.correctChar !== '' }))
    );
    setGrid(finalGrid);

    // Calculate score
    // Base: 2000 points. Speed bonus: up to 1000 points (exponentially decaying). Hint penalties: -100 per hint.
    const baseScore = 2000;
    const speedBonus = Math.max(0, 1000 - Math.floor(timerSeconds * 1.5));
    const modeBonus = gameMode === 'estandar' ? 500 : 0; // standard mode is harder
    const penalty = hintsUsed * 100;
    const finalSum = Math.max(100, baseScore + speedBonus + modeBonus - penalty);
    setFinalScore(finalSum);

    // Persist scores
    const entry: HighScore = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      name: playerName || 'Ingeniero Anónimo',
      score: finalSum,
      timeInSeconds: timerSeconds,
      hintsUsed,
      mode: gameMode,
      date: new Date().toISOString(),
    };

    const newLeaderboard = [entry, ...leaderboard];
    setLeaderboard(newLeaderboard);
    localStorage.setItem('redes_crossword_highscores', JSON.stringify(newLeaderboard));
  };

  // --- PLAYBACK CONTROLS ---
  const handleSelectCell = (row: number, col: number) => {
    audio.playClick(720, 0.04);
    if (selectedCell?.row === row && selectedCell?.col === col) {
      // Toggle direction on double selecting
      setActiveDirection(prev => prev === 'H' ? 'V' : 'H');
    } else {
      setSelectedCell({ row, col });
      
      // Smart: Set active direction based on what options are available at this cell
      const cell = grid[row][col];
      if (cell.horizontalClueId && !cell.verticalClueId) {
        setActiveDirection('H');
      } else if (!cell.horizontalClueId && cell.verticalClueId) {
        setActiveDirection('V');
      }
    }
  };

  const handleClueClick = (clueId: string) => {
    audio.playClick(650, 0.05);
    const clue = CLUES.find(c => c.id === clueId);
    if (clue) {
      setSelectedCell({ row: clue.startRow, col: clue.startCol });
      setActiveDirection(clue.direction);
    }
  };

  // Advanced: Keyboard typing navigation
  const handleCellInput = (row: number, col: number, char: string) => {
    audio.playInput();
    const newGrid = [...grid.map(r => [...r])];
    newGrid[row][col].inputChar = char;
    setGrid(newGrid);

    // Real-time verification checks
    checkClueCorrectness(newGrid);

    // Auto Advance to next cell in current word direction
    advanceCursor(row, col, 1);
  };

  const handleCellBackspace = (row: number, col: number) => {
    audio.playClick(500, 0.05);
    const newGrid = [...grid.map(r => [...r])];
    
    // Clear current cell first. If already empty, we will retreat and clear previous.
    if (newGrid[row][col].inputChar === '') {
      retreatCursor(row, col);
    } else {
      newGrid[row][col].inputChar = '';
      setGrid(newGrid);
      checkClueCorrectness(newGrid);
    }
  };

  const advanceCursor = (row: number, col: number, step: number = 1) => {
    const focusCell = grid[row][col];
    const activeClue = CLUES.find(c => 
      activeDirection === 'H' 
        ? c.id === focusCell.horizontalClueId 
        : c.id === focusCell.verticalClueId
    );

    if (!activeClue) return;

    const letterIndex = activeDirection === 'H' 
      ? col - activeClue.startCol 
      : row - activeClue.startRow;

    if (letterIndex < activeClue.length - 1) {
      // Still inside word boundaries, advance
      const nextRow = activeClue.startRow + (activeDirection === 'V' ? letterIndex + 1 : 0);
      const nextCol = activeClue.startCol + (activeDirection === 'H' ? letterIndex + 1 : 0);
      setSelectedCell({ row: nextRow, col: nextCol });
    }
  };

  const retreatCursor = (row: number, col: number) => {
    const focusCell = grid[row][col];
    const activeClue = CLUES.find(c => 
      activeDirection === 'H' 
        ? c.id === focusCell.horizontalClueId 
        : c.id === focusCell.verticalClueId
    );

    if (!activeClue) return;

    const letterIndex = activeDirection === 'H' 
      ? col - activeClue.startCol 
      : row - activeClue.startRow;

    if (letterIndex > 0) {
      // Move backwards
      const prevRow = activeClue.startRow + (activeDirection === 'V' ? letterIndex - 1 : 0);
      const prevCol = activeClue.startCol + (activeDirection === 'H' ? letterIndex - 1 : 0);
      
      const newGrid = [...grid.map(r => [...r])];
      newGrid[prevRow][prevCol].inputChar = ''; // clear it
      setGrid(newGrid);
      setSelectedCell({ row: prevRow, col: prevCol });
      checkClueCorrectness(newGrid);
    }
  };

  // Navigate using arrow keys
  const handleGridNavigation = (arrowKey: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') => {
    if (!selectedCell) return;
    let nextRow = selectedCell.row;
    let nextCol = selectedCell.col;

    switch (arrowKey) {
      case 'ArrowUp':
        nextRow = Math.max(0, selectedCell.row - 1);
        break;
      case 'ArrowDown':
        nextRow = Math.min(ROWS - 1, selectedCell.row + 1);
        break;
      case 'ArrowLeft':
        nextCol = Math.max(0, selectedCell.col - 1);
        break;
      case 'ArrowRight':
        nextCol = Math.min(COLS - 1, selectedCell.col + 1);
        break;
    }

    // Only allow selecting if the target cell is playable (not a black cell / empty string)
    if (grid[nextRow] && grid[nextRow][nextCol] && grid[nextRow][nextCol].correctChar !== '') {
      audio.playClick(680, 0.03);
      setSelectedCell({ row: nextRow, col: nextCol });
    }
  };

  // --- MANUAL VERIFICATION (Standard Mode) ---
  const handleVerifyGridManual = () => {
    let wrongLetters = 0;
    let emptyLetters = 0;

    grid.forEach(row => {
      row.forEach(cell => {
        if (cell.correctChar !== '') {
          if (cell.inputChar === '') {
            emptyLetters++;
          } else if (cell.inputChar !== cell.correctChar) {
            wrongLetters++;
          }
        }
      });
    });

    if (wrongLetters === 0 && emptyLetters === 0) {
      checkClueCorrectness(grid);
    } else if (wrongLetters === 0) {
      audio.playError();
      setAlertMessage(`Hacia adelante ingeniero. Todo lo ingresado está correcto, pero aún quedan de rellenar ${emptyLetters} letras.`);
      setShowIncompleteAlert(true);
    } else {
      audio.playError();
      setAlertMessage(`¡Error en la modulación del túnel! Tienes ${wrongLetters} letras que no coinciden con las especificaciones RFC de VPN y GRE. Revísalas.`);
      setShowIncompleteAlert(true);
    }
  };

  // --- CHEAT / HELPER ACTIONS ---
  const revealLetterHint = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const targetCell = grid[row][col];
    
    if (targetCell.inputChar === targetCell.correctChar) return; // already correct

    audio.playHint();
    const newGrid = [...grid.map(r => [...r])];
    newGrid[row][col].inputChar = targetCell.correctChar;
    setGrid(newGrid);
    setHintsUsed(prev => prev + 1);
    checkClueCorrectness(newGrid, true);
  };

  const revealWordHint = () => {
    if (!selectedCell) return;
    const focusCell = grid[selectedCell.row][selectedCell.col];
    
    // Find active word
    const activeClue = CLUES.find(c => 
      activeDirection === 'H' 
        ? c.id === focusCell.horizontalClueId 
        : c.id === focusCell.verticalClueId
    );

    if (!activeClue) return;

    audio.playHint();
    const newGrid = [...grid.map(r => [...r])];
    for (let i = 0; i < activeClue.length; i++) {
      const r = activeClue.startRow + (activeClue.direction === 'V' ? i : 0);
      const c = activeClue.startCol + (activeClue.direction === 'H' ? i : 0);
      newGrid[r][c].inputChar = activeClue.word[i];
    }

    setGrid(newGrid);
    setHintsUsed(prev => prev + 3); // 3 hits penalty
    checkClueCorrectness(newGrid, true);
  };

  const handleResetBoard = () => {
    if (window.confirm("¿Seguro que deseas reiniciar el progreso de este crucigrama? Perderás el tiempo de resolución actual.")) {
      audio.playError();
      const resetGrid = grid.map(row => 
        row.map(cell => ({ ...cell, inputChar: '', isConfirmed: false }))
      );
      setGrid(resetGrid);
      setTimerSeconds(0);
      setHintsUsed(0);
      setCorrectClueIds(new Set());
    }
  };

  const clearLeaderboard = () => {
    if (window.confirm("¿Seguro que deseas reiniciar de manera irrevocable la tabla de posiciones local?")) {
      audio.playClick(440, 0.15);
      setLeaderboard([]);
      localStorage.removeItem('redes_crossword_highscores');
    }
  };

  // Helper formatting elapsed seconds
  const formatTimer = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Get active selected clue info for display
  const getSelectedClueInfo = () => {
    if (!selectedCell) return null;
    const focusCell = grid[selectedCell.row][selectedCell.col];
    const activeId = activeDirection === 'H' ? focusCell.horizontalClueId : focusCell.verticalClueId;
    return CLUES.find(c => c.id === activeId) || null;
  };

  const activeClue = getSelectedClueInfo();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-all duration-300 antialiased selection:bg-blue-600 selection:text-white">
      
      {/* HEADER SECTION */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 px-8 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-tight uppercase">NetCross: VPN & GRE Edition</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Técnicas de Tunelización Avanzadas</p>
          </div>
        </div>

        {/* CONTROLS & HUD SUMMARY */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Jugador Actual</p>
              <p id="playerNameDisplay" className="text-sm font-semibold text-blue-400 max-w-[140px] truncate">
                {playerName || 'Ingeniero_Redes_01'}
              </p>
            </div>
            
            <div className="h-10 w-px bg-slate-800"></div>
            
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Progreso</span>
              <span id="progressText" className="text-xl font-mono font-bold text-blue-500">
                {calculateProgressPercent()}%
              </span>
            </div>
          </div>

          <div className="h-10 w-px bg-slate-800 hidden md:block"></div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowTutorial(true)}
              className="p-2 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition"
              title="Manual Teórico de VPN y GRE"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
            </button>
            <button 
              onClick={handleToggleSound}
              className="p-2 cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition"
              title={soundEnabled ? "Mutear Sintetizador" : "Activar Sintetizador"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            
            {isGameActive && (
              <button
                onClick={() => setIsGameActive(false)}
                className="text-xs font-semibold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-350 px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Salir
              </button>
            )}
          </div>
        </div>
      </header>

      {/* CORE DISPLAY MAIN BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-start">
        
        {/* VIEW 1: HOME SETUP SCREEN */}
        {!isGameActive && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto py-4">
            
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <h2 className="text-3xl font-extrabold text-slate-100 font-sans tracking-tight leading-snug">
                  Prueba tus Habilidades en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Seguridad Cisco y Túneles</span>
                </h2>
                
                <p className="text-slate-400 text-sm leading-relaxed">
                  ¿Puedes diferenciar la encapsulación multicast de <strong className="text-blue-400">GRE</strong> de la robusta criptografía de <strong className="text-indigo-400">IPSec</strong>? Resuelve este crucigrama interactivo diseñado para estudiantes y profesionales para aprender protocolos, tamaños de paquete (MTU) y direccionamiento en VPNs.
                </p>

                {/* GAME PREFERENCES FORM */}
                <form onSubmit={handleStartGame} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Identificador del Ingeniero (Jugador)
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value.slice(0, 20))}
                      placeholder="Ej. Admin_Cisco o Ingeniero_VPN"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 text-slate-100 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:outline-none transition font-sans"
                      maxLength={20}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* OPTION 1: STANDARD */}
                    <div 
                      onClick={() => setGameMode('estandar')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        gameMode === 'estandar' 
                          ? 'bg-blue-950/20 border-blue-500/80 shadow-md shadow-blue-500/5 text-slate-100' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">Modo Estándar</span>
                        <Lock className={`w-4 h-4 ${gameMode === 'estandar' ? 'text-blue-400' : 'text-slate-600'}`} />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Validación manual. Los errores se revelan únicamente al clicar en "Verificar Tablero" o al usar ayudas externas.
                      </p>
                    </div>

                    {/* OPTION 2: PRACTICE */}
                    <div 
                      onClick={() => setGameMode('practica')}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        gameMode === 'practica' 
                          ? 'bg-indigo-950/20 border-indigo-500/80 shadow-md shadow-indigo-500/5 text-slate-100' 
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm">Modo Práctica</span>
                        <Sparkles className={`w-4 h-4 ${gameMode === 'practica' ? 'text-indigo-400' : 'text-slate-600'}`} />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Validación en tiempo real. Los caracteres se pintan en <span className="text-indigo-400 font-bold">azul cielo (correcto)</span> o <span className="text-rose-450 font-bold">rojo (incorrecto)</span> inmediatamente al ingresarlos.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold font-sans py-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 active:translate-y-[1px]"
                  >
                    Establecer Túnel e Iniciar <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* STUDY MANUAL SNEAK-PEEK */}
              <div className="p-4 bg-slate-900/30 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-450">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  ¿Necesitas un repaso de red antes de jugar?
                </span>
                <button
                  onClick={() => setShowTutorial(true)}
                  className="text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Abrir Guía Teórica
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 col-span-1">
              {/* PERSISTENT LEADERBOARD RENDERED DIRECTLY TO INCREASE VALUE */}
              <Leaderboard scores={leaderboard} onClear={clearLeaderboard} />
            </div>

          </div>
        )}

         {/* VIEW 2: ACTIVE GAME PLAYBACK */}
        {isGameActive && (
          <div className="space-y-6">
            
            {/* STATUS DASHBOARD */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="space-y-0.5 pl-2 border-l border-blue-500/30">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Ingeniero Activo</span>
                <p className="text-base font-bold text-slate-200 truncate">{playerName}</p>
              </div>

              <div className="space-y-0.5 pl-2 border-l border-blue-500/30">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Tiempo de Conexión</span>
                <p className="text-base font-mono font-bold text-blue-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  {formatTimer(timerSeconds)}
                </p>
              </div>

              <div className="space-y-0.5 pl-2 border-l border-blue-500/30">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Créditos de Ayuda</span>
                <p className="text-base font-sans font-bold text-slate-200">
                  {hintsUsed} asistencias
                </p>
              </div>

              <div className="space-y-0.5 pl-2 border-l border-blue-500/30">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Modo de Protocolo</span>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${
                  gameMode === 'practica' 
                    ? 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/30' 
                    : 'bg-blue-950/50 text-blue-400 border border-blue-900/30'
                }`}>
                  {gameMode === 'practica' ? 'Práctica (En Vivo)' : 'Estándar'}
                </span>
              </div>
            </div>

            {/* CONVENIENT INTERACTIVE HELP CLUE BANNER */}
            <div className="relative min-h-[72px] bg-blue-955/10 border border-blue-500/25 p-4 rounded-xl flex items-center gap-3 shadow-inner">
              <div className="p-1 px-2.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold select-none shrink-0 font-mono">
                {activeClue ? activeClue.id : 'N/A'}
              </div>
              <div className="flex-1 min-w-0">
                {activeClue ? (
                  <>
                    <p className="text-xs text-slate-400 font-mono mb-0.5 uppercase tracking-wide">
                      {activeClue.direction === 'H' ? 'Horizontal' : 'Vertical'} • {activeClue.word.length} letras • Casilla {activeClue.number}
                    </p>
                    <p className="text-sm font-semibold text-slate-105 tracking-tight leading-snug">
                      {activeClue.clueText}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 italic font-medium">
                    Selecciona una casilla del crucigrama para revelar su pista de red asociada aquí.
                  </p>
                )}
              </div>
            </div>

            {/* BOARD MAIN GRID AREA + CHEAT TOOLS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* CROSSWORD CONTAINER */}
              <div className="lg:col-span-6 col-span-1 flex flex-col items-center">
                <CrosswordGrid
                  grid={grid}
                  selectedCell={selectedCell}
                  activeDirection={activeDirection}
                  practiceMode={gameMode === 'practica'}
                  onCellSelect={handleSelectCell}
                  onCellInput={handleCellInput}
                  onCellBackspace={handleCellBackspace}
                  onNavigate={handleGridNavigation}
                />

                {/* WORD BANK / OPTIONS */}
                <div className="w-full mt-6 p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                  <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <ListFilter className="w-3 h-3" /> Banco de Palabras (Opciones)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(CLUES.map(c => c.word))).sort().map(word => {
                      const isFound = Array.from(correctClueIds).some(cid => CLUES.find(c => c.id === cid)?.word === word);
                      return (
                        <span 
                          key={word}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all border ${
                            isFound 
                              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 line-through opacity-40' 
                              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {word}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* BOARD ACTION BAR */}
                <div className="w-full flex-wrap gap-2.5 flex justify-center items-center mt-4">
                  {gameMode === 'estandar' && (
                    <button
                      onClick={handleVerifyGridManual}
                      className="px-4 py-2 border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl font-bold font-sans text-xs transition duration-155 flex items-center gap-1.5 shadow-md cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Verificar Tablero
                    </button>
                  )}
                  <button
                    onClick={revealLetterHint}
                    className="px-4 py-2 border border-slate-800 hover:border-blue-800 hover:bg-blue-950/20 text-slate-450 hover:text-blue-300 rounded-xl text-xs font-medium transition duration-150 flex items-center gap-1 cursor-pointer"
                    title="Revelar letra seleccionada actualmente (-100 pts)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" /> Letra (-100p)
                  </button>
                  <button
                    onClick={revealWordHint}
                    className="px-4 py-2 border border-slate-800 hover:border-blue-800 hover:bg-blue-950/20 text-slate-455 hover:text-blue-300 rounded-xl text-xs font-medium transition duration-150 flex items-center gap-1 cursor-pointer"
                    title="Revelar palabra completa (-300 pts)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-yellow-500 animate-pulse" /> Palabra (-300p)
                  </button>
                  <button
                    onClick={handleResetBoard}
                    className="px-4 py-2 border border-rose-950/25 bg-rose-950/10 hover:bg-rose-950/35 border-rose-900/30 text-rose-400 rounded-xl text-xs transition duration-150 flex items-center gap-1 cursor-pointer ml-auto"
                    title="Vaciar todo el tablero"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
                  </button>
                </div>
              </div>

              {/* LIST OF CLUES */}
              <div className="lg:col-span-6 col-span-1 space-y-4">
                <ClueList
                  clues={CLUES}
                  selectedClueId={activeClue ? activeClue.id : null}
                  correctClueIds={correctClueIds}
                  onClueClick={handleClueClick}
                />
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER METRICS */}
      <footer className="border-t border-slate-900 py-6 text-center select-none bg-slate-950 px-6">
        <p className="text-xs text-slate-600 font-mono">
          DESARROLLADO POR MARCOMG • PROTOCOLO DE INSPECCIÓN: VPN / TUNEL GRE CONTROLS
        </p>
        <p className="text-[10px] text-slate-700 font-mono mt-1">
         • Versión React 19 CISCO LABS
        </p>
      </footer>

      {/* MODAL 1: SUCCESS CELEBRATION MODAL */}
      <AnimatePresence>
        {isGameCompleted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              className="bg-slate-900 border border-blue-500/40 p-6 sm:p-8 rounded-3xl max-w-lg w-full text-center shadow-2xl relative overflow-hidden my-auto"
            >
              {/* Particle backgrounds */}
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-550" />
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse" />
              
              <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-bounce" />

              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight font-sans">
                ¡CONECTIVIDAD EXITOSA!
              </h2>
              <p className="text-blue-400 font-mono text-sm uppercase tracking-widest mt-1">
                TÚNEL DE RED TOTALMENTE INFILTRADO & ENCRIPTADO
              </p>

              <div className="my-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left space-y-3 font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500 text-xs">INGENIERO DE PROTOCOLO:</span>
                  <span className="text-slate-200 font-sans font-bold">{playerName || 'Ingeniero_Redes_01'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500 text-xs">TIEMPO TRANSCURRIDO:</span>
                  <span className="text-blue-400 font-bold">{formatTimer(timerSeconds)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500 text-xs">AYUDAS EMPLEADAS:</span>
                  <span className="text-slate-350 font-bold">{hintsUsed} asistencias</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-500 text-xs">MODALIDAD ELEGIDA:</span>
                  <span className="text-slate-350 font-bold uppercase">{gameMode}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400 text-sm font-bold">PUNTAJE FINAL:</span>
                  <span className="text-blue-450 text-xl font-bold">{finalScore} pts</span>
                </div>
              </div>

              <div className="p-4 bg-blue-955/20 border border-blue-900/30 rounded-2xl text-xs text-blue-400 leading-relaxed mb-6 text-left flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                <span>
                  <strong>Certificación Simulada:</strong> Has alineado perfectamente todos los campos de direccionamiento, overhead de cabecera GRE y políticas de autenticidad IPSec. ¡Tus habilidades en túneles avanzados son dignas de mención!
                </span>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsGameActive(false);
                    setIsGameCompleted(false);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold font-sans py-3 rounded-xl transition cursor-pointer active:translate-y-[1px] text-sm"
                >
                  Volver al Menú Principal
                </button>
                <button
                  onClick={handleStartGame}
                  className="px-5 py-3 border border-slate-700 hover:border-slate-500 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded-xl transition text-sm cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDUCATION TUTORIAL ON GRE & VPN */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-2xl w-full relative overflow-hidden my-auto"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-600/60" />
              
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-bold font-sans text-slate-100">Guía Técnica de Túneles Redes: VPN e IPSec over GRE</h3>
              </div>

              <div className="space-y-4 text-sm text-slate-300 leading-relaxed overflow-y-auto max-h-[450px] pr-2 scrollbar-thin scrollbar-thumb-blue-600">
                
                {/* GRE SECTION */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1.5">
                  <h4 className="font-bold text-blue-400 font-mono text-xs uppercase tracking-wide">1. ¿Qué es un Túnel GRE (Generic Routing Encapsulation)?</h4>
                  <p className="text-xs">
                    GRE es un protocolo diseñado por Cisco que sirve para **encapsular** paquetes de cualquier protocolo de Capa 3 (IP, IPX, AppleTalk) dentro de paquetes IP portadores. 
                  </p>
                  <p className="text-xs font-semibold text-blue-450">
                    Propiedad Única: Admite tráfico de tipo MULTICAST (como saludos de enrutamiento OSPF o EIGRP). Sin embargo, GRE NO CIFRA el tráfico. Cualquiera en el trayecto puede leer la carga útil.
                  </p>
                </div>

                {/* OVERHEAD SECTION */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1.5">
                  <h4 className="font-bold text-blue-400 font-mono text-xs uppercase tracking-wide">2. El Problema del Tamaño de Paquete (MTU y Overhead)</h4>
                  <p className="text-xs">
                    Al encapsular un paquete dentro de otro, se añaden nuevas cabeceras IP y GRE supplémentaires (20 bytes de cabecera IP externa + 4 bytes de cabecera GRE = **24 bytes adicionales**).
                  </p>
                  <p className="text-xs font-semibold text-amber-500">
                    Esto eleva el riesgo de fragmentación si el total excede el MTU de 1500 bytes. Por ende, los administradores de red reducen el MTU de las interfaces virtuales para acomodar esta sobrecarga del encabezado.
                  </p>
                </div>

                {/* IPSEC over GRE */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1.5">
                  <h4 className="font-bold text-indigo-400 font-mono text-xs uppercase tracking-wide">3. IPSec vs. Túneles GRE</h4>
                  <p className="text-xs">
                    **IPSec** ofrece un marco increíble de seguridad con cifrado, autenticación y comprobación de integridad. No obstante, en modo túnel normal, **IPSec no soporta multicast** ni enrutamiento dinámico de forma nativa.
                  </p>
                  <p className="text-xs">
                    Para resolver esto, los ingenieros combinan ambos mundos: **IPSec over GRE**. Los paquetes dinámicos entran al túnel GRE y este túnel es luego cifrado completamente por IPSec.
                  </p>
                </div>

                {/* KEYWORDS */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 space-y-1.5 font-mono text-xs">
                  <h4 className="font-bold text-blue-500 tracking-wider uppercase text-[10px]">Términos Clave del Crucigrama</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-455">
                    <div>• <strong>IPSEC</strong>: Seguridad y cifrado integral</div>
                    <div>• <strong>GRE</strong>: Encapsula multicast Cisco</div>
                    <div>• <strong>MTU</strong>: Límite de tamaño adaptado</div>
                    <div>• <strong>SSL</strong>: Capa de sesión en web browser</div>
                    <div>• <strong>INTEGRIDAD</strong>: Certificación sin alteración</div>
                    <div>• <strong>ESTATICA</strong>: Levantamiento manual</div>
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setShowTutorial(false)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold font-sans text-xs cursor-pointer transition active:translate-y-[1px]"
                >
                  Entendido, Volver al Crucigrama
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ALERT MODAL FOR INCOMPLETE OR INCORRECT SUBMISSIONS */}
      <AnimatePresence>
        {showIncompleteAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 15, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full text-center"
            >
              <Activity className="w-10 h-10 text-rose-500 mx-auto mb-3 animate-spinPointer duration-1000" />
              <h3 className="text-lg font-bold text-slate-100 font-sans mb-1.5 uppercase tracking-wide">VERIFICACIÓN FALLIDA</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {alertMessage}
              </p>
              <button
                onClick={() => setShowIncompleteAlert(false)}
                className="w-full bg-slate-800 hover:bg-slate-755 text-slate-300 border border-slate-700 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar Diagnóstico
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TEAM WATERMARK (Visible only on home screen) */}
      {!isGameActive && (
        <div 
          id="team-watermark"
          className="fixed bottom-3 right-4 z-10 pointer-events-none select-none text-right opacity-25 hover:opacity-100 transition-opacity duration-300 hidden sm:block"
          style={{ contentVisibility: 'auto' }}
        >
          <span className="font-mono text-[8px] text-blue-500 uppercase tracking-widest font-bold block mb-0.5">
            Integrantes / Diseñado por:
          </span>
          <div className="font-sans text-xs font-black text-slate-100 tracking-wider">
            Equipo slim
          </div>
          <div className="font-mono text-[10px] text-slate-400 space-y-0.5 mt-0.5 leading-tight">
            <div>Camacho Martinez Kassandra Judith</div>
            <div>Marquez Aguilar Soren Cristobal</div>
            <div>Medina Garciglia Marco Antonio</div>
            <div>De la Torre Sui Qui Vìctor Josè</div>
          </div>
        </div>
      )}

    </div>
  );
}
