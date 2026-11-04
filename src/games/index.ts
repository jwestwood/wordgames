import type { GameDefinition } from '@core/registry';
import { anagramScramble } from './anagram-scramble';
import { letterWheel } from './letter-wheel';

/** Games registry: add new games here. */
export const games: GameDefinition[] = [letterWheel, anagramScramble];

export const findGame = (id: string) => games.find((g) => g.id === id);
