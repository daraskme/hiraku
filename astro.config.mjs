import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://hiraku-5cb.pages.dev',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      // ワークシート印刷ページとオフラインページは検索結果に出さない
      filter: (page) => !page.includes('/worksheet/') && !page.includes('/offline'),
      changefreq: 'weekly',
      lastmod: new Date(),
      i18n: { defaultLocale: 'ja', locales: { ja: 'ja-JP' } },
    }),
  ],
});
