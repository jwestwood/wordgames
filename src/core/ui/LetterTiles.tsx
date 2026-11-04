import { Tile } from './Tile';
import type { TileState } from './logic';

export interface LetterTilesProps {
  letters: string;
  states?: TileState[];
  size?: 'sm' | 'md' | 'lg';
}

/** A static rack of letter tiles. */
export function LetterTiles({ letters, states, size = 'md' }: LetterTilesProps) {
  return (
    <div className="tiles" role="group" aria-label={`Letters: ${letters.toUpperCase()}`}>
      {[...letters].map((c, i) => (
        <Tile key={i} letter={c} state={states?.[i]} size={size} static />
      ))}
    </div>
  );
}
