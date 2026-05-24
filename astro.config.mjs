import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://project-procopios.pages.dev',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
