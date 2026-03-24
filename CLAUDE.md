# AIエージェント向けガイドライン

## プロジェクト概要

「あじょろぐ」(blog.azyobuzi.net) の静的ブログジェネレータ。npm workspacesによるモノレポ構成。

- `@azyobuzin-blog/main` (ルート): ブログ記事 (`posts/`)、CSS (`styles/`)、ビルドスクリプト
- `@azyobuzin-blog/generator` (`generator/`): TypeScript製の静的サイトジェネレータ

## ワークフロー

**npmコマンドは必ずリポジトリルートで実行すること。** generatorディレクトリに移動しない。

### ジェネレータのコード変更時

1. コードを編集
2. `npm run fix` でリント＆フォーマット修正
3. `npm test` で検証（Biome CI + 型チェック + Jest）
4. `npm run build` でビルドが通ることを確認

### ブログ記事の作成・編集時

1. `./mkpost <slug>` で記事ディレクトリ作成（新規の場合。例: `./mkpost 01-hello`）
2. Markdownを編集
3. `npm run build` でビルドが通ることを確認

## アーキテクチャ

### サイト生成パイプライン

1. `generator/index.tsx` が `posts/` のMarkdownファイルを読み込み
2. unified.js パイプライン: remark-parse → frontmatter抽出 → HAST変換 → 各種プラグイン（セクション番号、図番号、KaTeX、highlight.js、カスタム要素）
3. HAST ASTからHTMLを生成し `public/` に出力
4. Parcelが `styles/global.css` をバンドル

### JSXの注意点

JSXはReactではない。カスタム `h()` ファクトリ (hastscript ラッパー) でHAST ASTノードを返す。tsconfig.jsonで `jsxFactory: "h"`, `jsxFragmentFactory: "null"` と設定されている。

### 記事の構成

```
posts/YYYY/MM/DD/NN-slug/
├── index.md      # YAML frontmatter + Markdown本文
└── [画像等]
```

記事の構文については [docs/syntax-reference.md](docs/syntax-reference.md) を参照。

## コーディングルール

- `any` や `@ts-expect-error` を極力使わない。必要な場合はユーザーの許可を取る
- 修正ごとに動作確認を行う
- あらゆる変更の後に `npm run fix` を実行する
