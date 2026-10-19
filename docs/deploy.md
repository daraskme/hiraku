# Cloudflare Pages への公開

公開先は `https://hiraku.darask.me`、Cloudflare Pagesプロジェクトは既存の `hiraku` です。
既存URL `https://hiraku-5cb.pages.dev` も利用できます。Custom domainsとDNSは登録済みです。

## GitHubからの更新

`daraskme/hiraku` の `main` へのプッシュで、GitHub Actionsが検証・ビルドを実行し、同じPagesプロジェクトへ公開します。Actions画面から手動実行もできます。
このプロジェクトはDirect Uploadを使っているため、Pagesの標準Git連携への切り替えは不要です。

- Node.js: 24
- ビルド: `npm ci` → `npm run build`
- 検証: `npm run test:local`
- 出力: `dist`
- Functions: リポジトリの `functions/` からWranglerがビルド

GitHub Actions Secretsには `CLOUDFLARE_API_TOKEN`（対象アカウントのPages編集権限）と `CLOUDFLARE_ACCOUNT_ID` を設定します。トークンをコードに書かないでください。
`HIRAKU_KV` は既存プロジェクトのProduction / Previewのバインディングを引き継ぎます。Google OAuthやログインの設定は不要です。

## ローカルでの確認

```sh
npm ci
npm run test:local
npm run build
npm run preview
```

学習データのバックアップとドメイン移行は [SETUP.md](../SETUP.md) を参照してください。
