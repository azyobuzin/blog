---
pubdate: 2021-09-24T23:30+09:00
tags: [tech, JavaScript]
---

# 結局ブログをMarkdownで書くことにした話

blog.azyobuzi.net を開設して1年強、メンテナンスも AsciiDoc も面倒になってきて、はてなブログに戻るのもアリだなぁという気持ちが若干発生してきていました。そもそもブログ自体書いてないじゃん。はい。すいません。

AsciiDoc というか Asciidoctor を使うことに思うところがあり、 Gatsby + Asciidoctor.js という構成をやめ、 Markdown + お手製静的サイトジェネレータ という構成に変更したというお話です。

（AsciiDoc から Markdown への移行は9月の頭には完了していましたが、記事を書く余裕がなかったので、今書いています。）

## なぜ Markdown

このブログを開設して最初の記事で、なぜ AsciiDoc を選んだかを説明しました。

<figure class="fig-quote">
<blockquote cite="https://blog.azyobuzi.net/2020/04/04/01-hello-gatsby/">

プレーンな Markdown （GitHub Flavored ではない）を思い出してください。機能が何もかも足りていないですね。

Markdown 処理系を思い出してください。いくつ方言があるんだよお前ら。

というわけで、プレーンな Markdown は弱すぎ、方言はみんなバラバラ、 Markdown 対応サービス間でもコピペしたあとに修正を加えるなんて日常茶飯事な、そんなマークアップ言語で書きたくはありません。そこで、もともと機能が豊富で、さらに要素の拡張方法も仕様に含まれている AsciiDoc を採用することにしました。機能豊富なぶん、 HTML への変換結果と、それに必要なスタイルシートがつらいという問題はありますが、該当機能を使うまでは問題を先延ばしにできます。先延ばしていけ。

</blockquote>
<figcaption>3. なぜ AsciiDoc, <a href="https://blog.azyobuzi.net/2020/04/04/01-hello-gatsby/"><cite>さよならはてなブログ、こんにちはGatsby</cite></a></figcaption>
</figure>

うんうん……。正直今ならほとんど反論できますね……。

まずは方言問題。使ってみてわかりましたが、 Asciidoctor という方言は強烈です。オリジナルの AsciiDoc に対する拡張がかなりあります。結局 Asciidoctor という方言を書くことになってしまいました。対して Markdown は [CommonMark](https://commonmark.org/) という最小かつ曖昧さのほとんどない仕様が存在します。またデファクトスタンダードである [GitHub Flavored Markdown](https://github.github.com/gfm/) は、 CommonMark への機能追加という形で仕様が公開されています。さまざまな方言があるように見えますが、 CommonMark 以外に目を向けなければ、かなり安定した仕様と言えます。

そして次に、 AsciiDoc は<q>機能豊富なぶん、 HTML への変換結果と、それに必要なスタイルシートがつらい</q>と書きましたが、これがかなりつらさにつながっていました。ブログを書いて Web に公開するとはどういうことかというと、 HTML をアウトプットするということです。セマンティックの正しい HTML を出力することについて、 AsciiDoc の機能および Asciidoctor の出力はかなりの足かせになってしまいました。私は HTML が書きたいのであって、 AsciiDoc や DocBook を書きたいわけではないのです。この点において Markdown はとても優秀なツールです。 CommonMark の機能はほぼ HTML タグと1対1対応になっており、簡単に出力される HTML を予想することができます。また CommonMark では HTML をインラインまたはブロックとして直接書くことも許されています（AsciiDoc にも Passthrough Block という機能がありますが）。つまり Markdown に不満があったら HTML を書けばいいのです。 Markdown に多くを求めなければ Markdown は HTML の糖衣構文として使うことができるのです。

このような背景で、 Markdown への移行を決めました。基本方針は GitHub Flavored Markdown にある機能だけを使い、より複雑なことがしたいならば HTML を手書きする です。追加機能が欲しい場合は、カスタム要素を使用します（カスタム要素は静的サイトジェネレータで処理されます。インタラクティブな要素が必要になったときは、そのまま出力して Web Components にしてしまおうと考えています）。 Markdown 自体は拡張しません。

## 静的サイトジェネレータ

Next.js や Gatsby を一度でも使ったことがあれば共感していただけると思うのですが、 JSX って HTML テンプレート言語として最強だと思うんですよ。ということで JSX を捨てたくなかったのですが、どのツールもブラウザに React をロードさせることが前提になっていました。 Gatsby の時代は過激な名前のプラグインをインストールして `<script>` タグを潰していましたね。

<figure class="fig-quote">
<blockquote cite="https://blog.azyobuzi.net/2020/04/04/01-hello-gatsby/">

私が作りたいのは React でできたサイトではなく、ブログ本文が書かれた HTML が置いてあるだけのシンプルなブログです。 PWA でプリロード？ 知らん、読むかもわからんページを先読みしたところでたかが知れてるし、そのスクリプト分だけデータ量は増え、ブラウザの負荷もあります。エコじゃない。

[gatsby-plugin-no-javascript](https://www.gatsbyjs.org/packages/gatsby-plugin-no-javascript/) という過激な名前のサードパーティープラグインがあり、吐き出される HTML の script タグを全部消し去ります。今は特に動的な部分はないので、これで満足しています。

</blockquote>
<figcaption>5.1. ブラウザにとって静的なサイトになりたい, <a href="https://blog.azyobuzi.net/2020/04/04/01-hello-gatsby/"><cite>さよならはてなブログ、こんにちはGatsby</cite></a></figcaption>
</figure>

というわけで JSX を書けて React に依存しないものを探していました。ツールは見つかりませんでしたが、いい感じのライブラリは見つけました。 [hastscript](https://github.com/syntax-tree/hastscript)。これで JSX 構文で AST を吐き出すことができます。

### remark, rehype, unified

最近 JavaScript で Markdown を解析するなら [remark](https://github.com/remarkjs/remark) が最有力でしょうか？ remark は [unified](https://github.com/unifiedjs/unified) という共通 AST 処理基盤を利用する仕組みになっており、 Markdown → Markdown AST ([mdast](https://github.com/syntax-tree/mdast)) → HTML AST ([hast](https://github.com/syntax-tree/hast)) → HTML といった変換工程を簡単に書くことができます。嘘です。すでに用意されてるパッケージを使うだけならうまく隠蔽されていますが、パイプラインとしてはなかなか最悪の実装になっており、それを理解してプラグインを自作することになります。

今見ているこのページの Markdown は、こんな感じのパイプラインで HTML 化されています。

<figure class="fig-code">
<figcaption>Markdown 処理パイプライン (<a href="https://github.com/azyobuzin/blog/blob/7913138eff88596512ec8403c17005bba57beb31/generator/lib/posts.ts#L361-L385" rel="external">posts.ts</a>)</figcaption>

```js
const processor = unified()
  .use(remarkParse) // remark-parse (Parser): Markdown → mdast （この後の「拡張のロード」はここで使われる）
  .use(remarkGfm) // remark-gfm: GFM 拡張のロード
  .use(remarkFrontmatter) // remark-frontmatter: --- で囲まれた frontmatter を mdast のノードとして出力させる拡張のロード
  .use(remarkExtractFrontmatter, {
    yaml: yaml.parse,
    name: "frontmatter",
    throws: true,
  }) // remark-extract-frontmatter: ↑ を AST からメタデータ領域にコピーしてくる
  .use(extractTitle) // 独自: # (h1) をタイトルとして扱う
  .use(remarkMath) // remark-math: $ で囲まれた部分を math ノードとして扱う拡張のロード
  // Markdown ここまで
  .use(remarkRehype, { allowDangerousHtml: true }) // remark-rehype: mdast → hast
  // HTML ここから
  .use(rehypeRaw) // remark-raw: Markdown に手書きした HTML を有効な hast ノードに変換する
  .use(sectionNumbering) // 独自: 見出しにセクション番号を付与する（記事ごとに有効か無効かを設定できる）
  .use(sampElement) // 独自: <code class="language-samp"> を <samp> タグにすげ替える
  .use(assignNoHighlight) // 独自: ↓ で勝手にシンタックスハイライトされないように class="no-highlight" を設定する
  .use(rehypeHighlight) // rehype-highlight: <pre><code> をシンタックスハイライト
  .use(removeHljsClass) // 独自: ↑ で無駄な class が設定されるので削除
  .use(figureNumbering) // 独自: 図表番号を付与する
  .use(rehypeCustomElements) // 独自: カスタム属性を処理する
  .use(rehypeKatex) // rehype-katex: remark-math で抽出した数式を KaTeX で処理する
  .use(lintFigureClass) // 独自: <figure> に class 属性を付け忘れていたら警告する
  .use(toPost) // 独自 (Compiler): 出力オブジェクトを生成する
  .freeze()
```

</figure>

できるだけシンプルにするぞと思っていたのですが、なかなか処理が多いですね。しかし Markdown 言語自体を拡張することはほとんどしておらず、処理のほとんどは HTML の AST を変形しています。このように HTML の世界に閉じ込めることで、言語を拡張するとかいう不毛なことを考えなくて済みます。

### hastscript ベースのページテンプレート

素の hastscript は hast を生成するための簡単な操作しか行うことができませんが、ちょっとしたラッパーを書くことで React の関数コンポーネントの書き味を得ることができます。

<figure class="fig-code">
<figcaption>React の書き味に似せるためのラッパー (<a href="https://github.com/azyobuzin/blog/blob/7913138eff88596512ec8403c17005bba57beb31/generator/lib/jsx.ts" rel="external">jsx.ts</a>)</figcaption>

```js
import { h as hastscript } from "hastscript"

export function h(selector, properties, ...children) {
  return typeof selector === "function"
    ? selector({ children, ...properties }) // 関数コンポーネント
    : hastscript(
        selector,
        properties,
        // hastscript は boolean を入力すると例外をスローするのでフィルター
        children.filter((x) => x != null && x !== true && x !== false)
      )
}
```

</figure>

このような関数を用意すると、ほぼ React の感覚で JSX を書くことができます。実際の使用例は、このブログのジェネレータのソースコード（[pages ディレクトリ](https://github.com/azyobuzin/blog/tree/7913138eff88596512ec8403c17005bba57beb31/generator/pages)）を見てください。

## まとめ

以上が AsciiDoc を捨てて Markdown に移行した理由と、新しい静的サイトジェネレータの実装でした。 HTML が置いてあるトラディショナル静的サイトであることをモットーにしているので、このような構成が落ち着きますね。これからは Asciidoctor のドキュメントとにらめっこせず、 HTML を書いていきます。ブログ書けよ。
