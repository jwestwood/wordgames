// Synthesises the "Soft" sound theme (gentle sine clicks and chimes) as 16-bit mono WAVs.
// Original work, dedicated to the public domain (CC0). Usage: node synth-soft.mjs <outDir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const SR = 44100;
const out = process.argv[2] ?? '/tmp/soft';
mkdirSync(out, { recursive: true });
const N = (m) => 440 * 2 ** ((m - 69) / 12); // midi -> Hz
/** notes: [midi, start s, dur s, gain]; soft attack, exponential decay, faint octave partial. */
function render(notes, { attack = 0.004, partial = 0.18, tail = 0.15 } = {}) {
  const len = Math.ceil(SR * (Math.max(...notes.map(([, s, d]) => s + d)) + tail));
  const buf = new Float32Array(len);
  for (const [m, s, d, g = 1] of notes) {
    const f = N(m);
    for (let i = 0; i < SR * (d + tail); i++) {
      const t = i / SR;
      const env = Math.min(1, t / attack) * Math.exp((-5 * t) / d);
      const v = Math.sin(2 * Math.PI * f * t) + partial * Math.sin(4 * Math.PI * f * t);
      const k = Math.floor(s * SR) + i;
      if (k < len) buf[k] += g * env * v;
    }
  }
  const peak = Math.max(...buf.map(Math.abs)) || 1;
  const pcm = Buffer.alloc(44 + len * 2);
  pcm.write('RIFF', 0);
  pcm.writeUInt32LE(36 + len * 2, 4);
  pcm.write('WAVEfmt ', 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28);
  pcm.writeUInt16LE(2, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write('data', 36);
  pcm.writeUInt32LE(len * 2, 40);
  for (let i = 0; i < len; i++)
    pcm.writeInt16LE(Math.round((buf[i] / peak) * 0.7 * 32767), 44 + i * 2);
  return pcm;
}
const C5 = 72;
const SOUNDS = {
  tap: [[[C5 + 7, 0, 0.05]], { partial: 0.05 }],
  button: [[[C5, 0, 0.05]], { partial: 0.05 }],
  error: [
    [
      [C5 - 5, 0, 0.12],
      [C5 - 8, 0.09, 0.18],
    ],
  ],
  success: [
    [
      [C5 + 4, 0, 0.12],
      [C5 + 7, 0.07, 0.2],
    ],
  ],
  'success-big': [
    [
      [C5 + 4, 0, 0.12],
      [C5 + 7, 0.07, 0.12],
      [C5 + 12, 0.14, 0.3],
    ],
  ],
  'success-epic': [
    [
      [C5, 0, 0.12],
      [C5 + 4, 0.07, 0.12],
      [C5 + 7, 0.14, 0.12],
      [C5 + 12, 0.21, 0.45],
    ],
  ],
  star: [
    [
      [C5 + 19, 0, 0.35, 0.8],
      [C5 + 24, 0.05, 0.4, 0.6],
    ],
  ],
  perfect: [
    [
      [C5, 0, 0.2],
      [C5 + 4, 0.1, 0.2],
      [C5 + 7, 0.2, 0.2],
      [C5 + 12, 0.3, 0.3],
      [C5 + 16, 0.42, 0.7, 0.8],
    ],
  ],
  shuffle: [
    [
      [C5 + 2, 0, 0.04],
      [C5 + 5, 0.04, 0.04],
      [C5 + 9, 0.08, 0.06],
    ],
    { partial: 0.05 },
  ],
  delete: [[[C5 - 3, 0, 0.05]], { partial: 0.05 }],
  clear: [
    [
      [C5 + 2, 0, 0.06],
      [C5 - 3, 0.05, 0.08],
    ],
  ],
  'word-land': [[[C5 + 12, 0, 0.08, 0.7]], { partial: 0.05 }],
  'already-found': [
    [
      [C5 + 2, 0, 0.1],
      [C5 + 2, 0.12, 0.12],
    ],
  ],
  'bonus-word': [
    [
      [C5 + 9, 0, 0.08, 0.85],
      [C5 + 16, 0.07, 0.2, 0.7],
    ],
  ],
  copy: [[[C5 + 9, 0, 0.08]]],
  dice: [
    [
      [C5 + 7, 0, 0.04],
      [C5 + 2, 0.05, 0.04],
      [C5 + 11, 0.1, 0.08],
    ],
    { partial: 0.05 },
  ],
  open: [
    [
      [C5 - 5, 0, 0.08],
      [C5, 0.05, 0.1],
    ],
    { partial: 0.05 },
  ],
  close: [
    [
      [C5, 0, 0.08],
      [C5 - 5, 0.05, 0.1],
    ],
    { partial: 0.05 },
  ],
};
for (const [name, [notes, o]] of Object.entries(SOUNDS))
  writeFileSync(join(out, `${name}.wav`), render(notes, o));
console.log(Object.keys(SOUNDS).length, 'sounds ->', out);
