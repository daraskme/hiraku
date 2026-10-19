# ひらくの公開設定

学習記録はブラウザー内に保存します。Google OAuth、ログイン、アカウント同期の設定は不要です。
教材メモも端末内に保存し、`/profile` の学習データ画面からバックアップ・復元できます。

## 公開先

- GitHub: `daraskme/hiraku`
- Cloudflare Pagesプロジェクト: `hiraku`
- 公開ドメイン: `https://hiraku.darask.me`
- 既存URL: `https://hiraku-5cb.pages.dev`
- ビルド: `npm ci` → `npm run build`
- 出力先: `dist`

公開は既存のGitHub Actionsを使います。CloudflareのトークンとアカウントIDは
リポジトリのActions Secretsに `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` として登録します。

カスタムドメインをPagesのCustom domainsで追加し、DNS・証明書がActiveになったことを
確認してからドメイン変更を本番に反映してください。

## Functions

`HIRAKU_KV` はヘルスチェック、障害報告、更新通知などの既存APIで利用します。
既存プロジェクトのProduction / Previewのバインディングを引き継いでください。
旧アカウントAPIは410を返し、既存セッションCookieを期限切れにします。
旧クラウド上のユーザーデータはこの変更では削除しません。

## ドメイン移行時の学習記録

localStorageはドメインごとに分かれます。利用者は既存URLの `/profile` でバックアップを保存し、
新ドメインの同じ画面で読み込むと、学習記録を移せます。

## 検証

```sh
npm run test:local
npm run build
```
