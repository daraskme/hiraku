# 新しい教材を追加する手順

「ひらく」に新しい教材を追加するための、ステップ・バイ・ステップのガイドです。

## ステップ 1: 著作権を確認

その素材は本当に著作権が切れていますか？

- 日本の著作物：著者の **没後70年**（2018年改正後）。改正前に既に保護期間が
  満了していた著作物は引き続きPD
- 海外の著作物：日本での保護期間と国際条約による

**例：**
- 新美南吉（1943年没）→ 1993年に保護期間満了 → 改正の影響なくPD ✓
- 中島敦（1942年没）→ 1992年に保護期間満了 → PD ✓
- 太宰治（1948年没）→ 1998年に保護期間満了 → PD ✓
- 三島由紀夫（1970年没）→ 2040年まで著作権あり ✗
- 寺田寅彦（1935年没）→ 1985年に保護期間満了 → PD ✓
- Lafcadio Hearn（1904年没）→ 完全にPD ✓

**ヒント：** 青空文庫に収録されている作品は、ほぼPDです（一部例外あり、
要約：「インターネット公開」マークがある作品が公開対象）。

## ステップ 2: 出典を決める

原文をどこから取るかを決めます。

**よく使う出典：**

- **青空文庫** — https://www.aozora.gr.jp/
- **国立国会図書館デジタルコレクション** — https://dl.ndl.go.jp/
  - インターネット公開資料のみ使用可
- **Project Gutenberg**（英語素材） — https://www.gutenberg.org/

底本（どの版を使ったか）も後で frontmatter に記入します。

## ステップ 3: 配置先を決める

どの collection（学年・教科の組み合わせ）に置くか決めます。

| collection | 学校段 | 学年 | 教科 |
|---|---|---|---|
| `kokugo3` | 小 | 3 | 国語 |
| `sansu5` | 小 | 5 | 算数 |
| `chugaku1` | 中 | 1 | 国語 |
| `chugakurika1` | 中 | 1 | 理科 |
| `chugakukomin3` | 中 | 3 | 公民 |
| `kotoko1` | 高 | 1 | 国語 |
| `kotokoeigo1` | 高 | 1 | 英語 |

該当する collection がない場合は、まず [CONTRIBUTING.md](../CONTRIBUTING.md) の
「新しい教科・学年を追加する」セクションを参照してください。

## ステップ 4: ファイル作成

`src/content/<collection>/<slug>.md` を作成します。slug はファイル名の
ローマ字表記（ハイフン区切り）。

例：`src/content/kokugo3/yamanashi.md`

## ステップ 5: frontmatter を書く

既存の教材（例：`src/content/kokugo3/tebukuro-wo-kaini.md`）を雛形に
コピーすると楽です。最低限必要なフィールド：

```yaml
---
title: 作品タイトル
author: 作者名
author_dates: "生年–没年"  # 例: "1913–1943"
original_year: 1932         # 数値。古典の場合は省略可
era: "鎌倉時代前期"          # 古典の場合に推奨
source:
  text: 青空文庫            # 出典名
  url: https://...          # URL（なければ省略可）
  base: "底本：『..』..."   # 底本の書誌情報
school_stage: shogaku       # shogaku / chugaku / kotoko
grade: 3                    # 1-9
subject: 国語
domains:
  - "C 読むこと"
classical: false            # 古典なら true
curriculum_items:
  - code: "C(1)エ"
    label: "..."
estimated_minutes: 25
order: 6                    # この collection 内での並び順
description: "1〜2文の作品紹介"
keywords:
  - キーワード1
  - キーワード2
license_editorial: CC-BY-4.0
license_original: PublicDomain
goals:
  - 学習のめあて1
  - 学習のめあて2
glossary:
  - term: 語句
    meaning: 意味
questions:
  - 発問1
  - 発問2
---
```

## ステップ 6: 本文を書く

frontmatter の下に、本文を HTML（Markdown 内 HTML 許容）で書きます。

```html
<p>　本文の段落は <p> で。冒頭は全角スペース1つで字下げ。</p>

<p>「会話文は字下げなしの <p> で」</p>

<ruby>狐<rt>きつね</rt></ruby> のように HTML5 ruby を使う。

<h3>章タイトル</h3>

<blockquote class="song">
<p>引用・歌は blockquote class="song" で。</p>
</blockquote>
```

## ステップ 7: ビルドして確認

```bash
npm run build
npm run preview
```

`http://localhost:4321/library/<collection>/<slug>` で表示確認。

## ステップ 8: コミット & プルリクエスト

```bash
git checkout -b add-lesson-<slug>
git add src/content/<collection>/<slug>.md
git commit -m "Add <作品名>（<作者>）to <collection>"
git push
gh pr create
```

PR テンプレートのチェックリストを埋めてください。

---

## トラブルシューティング

### Zod バリデーションエラー

例：`keywords.1: Expected type "string", received "number"`

→ YAML で `1894` のような数値表記された値は数値として解釈されます。
キーワードは文字列にすべきなので、`"1894"` のようにクォートするか、
`明治期` のような言葉に置き換えてください。

### Pagefind が「stemming for ja not supported」と警告する

→ 動作には問題ありません。日本語のキーワード検索は表記が一致すれば
ヒットします。

### 本文の `<p>` がコードブロックとして表示される

→ Markdown でインデントされた HTML はコードブロック扱いになります。
`<p>` は行頭にスペースなしで配置してください。
