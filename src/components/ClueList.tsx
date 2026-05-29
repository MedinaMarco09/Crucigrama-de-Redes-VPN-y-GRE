/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clue } from '../types';
import { CheckCircle2, ChevronRight, Compass, MoveDown, MoveRight } from 'lucide-react';

interface ClueListProps {
  clues: Clue[];
  selectedClueId: string | null;
  correctClueIds: Set<string>;
  onClueClick: (id: string) => void;
}

export const ClueList: React.FC<ClueListProps> = ({
  clues,
  selectedClueId,
  correctClueIds,
  onClueClick,
}) => {
  const horizontalClues = clues.filter(c => c.direction === 'H');
  const verticalClues = clues.filter(c => c.direction === 'V');

  const renderClueGroup = (title: string, icon: React.ReactNode, group: Clue[]) => {
    const solvedCount = group.filter(c => correctClueIds.has(c.id)).length;

    return (
      <div className="flex-1 min-w-[280px] bg-slate-900/50 p-5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            {icon}
            {title}
          </h4>
          <span className="text-xs font-mono text-blue-400 font-semibold bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/30">
            {solvedCount}/{group.length} Resueltos
          </span>
        </div>

        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
          {group.map(clue => {
            const isSelected = selectedClueId === clue.id;
            const isCorrect = correctClueIds.has(clue.id);
            const isH = clue.direction === 'H';

            return (
              <div
                key={clue.id}
                onClick={() => onClueClick(clue.id)}
                className={`group p-3 rounded-lg border transition-all duration-200 cursor-pointer flex items-start gap-2.5 ${
                  isSelected
                    ? isH 
                      ? 'bg-blue-500/10 border-blue-500/50 text-slate-100 shadow-sm shadow-blue-500/5'
                      : 'bg-indigo-500/10 border-indigo-500/50 text-slate-100 shadow-sm shadow-indigo-500/5'
                    : isCorrect
                    ? 'bg-indigo-950/20 border-indigo-900/30 text-slate-300 hover:bg-indigo-950/30'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 hover:border-slate-800'
                }`}
                id={`clue-item-${clue.id}`}
              >
                {/* Number Badge */}
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                  isSelected
                    ? isH ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
                    : isCorrect
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {clue.number}
                </div>

                {/* Clue Text & Info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed transition-all ${
                    isSelected ? 'font-medium' : ''
                  }`}>
                    {clue.clueText}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-500">
                    <span className="uppercase">{clue.word.length} letras</span>
                    {isCorrect && (
                      <span className="text-blue-400 flex items-center gap-0.5 ml-auto font-sans font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Código Validado
                      </span>
                    )}
                    {!isCorrect && isSelected && (
                      <span className="text-blue-400 flex items-center gap-0.5 ml-auto font-sans">
                        <ChevronRight className="w-3.5 h-3.5 shrink-0 animate-ping" />
                        Editando...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {renderClueGroup('Pistas Horizontales', <MoveRight className="w-4 h-4 text-blue-500" />, horizontalClues)}
      {renderClueGroup('Pistas Verticales', <MoveDown className="w-4 h-4 text-indigo-500" />, verticalClues)}
    </div>
  );
};
