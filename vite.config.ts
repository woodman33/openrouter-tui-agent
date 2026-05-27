import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/companion/client',
  build: {
    outDir: '../../../dist/companion-client',
    emptyOutDir: true,
  },
});
