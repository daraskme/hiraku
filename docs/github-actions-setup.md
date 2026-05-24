# GitHub Actions による自動デプロイの設定

`.github/workflows/deploy.yml` を導入したことで、`main` ブランチへの push が
自動的に Cloudflare Pages へ反映されるようになります。これを動かすには、
GitHub リポジトリに2つのシークレットを設定する必要があります。

## 1. Cloudflare API トークンの作成

1. https://dash.cloudflare.com/profile/api-tokens にアクセス
2. **Create Token** をクリック
3. **Edit Cloudflare Workers** テンプレートではなく、**Create Custom Token** を選択
4. 以下の権限を付与：
   - **Account**: `Cloudflare Pages — Edit`
5. **Account Resources** で対象アカウントを選択
6. **Continue to summary** → **Create Token**
7. 生成された **トークン文字列** をコピー（一度しか表示されない）

## 2. Cloudflare アカウント ID の取得

1. https://dash.cloudflare.com/ にログイン
2. 右側のサイドバー、または URL の `https://dash.cloudflare.com/<ACCOUNT_ID>/...` で確認
3. 32文字の16進文字列をコピー

## 3. GitHub Secrets への登録

リポジトリ https://github.com/daraskme/hiraku で：

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. 以下2つを登録：
   - Name: `CLOUDFLARE_API_TOKEN` / Secret: 1. でコピーしたトークン
   - Name: `CLOUDFLARE_ACCOUNT_ID` / Secret: 2. で取得したアカウント ID

## 4. 動作確認

`main` への push、または **Actions** タブから手動で
**Deploy to Cloudflare Pages** ワークフローを実行 → 数分でデプロイが完了します。

## トラブルシューティング

### 「Invalid commit message」エラー

Cloudflare API は一部の文字（特定の漢字を含むコミットメッセージ）を弾く
ことがあります。ワークフロー内では `--commit-message` を明示的に渡しているので、
コミットメッセージは ASCII 範囲を中心に書くと安全です。

### Node のバージョンエラー

`deploy.yml` の `node-version: '20'` を `'22'` などに上げると改善することがあります。

### Pagefind の警告

`Pagefind doesn't support stemming for the language ja` という警告は無視して
構いません。表記が一致する検索は問題なく動作します。
