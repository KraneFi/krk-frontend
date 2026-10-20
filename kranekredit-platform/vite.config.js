import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// npm run build        -> standard build in dist/
// npm run build:single -> one self-contained HTML file in dist-single/
export default defineConfig(({ mode }) => ({
  base: './', // relative paths so the build works on GitHub Pages or any sub-folder
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist', chunkSizeWarningLimit: 2000 },
}));
