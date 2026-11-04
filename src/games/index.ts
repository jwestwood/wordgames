import type { GameDefinition } from '@core/registry';
import { letterWheel } from './letter-wheel';

/** Games registry: add new games here. */
export const games: GameDefinition[] = [letterWheel];

export const findGame = (id: string) => games.find((g) => g.id === id);
