export function LetterTiles({ letters }: { letters: string }) {
  return (
    <div className="tiles">
      {[...letters].map((c, i) => (
        <span key={i} className="tile">
          {c.toUpperCase()}
        </span>
      ))}
    </div>
  );
}
