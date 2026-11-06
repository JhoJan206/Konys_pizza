import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, las llamadas a /api se reenvían al servidor Express local
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
