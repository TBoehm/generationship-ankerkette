import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'node:fs';
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

export default defineConfig({
  base: BASE,
  plugins: [react(), pagesFallback('dist')],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
