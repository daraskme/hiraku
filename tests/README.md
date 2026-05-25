# E2E テスト

主要フロー (教材閲覧 / ブックマーク / お気に入り / 学習パス / 印刷物
など) を Playwright で回帰テストします。

## セットアップ

```bash
npm install -D @playwright/test http-server
npx playwright install --with-deps chromium
```

## 実行

```bash
# サイトをビルド
npm run build

# テストを実行 (ヘッドレス)
npm run test:e2e

# UI モードで対話的に
npm run test:e2e:ui
```

ローカルで Astro dev を起動している場合は、`PLAYWRIGHT_BASE_URL` で
向き先を指定できます：

```bash
PLAYWRIGHT_BASE_URL=http://localhost:4321 npm run test:e2e
```

## CI での実行

GitHub Actions で動かす場合は `.github/workflows/e2e.yml` を別途
セットアップしてください（テンプレは未提供）。

## 制限

- 認証 / クラウド同期 (`/api/*`) のテストは KV を必要とするため、
  現状の `npx http-server` ベースのフロー外。 Playwright の `route`
  でモックするか、`wrangler pages dev` を Playwright の `webServer`
  にする拡張が必要。
- Web Speech API (音声朗読) は Playwright のブラウザでは動かない場合が多い。
