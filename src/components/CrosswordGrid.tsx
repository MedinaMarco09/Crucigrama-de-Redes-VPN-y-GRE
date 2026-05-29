/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Cell, Direction } from '../types';
import { motion } from 'motion/react';

interface CrosswordGridProps {
  grid: Cell[][];
  selectedCell: { row: number; col: number } | null;
  activeDirection: Direction;
  practiceMode: boolean;
  onCellSelect: (row: number, col: number) => void;
  onCellInput: (row: number, col: number, char: string) => void;
  onCellBackspace: (row: number, col: number) => void;
  onNavigate: (direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') => void;
}

export const CrosswordGrid: React.FC<CrosswordGridProps> = ({
  grid,
  selectedCell,
  activeDirection,
  practiceMode,
  onCellSelect,
  onCellInput,
  onCellBackspace,
  onNavigate,
}) => {
  
  // Detect if a cell belongs to the currently active word
  const isCellInActiveWord = (cell: Cell) => {
    if (!selectedCell) return false;
    const focusCell = grid[selectedCell.row][selectedCell.col];
    
    if (activeDirection === 'H') {
      return !!(cell.horizontalClueId && cell.horizontalClueId === focusCell.horizontalClueId);
    } else {
      return !!(cell.verticalClueId && cell.verticalClueId === focusCell.verticalClueId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const key = e.key;

    if (key === 'Backspace') {
      e.preventDefault();
      onCellBackspace(row, col);
    } else if (key.length === 1 && /[a-zA-ZñÑ]/.test(key)) {
      e.preventDefault();
      onCellInput(row, col, key.toUpperCase());
    } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      e.preventDefault();
      onNavigate(key as any);
    }
  };

  return (
    <div className="w-full flex justify-center items-center overflow-x-auto py-2 pr-1 select-none">
      <div 
        className="grid grid-cols-13 gap-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative"
        style={{
          minWidth: '280px',
          maxWidth: '560px',
          width: '100%',
          aspectRatio: '1/1',
        }}
      >
        {grid.map((rowArr, rIdx) =>
          rowArr.map((cell, cIdx) => {
            const isBlack = cell.correctChar === '';
            const isSelected = selectedCell?.row === rIdx && selectedCell?.col === cIdx;
            const inActiveWord = isCellInActiveWord(cell);
            
            // Practice mode color helpers
            const isCorrect = cell.isConfirmed || (practiceMode && cell.inputChar !== '' && cell.inputChar === cell.correctChar);
            const isIncorrect = practiceMode && cell.inputChar !== '' && cell.inputChar !== cell.correctChar;

            if (isBlack) {
              return (
                <div
                  key={`cell-${rIdx}-${cIdx}`}
                  className="bg-slate-900/30 border border-slate-950/25 rounded shadow-inner"
                  style={{ aspectRatio: '1/1' }}
                />
              );
            }

            return (
              <div
                key={`cell-${rIdx}-${cIdx}`}
                onClick={() => onCellSelect(rIdx, cIdx)}
                className={`relative rounded aspect-square flex items-center justify-center cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-500 scale-105 z-10 font-bold'
                    : inActiveWord
                    ? 'bg-blue-500/15 text-slate-100 border border-blue-500/30 font-semibold'
                    : isCorrect
                    ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/40 font-semibold'
                    : isIncorrect
                    ? 'bg-rose-950/30 text-rose-400 border border-rose-500/40'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/50 hover:bg-slate-750'
                }`}
                style={{ aspectRatio: '1/1' }}
              >
                {/* Clue Number Label if present */}
                {cell.numberLabel && (
                  <span className={`absolute top-0.5 left-0.5 text-[9px] leading-3 font-mono font-bold ${
                    isSelected 
                    ? 'text-white/80' 
                    : isCorrect 
                    ? 'text-indigo-400/80' 
                    : 'text-blue-400/80'
                  }`}>
                    {cell.numberLabel}
                  </span>
                )}

                {/* Input letter */}
                <input
                  type="text"
                  maxLength={1}
                  value={cell.inputChar}
                  onChange={() => {}} // Controlled via onKeyDown for maximum typing flow control
                  onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
                  className="w-full h-full bg-transparent text-center select-all focus:outline-none uppercase font-mono font-semibold text-sm sm:text-base cursor-pointer"
                  style={{ caretColor: 'transparent' }}
                  tabIndex={-1} // Handled sequentially
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  id={`cell-input-${rIdx}-${cIdx}`}
                />

                {/* Micro active border overlay */}
                {isSelected && (
                  <motion.div
                    layoutId="selected-ring"
                    className="absolute inset-0 border-2 border-blue-300/40 rounded animate-pulse pointer-events-none"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
