# 構文リファレンス

このブログの記事（`posts/YYYY/MM/DD/NN-slug/index.md`）で使用できる構文のリファレンスです。

基本方針: **GitHub Flavored Markdown の範囲で書き、足りない機能は HTML を直接書く。Markdown 自体は拡張しない。**

---

## Frontmatter

記事の先頭に YAML frontmatter を記述します。`---` で囲みます。

```yaml
---
pubdate: 2021-08-28T22:00+09:00
tags: [tag1, tag2]
sectnums: true
description: meta タグに使われる説明文
thumbnail: thumbnail.jpg
style: |
  .custom { color: red; }
---
```

| フィールド    | 型         | 必須 | 説明                                                                 |
| ------------- | ---------- | ---- | -------------------------------------------------------------------- |
| `pubdate`     | `string`   | -    | 公開日時（ISO 8601 形式）。省略時はスラッグのパス（YYYY-MM-DD）が使われる |
| `tags`        | `string[]` | -    | タグの一覧                                                           |
| `sectnums`    | `boolean`  | -    | `true` にするとセクション番号（1.1. など）を見出しの先頭に表示する    |
| `description` | `string`   | -    | `<meta name="description">` に使われる SEO 用の説明文                |
| `thumbnail`   | `string`   | -    | サムネイル画像のパス（記事ディレクトリからの相対パス）                |
| `style`       | `string`   | -    | 記事固有の CSS を埋め込む                                            |

---

## タイトル

記事内の **h1**（`# 見出し`）がタイトルとして扱われます。タイトルは本文から除去され、ページのヘッダー部分に表示されます。

```md
# 記事のタイトル
```

- h1 は **1 つだけ** 記述してください。複数あると警告が出ます。
- h1 が存在しないとエラーになります。

---

## 数式（KaTeX）

`remark-math` + `rehype-katex` によって、LaTeX 形式の数式を記述できます。

### インライン数式

```md
テキスト中に $E = mc^2$ のように書きます。
```

### ディスプレイ数式

```md
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

---

## samp ブロック

コードブロックの言語指定に `samp` を指定すると、`<code>` の代わりに `<samp>` タグが使われます。コマンドの出力結果など、`<code>` ではなく `<samp>` が意味的に適切な場合に使用してください。

````md
```samp
$ echo "Hello, World!"
Hello, World!
```
````

---

## セクション番号

frontmatter で `sectnums: true` を設定すると、h2 以降の見出しにセクション番号が自動で付与されます。

```md
## はじめに        → 「1. はじめに」
### 背景           → 「1.1. 背景」
## 本題            → 「2. 本題」
```

### セクション参照

見出しに `id` が付いている場合、空のリンクで参照するとセクション番号に自動置換されます。

```md
## はじめに {#sec-intro}

詳しくは [](#sec-intro) を参照してください。
```

↓ 変換後

```html
詳しくは <a href="#sec-intro">Section 1</a> を参照してください。
```

---

## 図表番号

`<figure>` 要素に `data-num` 属性を指定すると、`<figcaption>` の先頭に番号が自動で付与されます。`data-num` の値が番号の接頭辞になります。同じ接頭辞ごとに連番が振られます。

```html
<figure id="fig-example" class="fig-img" data-num="図">
  <img src="example.png" alt="例" />
  <figcaption>サンプル画像</figcaption>
</figure>
```

↓ 変換後

```html
<figure id="fig-example" class="fig-img" data-num="図">
  <img src="example.png" alt="例" />
  <figcaption>図 1: サンプル画像</figcaption>
</figure>
```

### 図表参照

空のリンク（テキストなしの `<a>` タグ）で `<figure>` の `id` を参照すると、図表番号に自動置換されます。

```md
[](#fig-example) に示すように…
```

↓ 変換後

```html
<a href="#fig-example">図 1</a> に示すように…
```

---

## figure の class

`<figure>` 要素には以下のいずれかの class を指定してください。指定がないと警告が出ます。各 class に応じたスタイルが適用されます。

| class       | 用途           |
| ----------- | -------------- |
| `fig-code`  | コードブロック |
| `fig-img`   | 画像           |
| `fig-quote` | 引用           |
| `fig-table` | テーブル       |
| `fig-tweet` | ツイート埋め込み |

### 使用例

#### 画像

```html
<figure class="fig-img" data-num="図">
  <img src="photo.jpg" alt="" />
  <figcaption>写真の説明</figcaption>
</figure>
```

#### コード

````html
<figure class="fig-code" data-num="リスト">
<figcaption>コードの説明</figcaption>

```js
const x = 1;
```

</figure>
````

> **注意**: Markdown のコードブロックは `<figure>` の中に書けます（`rehype-raw` が処理します）。

#### 引用

```html
<figure class="fig-quote">
<blockquote cite="https://example.com/">

引用文（Markdown で記述可能）

</blockquote>
<figcaption>出典タイトル, <a href="https://example.com/"><cite>出典</cite></a></figcaption>
</figure>
```

#### テーブル

`<figure class="fig-table">` 内の `<table>` は自動的に `<div class="table-wrapper">` でラップされ、横スクロールが可能になります。

```html
<figure class="fig-table" data-num="表">
<figcaption>テーブルの説明</figcaption>

| 列A | 列B |
| --- | --- |
| 1   | 2   |

</figure>
```

---

## Admonitions（注記）

DocBook の意味に従った注記ブロックです。HTML で直接記述します。

| class            | 意味                                 |
| ---------------- | ------------------------------------ |
| `note-important` | 重要な情報                           |
| `note-caution`   | 注意深く行動すべきこと               |
| `note-warning`   | 従わないと問題が起きる可能性がある警告 |

```html
<div role="note" class="note note-important">
  <h4 class="note-heading">見出し</h4>
  <div class="note-content">
    <p>内容</p>
  </div>
</div>
```

---

## 追記（`<ab-insblock>`）

記事公開後に追加した内容を示すカスタム要素です。`datetime` 属性に追記日を指定します。

```html
<ab-insblock datetime="2021-09-27">
  <p>変更がありました。</p>
</ab-insblock>
```

↓ 変換後

```html
<ins class="note ins-block" datetime="2021-09-27" role="note">
  <div class="note-heading">
    追記 <time datetime="2021-09-27">2021/09/27</time>
  </div>
  <div class="note-content">
    <p>変更がありました。</p>
  </div>
</ins>
```

---

## 画像の自動サイズ取得

ローカル画像（相対パスで指定された `<img>`）は、`width` / `height` が未指定の場合、ビルド時に画像ファイルから自動的にサイズが設定されます。

- `width` と `height` の **両方** が未指定 → 画像の実サイズが設定される
- **片方のみ** 指定 → アスペクト比を維持して他方が計算される
- 外部画像（URL に `//` を含む）はサイズ取得できないため、`width` と `height` を手動で指定してください（未指定だと警告が出ます）

---

## Preamble（概要）

本文の最初の h2（`##`）より前の内容が、記事一覧ページに表示される概要（preamble）として使われます。h2 がない記事の場合は全文が概要になります。
