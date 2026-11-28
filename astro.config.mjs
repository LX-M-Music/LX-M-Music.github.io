import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://lx-m-music.github.io',
  output: 'static',
  build: {
    assets: 'assets',
  },
  compressHTML: true,
});
