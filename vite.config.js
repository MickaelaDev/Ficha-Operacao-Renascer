import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' usa caminhos relativos, então o build funciona em
// https://usuario.github.io/qualquer-repo/ sem configuração extra.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
