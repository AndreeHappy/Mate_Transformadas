import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://AndreeHappy.github.io',
  base: '/Mate_Transformadas',
  integrations: [tailwind()],
  output: 'static',
  devToolbar: {
    enabled: false
  }
});
