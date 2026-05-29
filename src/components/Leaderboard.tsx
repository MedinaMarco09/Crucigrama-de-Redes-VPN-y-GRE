/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { HighScore } from '../types';
import { Award, Trash2, Shield, Calendar, Clock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface LeaderboardProps {
  scores: HighScore[];
  onClear: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ scores, onClear }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'estandar' | 'practica'>('all');

  const filteredScores = scores
    .filter(s => filterMode === 'all' || s.mode === filterMode)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="leaderboard-panel" className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-850 p-6 shadow-xl relative overflow-hidden">
      {/* Decorative pulse line to simulate connection */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/0 via-blue-400 to-blue-500/0 animate-pulse" />

      <div className="flex items-center justify-between mb-6">
        <h3 className="font-sans text-xl font-bold text-blue-400 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-400 animate-bounce" id="award-icon" />
          Tabla de Puntuaciones
        </h3>
        
        {scores.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/20 px-2 py-1 rounded border border-red-900/30 hover:border-red-500/50 transition-all duration-200 cursor-pointer"
            title="Borrar todas las puntuaciones"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpiar Historial
          </button>
        )}
      </div>

      {/* FILTER BUTTONS */}
      <div className="flex border-b border-slate-800 mb-4 pb-2 text-xs gap-2">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-full font-medium transition-all ${
            filterMode === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-400 hover:text-slate-200 bg-slate-850'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterMode('estandar')}
          className={`px-3 py-1.5 rounded-full font-medium transition-all ${
            filterMode === 'estandar'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-400 hover:text-slate-200 bg-slate-850'
          }`}
        >
          Estándar (Sin ayuda)
        </button>
        <button
          onClick={() => setFilterMode('practica')}
          className={`px-3 py-1.5 rounded-full font-medium transition-all ${
            filterMode === 'practica'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-400 hover:text-slate-200 bg-slate-850'
          }`}
        >
          Práctica (Respuestas en vivo)
        </button>
      </div>

      {filteredScores.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          <Shield className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-500" />
          No hay registros en esta categoría aún.
          <br />¡Sé el primero en establecer el túnel hoy!
        </div>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {filteredScores.map((score, index) => {
            const isTop3 = index < 3;
            const medalColors = ['from-blue-400 to-indigo-600', 'from-slate-300 to-slate-500', 'from-blue-650 to-indigo-850'];
            
            return (
              <motion.div
                key={score.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  index === 0 
                  ? 'bg-blue-500/10 border-blue-500/30 shadow-sm' 
                  : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Position Badge */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    isTop3 
                      ? `bg-gradient-to-br ${medalColors[index]} text-white` 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Name and Tag */}
                  <div>
                    <div className="font-medium text-slate-200 flex items-center gap-2">
                      <span className="truncate max-w-[120px]">{score.name}</span>
                      {score.mode === 'practica' ? (
                        <span className="text-[10px] uppercase tracking-wider bg-purple-950/40 text-purple-400 px-1.5 py-0.5 rounded border border-purple-900/30">
                          Práctica
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider bg-blue-950/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900/30">
                          Estándar
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {formatTime(score.timeInSeconds)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> {score.hintsUsed} ayudas</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-slate-600"><Calendar className="w-3 h-3" /> {formatDate(score.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-md font-bold text-blue-400 font-mono">
                    {score.score} pts
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* FOOTER METER DECORATION */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-600 font-mono">
        <span>SECURITY ENCLAVE INTEGRITY: SECURE</span>
        <span>GRE_TUNNEL_STATE: ALIVE</span>
      </div>
    </div>
  );
};
