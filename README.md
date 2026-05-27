# project_procopios

著作権が切れた日本語教科書素材を原典に、現行の学習指導要領（平成29年告示）に沿って
再編集し、無償・オープンソースで公開する教材プロジェクトです。

## このプロジェクトが目指すもの

- パブリックドメインとなった近代日本の優れた読み物を、現代の児童が読める形に編集して
  オープンに提供する
- 編集にあたっては現行学習指導要領との対応関係を明示する
- 教材本文・編集・コードのすべてをオープンライセンスで公開し、誰でも教室・家庭・
  別サイトで再利用・改変できる状態を維持する
- 本サイトは文部科学省検定済教科書ではありません。**自主教材（副教材）**として
  ご活用ください

## 技術スタック

- [Astro](https://astro.build/) — 静的サイトジェネレータ
- [Cloudflare Pages](https://pages.cloudflare.com/) — 無料ホスティング
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) + KV — 認証 API と進捗の永続化（任意機能）
- [Google Identity Services](https://developers.google.com/identity/gsi/web) — Google ログイン（任意機能）
- Markdown + HTML5 ruby — 教材本文（フリガナを含む）

## ローカル開発

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # dist/ を生成
npm run preview # dist/ をローカルでプレビュー
```

## クラウド同期（Google ログイン）

任意機能として、Google でログインすると進捗・ブックマーク・英単語履歴・
表示設定がすべての端末で同期されます。ログインしなくても、すべての機能は
端末内でそのまま使えます。

セットアップ手順は [SETUP.md](./SETUP.md) を参照してください。

## ディレクトリ構成

```
.
├── astro.config.mjs
├── package.json
├── docs/
│   ├── editorial-policy.md     # 編集方針
│   └── curriculum-mapping.md   # 学習指導要領との対応
├── public/                     # 静的ファイル（favicon など）
└── src/
    ├── content/
    │   ├── config.ts           # コンテンツコレクション定義
    │   └── kokugo3/            # 小学校国語3年の教材
    │       └── *.md
    ├── components/             # 再利用コンポーネント
    ├── layouts/                # ページレイアウト
    ├── pages/                  # ルーティング
    └── styles/global.css
```

## 新しい教材を追加する

1. `src/content/kokugo3/<slug>.md` を新規作成
2. 既存ファイル（例：`tebukuro-wo-kaini.md`）の frontmatter をテンプレートとして
   タイトル・出典・指導要領との対応・語注・発問などを記入
3. `npm run dev` で表示確認
4. プルリクエストを作成

詳細は [`docs/editorial-policy.md`](docs/editorial-policy.md) を参照してください。

## 挿絵について

教材ページのカバー画像・本文背景に使う挿絵は、ChatGPT (DALL-E) で生成した画像を
WebP に変換して `public/illustrations/<collection>/<slug>/sceneN.webp` に置いています。
生成パイプライン・ファイル仕様・配置済みインベントリ・追加規約は
[`public/illustrations/README.md`](public/illustrations/README.md) を参照してください。

現時点で 117 枚 (75 教材) が配置済み。新設 13 collection (美術・体育・道徳・情報・
理科 4 領域・新数学 3 collection・小4算数・音楽) は全教材カバー済みです。

## ライセンス

- **サイトのソースコード**: MIT License（[LICENSE-CODE](LICENSE-CODE)）
- **編集・付加コンテンツ**（教材ページの編集、語注、発問、解説、指導要領対応表など）:
  Creative Commons Attribution 4.0 International（[LICENSE-CONTENT](LICENSE-CONTENT)）
- **原典本文**（例：新美南吉「手袋を買いに」）: パブリックドメイン
- **学習指導要領**（文部科学省告示）: 項目名・領域構造の引用にとどめ、本文転載は
  行っていません

## デプロイ

Cloudflare Pages の設定：

- Framework preset: **Astro**
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js version: `20` 以上

詳細は [`docs/deploy.md`](docs/deploy.md) を参照してください。

## 貢献する

このプロジェクトはオープンソース・有志運営です。あなたの貢献を歓迎します：

- **新しい教材を提案** — [新教材追加ガイド](docs/adding-a-lesson.md)
- **既存教材の改善** — ルビ・語注・発問・誤字の修正など、小さい修正も大歓迎
- **コードの改善** — UI、検索、アクセシビリティなど

詳しくは [CONTRIBUTING.md](CONTRIBUTING.md) を参照。
プロジェクトの行動規範は [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 関連リンク

- [青空文庫](https://www.aozora.gr.jp/) — 原文取得元
- [国立国会図書館デジタルコレクション](https://dl.ndl.go.jp/) — 旧教科書資料
- [文部科学省 学習指導要領](https://www.mext.go.jp/a_menu/shotou/new-cs/) — 現行指導要領
- [Creative Commons Japan](https://creativecommons.jp/) — CCライセンス解説
