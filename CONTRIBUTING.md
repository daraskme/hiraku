# 貢献ガイド — ひらく（project_procopios）

「ひらく」へようこそ！　このプロジェクトは、著作権が切れた教科書素材を、
現行の学習指導要領に沿って再編集してオープンに公開する、有志による教材
プロジェクトです。あなたの貢献を歓迎します。

## 貢献の3つの形

### 1. 新しい教材を提案する

PD（パブリックドメイン）の素材を、現行の指導要領に沿って編集した
教材を増やしたいです。提案前に [docs/editorial-policy.md](docs/editorial-policy.md)
を一読してください。

**典型的なフロー：**

1. [Issue](https://github.com/daraskme/hiraku/issues/new/choose) で
   「新しい教材の提案」テンプレートから提案
2. 著作権の確認（作者の没年、底本、出典元のライセンス）
3. 編集方針との合致を確認（編集会議は当面メンテナの判断で行います）
4. ファイル作成のプルリクエスト

### 2. 既存教材の改善を提案する

ルビの追加・誤字の修正・語注の改善・発問の見直しなど、
[Issue](https://github.com/daraskme/hiraku/issues/new/choose) または
プルリクエストで歓迎します。小さな修正でも大歓迎。

### 3. サイト機能・コードの改善

UI/UX、アクセシビリティ、検索、ビルド、デプロイ、CI など、
コード側の改善も同様にプルリクエストで。

## ローカル開発のセットアップ

```bash
git clone git@github.com:daraskme/hiraku.git
cd hiraku
npm install
npm run dev    # http://localhost:4321
```

ビルドして検索インデックスも含めて確認：

```bash
npm run build    # dist/ を生成、Pagefind 検索インデックスも作成
npm run preview  # 本番相当をローカルで起動
```

## ディレクトリ構成

```
src/
├── content/
│   ├── kokugo3/         # 小3 国語
│   ├── chugaku1/        # 中1 国語
│   ├── kotoko1/         # 高1 国語
│   ├── chugakurika1/    # 中1 理科
│   ├── kotokoeigo1/     # 高1 英語
│   ├── sansu5/          # 小5 算数
│   └── chugakukomin3/   # 中3 公民
├── content.config.ts    # Zod スキーマ（教材メタの型定義）
├── layouts/Lesson.astro # 教材ページのレイアウト
├── pages/library/<collection>/[...slug].astro
└── ...
```

## 新しい教材を追加するチェックリスト

- [ ] 著作権が切れていることを確認（作者没年・著作権法上の保護期間）
- [ ] 出典（青空文庫・国会図書館デジタルコレクションなど）を frontmatter に明記
- [ ] [`docs/editorial-policy.md`](docs/editorial-policy.md) の編集規範に従う
- [ ] [`docs/curriculum-mapping.md`](docs/curriculum-mapping.md) で対応する指導事項を確認
- [ ] frontmatter の必須フィールドを埋める（title, author, source, school_stage, grade, subject, description, license_editorial, license_original）
- [ ] 学習のめあて（goals）、語注（glossary）、発問（questions）を含める
- [ ] `npm run build` でビルドが通る
- [ ] プレビューで表示が崩れていない

既存ファイルをコピーして雛形にすると楽です。たとえば
[`src/content/kokugo3/tebukuro-wo-kaini.md`](src/content/kokugo3/tebukuro-wo-kaini.md)
が小学校国語のサンプルです。

## 新しい教科・学年を追加する

少し作業が増えます：

1. `src/content.config.ts` に新しい collection を追加
2. `src/content/<collection名>/` フォルダ作成
3. `src/pages/library/<collection名>/[...slug].astro` ルートを作成
4. `src/layouts/Lesson.astro` の Props 型に新 collection を追加
5. `src/pages/library/index.astro` に新セクションを追加
6. `src/pages/index.astro` の featured マージ対象に追加
7. `src/pages/progress.astro` の `collectionLabel` に表示ラベルを追加
8. `public/progress.js` 側でも認識される（自動）

## ライセンスについて

- **コード**: [MIT License](LICENSE-CODE)
- **編集・付加コンテンツ**（教材ページの編集、語注、発問、解説など）:
  [CC BY 4.0](LICENSE-CONTENT)
- **原文**（青空文庫など PD 由来の文章）: パブリックドメイン

プルリクエストを送る = 提供する内容を上記のライセンスで提供することに
同意したものとみなします。

## コミュニケーション

- バグ報告・質問・新機能の提案：[GitHub Issues](https://github.com/daraskme/hiraku/issues)
- 大きな変更の議論：[GitHub Discussions](https://github.com/daraskme/hiraku/discussions)（準備中）

## 行動規範

参加者全員に [Contributor Covenant](CODE_OF_CONDUCT.md) を遵守して
いただきます。建設的・敬意のあるコミュニケーションを心がけてください。

---

ご質問がある方は遠慮なく Issue を立ててください。お待ちしています。
