import type { GameDefinition } from '@core/registry';
import { anagramScramble } from './anagram-scramble';

/** Games registry: add new games here. */
export const games: GameDefinition[] = [anagramScramble];

export const findGame = (id: string) => games.find((g) => g.id === id);
