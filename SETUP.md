# ひらく — Google ログイン + クラウド同期のセットアップ

このプロジェクトは **オフラインファースト** 設計です。
ログイン機能が未設定でも、サイト本体は localStorage で問題なく動作します。
クラウド同期を有効化する場合のみ、以下の手順を実施してください。

## 全体像

| 層 | 設定対象 | 用途 |
|---|---|---|
| クライアント | `PUBLIC_GOOGLE_CLIENT_ID` (Astro env) | Google Sign-In ボタンの初期化 |
| Functions | `GOOGLE_CLIENT_ID` (Cloudflare env) | ID Token の audience 検証 |
| Functions | `SESSION_TTL_DAYS` (任意) | セッション Cookie の寿命 (デフォルト 30 日) |
| Functions | `HIRAKU_KV` (KV Namespace binding) | セッション・進捗データ永続化 |

## 1. Google Cloud Console で OAuth Client ID を発行

1. <https://console.cloud.google.com/> にアクセスしプロジェクトを作成 (または既存を選択)
2. 左メニュー **「APIs & Services → OAuth consent screen」** で同意画面を構成
   - User type: External（個人開発でも OK）
   - App name: `ひらく` などお好みで
   - Scopes: `openid`, `email`, `profile` のみで十分
3. **「APIs & Services → Credentials」 → 「+ CREATE CREDENTIALS → OAuth client ID」**
   - Application type: **Web application**
   - **Authorized JavaScript origins** (とても重要 — ここに登録されてない origin からのログインは Google が拒否します):
     - 開発時: `http://localhost:4321`（Astro dev のポート。`wrangler pages dev` を使う場合は `http://localhost:8788` も追加）
     - **本番**: `https://hiraku-5cb.pages.dev` (Cloudflare Pages のデフォルト URL)
     - 独自ドメインを使う場合: そのドメインも追加（`https://example.com`）
     - プレビューデプロイで動作確認したい場合: `https://*.hiraku.pages.dev` のようなワイルドカードは Google が認めないため、必要なプレビュー URL を一つずつ追加
   - **Authorized redirect URIs** は不要（GIS の credential フローは redirect しない）
4. 生成された **Client ID** をコピー (`xxxxx.apps.googleusercontent.com` 形式)

### Authorized origins の確認方法

ログインボタンが本番でだけ動かない、`The given origin is not allowed for the given client ID` のようなエラーが出るときは、ここが疑わしいです：

1. <https://console.cloud.google.com/apis/credentials> を開く
2. 該当の OAuth 2.0 Client ID をクリック
3. **「Authorized JavaScript origins」** の一覧に、ブラウザの URL バーに表示されているドメイン (スキーム `https://` 含む、パスは除く) がそのまま入っているか確認
4. 足りなければ追加して「保存」 — 反映まで数分〜10分ほどかかる場合があります

## 2. Cloudflare で KV namespace を作成

ダッシュボード経由：

1. <https://dash.cloudflare.com/> にログイン
2. **Workers & Pages → KV** で「Create a namespace」
3. 名前は `HIRAKU_KV` (任意) で 2 つ作成
   - `hiraku-prod`
   - `hiraku-preview`

ローカルから wrangler CLI を使う場合：

```bash
npx wrangler kv namespace create HIRAKU_KV
npx wrangler kv namespace create HIRAKU_KV --preview
```

得られた **namespace ID** を控えておきます。

## 3. `wrangler.toml` に namespace ID を貼り付け

```toml
[[kv_namespaces]]
binding = "HIRAKU_KV"
id = "<本番の namespace ID>"
preview_id = "<プレビューの namespace ID>"
```

## 4. 環境変数の設定

### ローカル開発

プロジェクト直下に `.env` を作成 (`.env.example` をコピー)：

```bash
PUBLIC_GOOGLE_CLIENT_ID=<クライアントID>.apps.googleusercontent.com
GOOGLE_CLIENT_ID=<同じ値>
SESSION_TTL_DAYS=30
```

開発サーバの起動：

- `npm run dev`（Astro のみ。`/api/*` は呼べない＝ログインボタンは表示されるが認証は失敗）
- `npx wrangler pages dev dist` または `npx wrangler pages dev -- npm run dev` を使うと
  Functions も一緒にホストされる。本番に近い動作確認はこちら推奨。

### Cloudflare Pages 本番デプロイ

1. **Settings → Environment variables** で Production / Preview それぞれに以下を追加：
   - `PUBLIC_GOOGLE_CLIENT_ID` (Build & Runtime 両方)
   - `GOOGLE_CLIENT_ID` (Runtime)
   - `SESSION_TTL_DAYS` = `30` (Runtime, 任意)
2. **Settings → Functions → KV namespace bindings** で
   - Variable name: `HIRAKU_KV`
   - KV namespace: 上で作成した hiraku-prod / hiraku-preview
3. **再デプロイ** すると反映される

## 5. 動作確認

1. デプロイ後のサイトにアクセス
2. ヘッダー右側の「○」アイコンをクリック → 「Sign in with Google」ボタン
3. Google でログイン
4. アイコンが Google のアバターに変化、パネルに名前/メールと「同期しました」表示

別のデバイスで同じアカウントでログインすると、進捗・ブックマーク・
英単語履歴・表示設定（テーマ・縦書き・ふりがな等）が同期されます。

## トラブルシューティング

- **ボタンが表示されない** — `PUBLIC_GOOGLE_CLIENT_ID` がビルド時に渡されているか確認。
  Astro は `PUBLIC_` プレフィックス付きのみクライアントに公開します。
- **ログイン直後に「同期に失敗」** — Cloudflare ダッシュボードで KV binding が
  Production 環境に正しく結ばれているか、`GOOGLE_CLIENT_ID` が設定されているか確認。
- **`invalid_token` エラー** — Authorized JavaScript origins に現在のドメインが
  登録されているか、`GOOGLE_CLIENT_ID`（サーバ側）と `PUBLIC_GOOGLE_CLIENT_ID`（クライアント）が
  完全一致しているか確認。
- **ローカル開発で `/api/*` が 404** — `wrangler pages dev` を使わないと
  Functions はホストされない。`npm run dev` は静的 Astro のみ。

## プライバシー・データ保持

- 取得する情報は OAuth scope の **openid / email / profile** のみ
  (Google ID / メールアドレス / 表示名 / アバター URL)
- KV に保存するデータは
  - セッション情報 (TTL 30 日で自動削除)
  - 学習進捗・ブックマーク・英単語履歴・表示設定の JSON
- 退会したい場合：`DELETE /api/sync` で自分のデータを消去可能 (UI からはまだ未実装、将来対応予定)
- データを第三者と共有することはない
