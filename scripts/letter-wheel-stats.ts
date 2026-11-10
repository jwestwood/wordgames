// Dev script: npx vite-node scripts/letter-wheel-stats.ts [count] [version: 1|2|beta]
import { generateSeed } from '@core/random';
import { parseVersionParam } from '@core/versions';
import { LATEST } from '../src/games/letter-wheel/versions';
import { rulesFor, wordsFor } from '../src/games/letter-wheel/versions.node';

const n = Number(process.argv[2] ?? 200);
const version = parseVersionParam(process.argv[3]) ?? LATEST;
const rules = rulesFor(version);
const generatePuzzle = rules.generate;
let t = performance.now();
const dict = rules.prepare(wordsFor(version));
console.log(`version ${version}`);
console.log(
  `dictionary index: ${(performance.now() - t).toFixed(1)} ms, ${dict.targets.length} targets`,
);
const seeds = Array.from({ length: n }, (_, i) => (i < n / 2 ? `S${i}` : generateSeed()));
const rows = seeds.map((s) => {
  t = performance.now();
  const p = generatePuzzle(s, dict);
  return { s, p, ms: performance.now() - t };
});
const pass = rows.filter((r) => r.p.passed).length;
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sorted = (xs: number[]) => xs.slice().sort((a, b) => a - b);
const att = sorted(rows.map((r) => r.p.attempts));
const ms = sorted(rows.map((r) => r.ms));
const pool = sorted(rows.map((r) => r.p.pool.length));
const q = (xs: number[], f: number) => xs[Math.min(xs.length - 1, Math.floor(f * xs.length))];
console.log(`seeds ${n}, passed ${pass} (${((100 * pass) / n).toFixed(1)}%)`);
console.log(
  `attempts avg ${avg(att).toFixed(1)} median ${q(att, 0.5)} p90 ${q(att, 0.9)} max ${att.at(-1)}`,
);
console.log(
  `ms avg ${avg(ms).toFixed(1)} median ${q(ms, 0.5).toFixed(1)} p90 ${q(ms, 0.9).toFixed(1)} max ${ms.at(-1)!.toFixed(1)}`,
);
console.log(
  `pool min ${pool[0]} p25 ${q(pool, 0.25)} median ${q(pool, 0.5)} p75 ${q(pool, 0.75)} max ${pool.at(-1)}`,
);
const len: Record<number, number> = {};
rows.forEach((r) => (len[r.p.target.length] = (len[r.p.target.length] ?? 0) + 1));
console.log('target lengths', len);
const ex = generatePuzzle('K7Q2MX', dict);
const bonus =
  'bonusPool' in ex && Array.isArray((ex as { bonusPool?: string[] }).bonusPool)
    ? ` bonus=${(ex as { bonusPool: string[] }).bonusPool.length}`
    : '';
console.log(
  `example K7Q2MX: ${ex.target} required=${ex.required} pool=${ex.pool.length}${bonus} attempts=${ex.attempts}`,
);
