/// <reference types="vitest" />
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Content hash of all bundled word lists -> WORDLIST_VERSION (flags stale history entries). */
function wordListVersion(): string {
  const dir = fileURLToPath(new URL('./src/core/words/data', import.meta.url));
  const h = createHash('sha256');
  for (const f of readdirSync(dir).sort()) h.update(f).update(readFileSync(join(dir, f)));
  return h.digest('hex').slice(0, 8);
}

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@core': '/src/core' } },
  define: { __WORDLIST_VERSION__: JSON.stringify(wordListVersion()) },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
