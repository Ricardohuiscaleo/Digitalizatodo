import { defineConfig } from 'astro/config';

import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'static',

  build: {
    assets: 'assets',
    inlineStylesheets: 'always'
  },

  vite: {
    optimizeDeps: {
      include: ['three']
    },
    build: {
      cssCodeSplit: false,
      minify: 'esbuild'
    }
  },

  integrations: [tailwind()]
});