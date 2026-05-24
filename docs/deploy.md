# Cloudflare Pages へのデプロイ手順

## 前提

- GitHub にこのリポジトリをプッシュ済みであること
- Cloudflare アカウントを持っていること（無料プランで可）

## 初回セットアップ

1. Cloudflare ダッシュボード → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. GitHub 連携を承認し、`project_procopios` リポジトリを選択
3. ビルド設定を以下のとおり指定：
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`（リポジトリのルート）
   - **環境変数**: `NODE_VERSION=20`（または `22`）
4. **Save and Deploy** をクリック

初回ビルドが成功すると、`https://project-procopios.pages.dev` のような URL が
払い出されます。

## 自動デプロイ

以降、`main` ブランチへのプッシュで自動的に本番ビルド・デプロイされます。
プルリクエストごとにプレビュー URL も自動生成されます。

## カスタムドメインを使う場合

1. Pages プロジェクト → **Custom domains** → **Set up a custom domain**
2. ドメイン（例: `procopios.example.org`）を入力
3. Cloudflare DNS にネームサーバを向けている場合、自動で CNAME が設定される
4. 外部 DNS の場合、表示される CNAME を手動で追加

## ローカルでのプレビュー

デプロイ前に本番ビルドを手元で確認できます：

```bash
npm run build      # dist/ を生成
npm run preview    # http://localhost:4321
```

## トラブルシューティング

### ビルドが Node.js のバージョン不一致で失敗する

Cloudflare Pages のビルド環境変数に `NODE_VERSION=20` を設定してください。

### 404 が出る

`astro.config.mjs` の `site` フィールドが実際のドメインと一致しているか確認。
sitemap や絶対URLの生成に影響します。
