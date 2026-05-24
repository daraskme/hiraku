import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://hiraku-5cb.pages.dev',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
});
