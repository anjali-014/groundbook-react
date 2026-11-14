import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GroundBook's screens and their backend, entirely in the browser.
//   npm run dev       the app at http://localhost:5199
//   npm run build     the static files, in dist/
export default defineConfig({
  plugins: [react()],
  server: { port: 5199 },
  preview: { port: 5199 },
});
