---
pubdate: 2020-04-04T02:29+09:00
tags: [tech, Web]
sectnums: true
---

# さよならはてなブログ、こんにちはGatsby

Qiita 騒動で脱 Qiita といって静的サイトジェネレータに向き合うみなさん、こんにちは。私はほとんど Qiita に書いていない、根っからのはてなブログユーザーだったのですが、以前からいくつかの理由で脱はてなブログしたいなぁ～と考えており、本日ついに、自前のブログ基盤ができたので、移行していきたいと思います！

一発目の記事ということで、ブログの要件と、それに合わせてどうツールを選んだのかについて、書き残しておきたいともいます。

<ab-insblock datetime="2021-09-24">

AsciiDoc をやめ Markdown に移行しました。

[<cite>結局ブログをMarkdownで書くことにした話</cite>](/2021/09/24/01-markdown/)

</ab-insblock>

## なぜ脱はてなブログ

1. URL の永続化

   簡単に言えば、独自ドメインが良かった。例えば、はてなブログが突然サービスを終了すると言い出したら、今までの記事の URL は無効になってしまいます。そこで、独自ドメインに載せておけば、いざというときに URL を破壊せず、移行することができます。しかし、はてなブログ Pro は、少なくとも私のブログの利用状況に対して、料金が高い。高いよぉ。

   とはいえ、もうすでにはてなブログに投稿してしまった分はどうしようもないので、このままにしておきます。もしサービスが終了するようなことがあって、私がまだ生きていたら、いくつかはこのドメイン下にコピーして来ようと思います。

2. マークアップ言語

   はてな記法は悪くないけど、 `<code>` タグを書きまくるのはつらかった。一方で Markdown は、はてな記法より表現力が低くて、あまり楽しく書けませんでした。

3. （広告のロードが遅いので、全体的に遅く感じる）
4. なぜ Qiita ではないのか
   <figure class="fig-quote">
   <blockquote cite="https://mstdn.maud.io/@azyobuzin/103884235813994300">
   Qiita なんて承認欲求が通常のブログより満たせる以外のメリット何一つないのに、その一点のメリットに負けた人たちが使うサービスでしょゲラゲラって言ってる
   </blockquote>
   <figcaption><a href="https://mstdn.maud.io/@azyobuzin/103884235813994300">@azyobuzin@mstdn.maud.io</a></figcaption>
   </figure>

## このブログの技術構成

上記の要件を踏まえて、マークアップ言語に AsciiDoc（処理系として [Asciidoctor.js](https://github.com/asciidoctor/asciidoctor.js)）を、静的サイトジェネレータに [Gatsby](https://www.gatsbyjs.org/) を選択しました。本当は、管理画面とか欲しいので、静的サイトじゃないほうが好きなのですが、バージョン管理を考えると、実装したくないなぁという気持ちになりました。

デザインについては [Milligram](https://milligram.io/) を使用しました。もともとは 1 から CSS を組んでいたのですが、 Asciidoctor が要求する要素が多すぎて面倒になって、 CSS フレームワークに乗せました。

## なぜ AsciiDoc

なぜ Markdown ではないのか。

プレーンな Markdown （GitHub Flavored ではない）を思い出してください。機能が何もかも足りていないですね。

Markdown 処理系を思い出してください。いくつ方言があるんだよお前ら。

というわけで、プレーンな Markdown は弱すぎ、方言はみんなバラバラ、 Markdown 対応サービス間でもコピペしたあとに修正を加えるなんて日常茶飯事な、そんなマークアップ言語で書きたくはありません。そこで、もともと機能が豊富で、さらに要素の拡張方法も仕様に含まれている AsciiDoc を採用することにしました。機能豊富なぶん、 HTML への変換結果と、それに必要なスタイルシートがつらいという問題はありますが、該当機能を使うまでは問題を先延ばしにできます。先延ばしていけ。

## なぜ Gatsby

Gatsby、こいつだけはないなと思っていたツールでした。それなのに今は……。そういうラブコメ好きですよ。

静的サイトジェネレータといえば、 Jekyll を筆頭に、有名なものがいくつかありますが、大体どれも共通の問題があり、それは Frontmatter（文書の先頭の `---` から始まる YAML ブロック）が必要ということです。こっちは AsciiDoc で書くつもりですから、そもそも Header Attribute という機能があります。それにも関わらず、 Jekyll も Hugo も Frontmatter を使うんです。許さない。

そんな状況なので、既存の静的サイトジェネレータに嫌気がさして、自作を始めましたが、ブログとなるとトップページの記事一覧を作ったり、タグがあったりと考えることが多い上、 HTML テンプレートの処理系に与えるヘルパー関数すら無い状況からのスタートだったので、疲れて飽きてしまいました。

そこで、改めて AsciiDoc を使える静的サイトジェネレータを調べていたとき、 Gatsby + AsciiDoc の組み合わせを見て、ふと Gatsby で AsciiDoc を読み込むプラグインである [gatsby-transformer-asciidoc のソースコード](https://github.com/gatsbyjs/gatsby/tree/master/packages/gatsby-transformer-asciidoc)を読んでみたら、「なんだ、 Gatsby いいじゃん」となって、今に至ります

なぜ今まで Gatsby を避けてきたかというと、それはもう人々が声高に React！ PWA！ GraphQL！ モダン！ と叫んでいたからです。バズワードで埋め尽くされた、目的に対して無駄に遠回りなツールだと思っていました。こっちは 静的 HTML を吐き出したいんだ。静的と言いながらブラウザに大量のスクリプトを吐き出させるなんてごめんだという気持ちです。しかし、ちゃんと調べてみたら、まぁ無駄に遠回りなところもありますが、悪くないツールだということがわかりました。

### 静的サイトジェネレータで GraphQL ってどういうこと？

Gatsby の基本的な設計は、[ライフサイクルの図](https://www.gatsbyjs.org/docs/gatsby-lifecycle-apis/#high-level-overview)がわかりやすいのですが、次のようになっています。

1. 入力データを集める
2. 入力データを View に合わせて整形する
3. View をレンダリングする

「入力データを集める」では、このブログで言えば、ブログの設定や、記事のファイルがあります。ほかには、例えば時事的な内容で考えると、コロナウィルスの感染状況のオープンデータ（ローカルファイルまたは外部リソースとしてダウンロードしてくる）を入力とする、というのが考えられますね。そして、集めたデータを View、ここでは React に渡して、ブラウザで表示できる形式に変換します。

では、この流れの中のどこで GraphQL が登場するのかというと、それは、集めた入力データが「オブジェクトの森」として表され、この森の中から、 View に必要なデータを過不足なく取得するときの記述方法として、 GraphQL が向いている、という話になります。

#### 入力データを集める

入力データは、さまざまな形式であることが考えられるので、プラグイン機構によって柔軟に処理できることが求められます。

入力データを集めるだけでも、データソースからの取得と、データの解釈の 2 種類があります。前者は、ファイルシステムやインターネットからデータを取得してきます。後者は、例えば、データが Markdown なら、 Frontmatter を処理したり、 HTML に変換したりして、バイト列から View で使える意味のあるデータに変形します。

さて、この取得・解釈パイプラインにおいて、ひとつのデータについて、ひとつの解釈とは限りません。複数のプラグインが同じデータを異なる方法で解釈することもあります。つまり、まっすぐなパイプラインにはなりません。そこで Gatsby が採用した、共通の入力データ形式は「オブジェクトの森」でした。あるデータに対する解釈は、そのデータの子オブジェクトになる、と表現します（[](#image-forest-example)）。このような表現を用いることで、非常に柔軟に入力データを扱うことができるようになりました。

<figure id="image-forest-example" class="fig-img" data-num="図">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200403/20200403235038.png" alt="" loading="lazy" width="500" height="243.5" />
<figcaption>データと、データの解釈結果オブジェクト</figcaption>
</figure>

さて、ここで入力データを集めてできたオブジェクトの森をどのように扱うか、というのが鍵になります。静的サイトなので、 DB を使うことはできませんから、サイト生成時に集めてきた情報を、ページごとに、表示に必要なだけ抽出する必要があります。そこで、 JavaScript Way ということで、抽出してきたデータが JSON 形式なっていると考えましょう。すると、 JSON を入力とする React コンポーネントを作れば、レンダリングができそうですね。

### GraphQL と Gatsby のビルドプロセス

必要なものは、オブジェクトの森からデータを取り出し、 JSON を作成する方法だということがわかりました。そこで満を持して GraphQL の登場です。 GraphQL はオブジェクトの森に対して柔軟なクエリを記述でき、出力が JSON となります。完璧にマッチしますね。

では、どのタイミングで、どのクエリが呼び出されるのでしょうか。答えは、ビルド時にすべてのクエリです。

まず、 Gatsby をまだ触っていない方のために、クエリの書き方を紹介します。あるページ `/hoge` に対応する `pages/hoge.js` があったとして、次のように、 `query` または `pageQuery` を `export` することでクエリを指定すると、 `export default` している関数の引数に `data` として、そのクエリの結果が代入されます。

<figure class="fig-code">
<figcaption>pages/hoge.js</figcaption>

```js
import React from "react"
import { graphql } from "gatsby"

export default function ({ data }) {
  const title = data.site.siteMetadata.title
  return <p>{title}</p>
}

export const query = graphql`
  query HogePage {
    site {
      siteMetadata {
        title
      }
    }
  }
`
```

</figure>

または、 [StaticQuery](https://www.gatsbyjs.org/docs/static-query/) コンポーネントを使うことができます。

これをビルドツールの観点から見ると、実行するべきクエリは、すべてのページの `query` または `pageQuery`、それと、一度だけ各ページをレンダリングしてみることで、 `StaticQuery` から取得することができます。 Gatsby は、このようにすべてのクエリを収集し、クエリ結果を JSON ファイルとして保存します。

結果がすべて JSON ファイルとして保存してあると、 Gatsby の特徴である、静的ページの生成と、 Single Page Application の両立をすることができます。 SPA において、 GraphQL クエリ部分が、実行済みクエリ結果をダウンロードするよう振る舞えば、それ以外はただの React アプリになっているので、普通に React の SPA になってしまうのです。そして静的ページ生成は、 React の Server Side Rendering を行うだけになります。

というわけで、なぜ静的サイトジェネレータが GraphQL とかいう大層なものを取り出したのか、までつながりました。納得すると、 Gatsby 悪くないなと思えてきました。

## ここがつらいよ Gatsby

このブログの構築に必要だったワークアラウンド集です。

### ブラウザにとって静的なサイトになりたい

Gatsby がなぜ GraphQL を使っているのかについては、納得しました。しかし私が作りたいのは React でできたサイトではなく、ブログ本文が書かれた HTML が置いてあるだけのシンプルなブログです。 PWA でプリロード？ 知らん、読むかもわからんページを先読みしたところでたかが知れてるし、そのスクリプト分だけデータ量は増え、ブラウザの負荷もあります。エコじゃない。

しかしまぁ、一応は Server Side Rendering 済み HTML が吐き出されるので、やりようでどうにかできます。 [gatsby-plugin-no-javascript](https://www.gatsbyjs.org/packages/gatsby-plugin-no-javascript/) という過激な名前のサードパーティープラグインがあり、吐き出される HTML の `script` タグを全部消し去ります。今は特に動的な部分はないので、これで満足しています。

あと、 SPA という前提に立っているので、デフォルトでは CSS が HTML の `style` タグに全部入っています。外部リソースのダウンロードを減らす目的でしょうけれど、スクリプトを無効化すると、サイト内リンクは React 内でのルーティングではなく普通のリンクになるので、各ページに CSS が埋め込まれていると逆効果になりそうです。そこで `style` タグではなく `link` タグにしておきたいです。 `link` タグへの変換は、ビルド中のフックで、簡単にできます（[元ネタ](https://github.com/gatsbyjs/gatsby/issues/1526#issuecomment-583740341)）。

<figure class="fig-code">
<figcaption>gatsby-ssr.js</figcaption>

```js
const React = require("react")

exports.onPreRenderHTML = ({ getHeadComponents, replaceHeadComponents }) => {
  replaceHeadComponents(
    getHeadComponents().map((el) => {
      if (el.type !== "style") return el
      const href = el.props["data-href"]
      return href ? <link rel="stylesheet" href={href} /> : el
    }),
  )
}
```

</figure>

### 公式の AsciiDoc プラグインでは満足できない

Gatsby で AsciiDoc を扱うには、公式より [gatsby-transformer-asciidoc](https://www.gatsbyjs.org/packages/gatsby-transformer-asciidoc/) プラグインが提供されており、これを使うのが一般的だと思います。しかし、 Header Attribute の取得があまり自由にできず、 `page-` から始まる Header Attribute しか取得できません。これは、 Asciidoctor が使用するような AsciiDoc 的に一般的に用いられる属性と合わせられないという問題のほかに、まだ実装していませんが、数式表示が必要かを表す `:stem:` を取得できないと、数式レンダリングライブラリをロードするべきかの判断ができない問題もあります。

この問題については、 gatsby-transformer-asciidoc の代わりを、適当に自作することにしました。 Asciidoctor.js を呼び出すだけなので、そんなに大がかりではありません。

### 「#」を含むパス問題

私のブログなので、今後「C#」といったタグをつけた記事が出てくることが予想されるので、先に実験しておきました。タグのパスは `/tags/:tag` の形式なのですが見事に死亡しました。「#」をエスケープすると 404 になり、エスケープしないとブラウザがフラグメント扱いします。

結局、 [`createPage`](https://www.gatsbyjs.org/docs/actions/#createPage) に渡すパスはエスケープせず、 [`<Link>`](https://www.gatsbyjs.org/docs/gatsby-link/) に渡すパスはエスケープすることでお茶を濁しました。この方法では、静的サイトとして振る舞う場合は問題なく動作しますが、 SPA として振る舞う場合は死にます。より良い方法があれば教えてください。

追記: Netlify にデプロイしようとしたら <samp>Deployed filenames cannot contain # or ? characters</samp> と怒られてしまいました。静的ファイルをホスティングするだけの分際で無駄な忖度をするんじゃないという気持ちになったので、 Vercel に移行しました。

## さいごに

下手な既存ツールで満足できない人間が、自前でブログを構築しようとすると、要求が膨らんで大変だということがよくわかりました。そんな中で、妥協点として Gatsby を採用しました。いくらか不満はありますが、解決できるだけの柔軟性はあるので、これからも仲良くやっていきたいと思います。

ブログを構築しようとして、何日を無駄にしたのでしょう。この 4 月より大学院に進学し、これから 2 年間どんな研究をするのかを考える大事な時期に、研究（文献調査）の進捗が出ていません。そんな時期に現実逃避していたら、数年の悲願であった自作ブログ基盤ができてしまいました。せっかくブログを作ったので、いろいろアウトプットできたらいいなぁと思います。
