import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = '/generationship-ankerkette/';

/**
 * GitHub Pages serves no rewrite to index.html, so a reload on a deep link
 * would 404. Shipping 404.html as a byte copy of index.html makes Pages hand
 * the SPA shell back for any unknown path.
 */
function pagesFallback(outDir) {
  return {
    name: 'ankerkette-pages-fallback',
    apply: 'build',
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'));
    },
  };
}

/**
 * The three original single-file documents still carry the only working
 * visualisations until TASK-001 has ported them. They ship with the build so
 * they are reachable on Pages instead of sitting unreferenced in the repo.
 * They are copied rather than duplicated under public/, so the repository
 * keeps one copy of each.
 */
function copyLegacy(sourceDir, outDir) {
  return {
    name: 'ankerkette-copy-legacy',
    apply: 'build',
    closeBundle() {
      const target = resolve(outDir, 'legacy');
      mkdirSync(target, { recursive: true });
      for (const file of readdirSync(resolve(sourceDir)).filter((f) => f.endsWith('.html'))) {
        copyFileSync(resolve(sourceDir, file), resolve(target, file));
      }
    },
  };
}

export default defineConfig({
  base: BASE,
  plugins: [react(), pagesFallback('dist'), copyLegacy('legacy', 'dist')],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
