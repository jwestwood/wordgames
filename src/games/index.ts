export interface GameInfo {
  id: string;
  title: string;
  description: string;
  status: 'coming-soon' | 'playable';
}

export const games: GameInfo[] = [
  {
    id: 'anagram-scramble',
    title: 'Anagram Scramble',
    description: 'Unscramble the letters to find the hidden word.',
    status: 'coming-soon',
  },
];
