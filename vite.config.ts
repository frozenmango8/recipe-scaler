import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the site from /recipe-scaler/, not the domain root.
  base: '/recipe-scaler/',
});
