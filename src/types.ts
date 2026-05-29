/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Direction = 'H' | 'V';

export interface Clue {
  id: string; // e.g., "H1", "V1"
  number: number;
  word: string;
  clueText: string;
  direction: Direction;
  startRow: number;
  startCol: number;
  length: number;
}

export interface Cell {
  row: number;
  col: number;
  correctChar: string;
  inputChar: string;
  isConfirmed: boolean;
  numberLabel?: number; // Show clue numbers like 1, 2, 3 on the start cell
  horizontalClueId?: string;
  verticalClueId?: string;
}

export interface HighScore {
  id: string;
  name: string;
  score: number;
  timeInSeconds: number;
  hintsUsed: number;
  mode: 'estandar' | 'practica';
  date: string;
}
