---
pubdate: 2021-09-29T15:27+09:00
thumbnail: https://pbs.twimg.com/media/E2eeQl3VcAAByCy?format=jpg&name=large
---

# Xperia Ace II (SO-41B) に関するメモ

こんにちは。 Xperia Ace II ユーザーです。どうもこのクソスマホ、もともとエントリークラスということもあり、あんまりレビューが荒れていない印象があります。しかし、使い込むほどにボロが出てくるので、もしも安さやサイズだけで買おうとしている皆様に警告をしようと思い、メモを残しておきます。

## なぜ買った？

<figure class="fig-tweet">
<blockquote class="twitter-tweet" data-dnt="true"><p lang="ja" dir="ltr">左から順に、最高、妥協、大妥協 <a href="https://t.co/dR0hfGfqec">pic.twitter.com/dR0hfGfqec</a></p>&mdash; あじょぶじん (@azyobuzin) <a href="https://twitter.com/azyobuzin/status/1398260223115030530?ref_src=twsrc%5Etfw">May 28, 2021</a></blockquote>
</figure>

もともと Xperia XZ1 Compact ユーザーでしたが、3年以上が経過し、ストレージ 32GB に限界を感じていたので乗り換えました。あまりにもコンパクトスマホが出ないので、来年の新商品を待とうと思い、つなぎとして安くてコンパクトな Ace II を買いました。今思うと XZ1 Compact は下取りに出さないで、ゲーム機として取っておけばよかったなぁと思いましたが後の祭り。

## ここが微妙だよ Ace II

ほぼ全部微妙です。なぜなら微妙な価格帯なので。それはともかく、いにしえの SoC に最新の Android を乗せたみたいな機種なので、そもそも動作が怪しいところがあります。というわけで、困る順に紹介していきます。

### モバイル Suica 関連が異常に遅い

残高を調べたい？ 余裕をもって行動しましょう。モバイル Suica アプリを起動したり、 Google Pay アプリで残高を更新すると、最低で 20 秒、最大で 2 分程度待つことになります。

チャージも同様です。私は Google Pay しか使ったことがないですが、チャージボタンを押してから通信が安定した場所で数分放置する必要があります。すぐに反映されることを期待してはいけません。また反映されないからといってやり直したら二重にチャージされます。必要なのは忍耐力です。

さて、最高に深刻なのが楽天ペイの Suica 連携機能です。これは運です。基本的にはこうなります。

<figure class="fig-img"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20210929/20210929143248.jpg" alt="エラーコード: AA_JRF3005" /></figure>

このエラーメッセージでググっても完全一致は見当たらなかったので、本当に機種依存バグ案件に思えます。「お問い合わせ先」は Suica になってるので、楽天ペイの案件をこの窓口に投げるのもなーという気持ちになって放置しています。

楽天ペイの Suica を使う方法は、スマホを再起動して、起動直後かつちょっと安定したくらいのタイミングで使うことです。運が良ければ楽天ペイ経由でチャージできるのではないでしょうか。

### 指紋認証がリセットされる

再起動すると、指紋認証の設定を変えていなくても、指を再登録したという扱いになります。例えば Bitwarden アプリだとこんな感じに。

<figure class="fig-img"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20211015/20211015162228.jpg" alt="「生体認証の変更が検出されました。マスターパスワードを使用してログインすると再度有効化できます。」" /></figure>

これが致命的なのが、住信SBIネット銀行のアプリで、指を再登録すると2要素認証の設定を最初からやり直すことになります。つまり再起動するたびに再設定する羽目に。

### Twitter がたびたび落ちる

かわいい美少女イラストを見ていると落ちます。画像表示回りに機種依存バグがありそうです。しんどいね。

### Wi-Fi の出力が弱すぎる

自宅では、もっともアクセスポイントから遠い部屋に生息しているのですが Wi-Fi 5 (11ac) の 5GHz がまったく安定しません。 XZ1 Compact ではギリギリセーフ、 iPad Air 2 は余裕という感じですが、 Ace II はギリギリアウトでした。単純に出力が弱そうという感じです。

ということもあって 11n (2.4GHz) をメインに使っています。が、どうあがいてもリンク速度が 65Mbps にしかならない（電波強度の問題ではなく、これが限界っぽい）ので、もう高速インターネットは諦めました。

### ゲームはできないと思え

そう思って買ったけど、想像以上に無理でした。

<figure class="fig-tweet">
<blockquote class="twitter-tweet" data-conversation="none" data-dnt="true"><p lang="ja" dir="ltr">なんとか回収してきたけど、ゲーム困難スマホすぎて画面遷移ごとに1年が経過しそうなレベル。画面移動だけで疲れて音ゲーやろうという気にならなかった…… <a href="https://t.co/n1yfwRXyTp">pic.twitter.com/n1yfwRXyTp</a></p>&mdash; あじょぶじん (@azyobuzin) <a href="https://twitter.com/azyobuzin/status/1435656383400067072?ref_src=twsrc%5Etfw">September 8, 2021</a></blockquote>
<figcaption>画面遷移ごとに10秒以上待たされて疲れてしまった図</figcaption>
</figure>

<figure class="fig-tweet">
<blockquote class="twitter-tweet" data-dnt="true"><p lang="ja" dir="ltr">Xperia Ace 2 ユナイトチャレンジ、ここで落ちるので終了 <a href="https://t.co/ziF7rTXryN">pic.twitter.com/ziF7rTXryN</a></p>&mdash; あじょぶじん (@azyobuzin) <a href="https://twitter.com/azyobuzin/status/1440895715316699138?ref_src=twsrc%5Etfw">September 23, 2021</a></blockquote><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
<figcaption>ポケモンユナイトの起動すら叶わなかった図</figcaption>
</figure>

ついでに、[「<cite>東京都 新型コロナウイルス感染症対策サイト</cite>」](https://stopcovid19.metro.tokyo.lg.jp/)のグラフを見るのもなかなかストレスフルです。ユニバーサルデザイン（軽量化）が求められている。

### そもそも Xperia ではない

Xperia といえばウォークマン由来のエフェクト機能ですよね。 XZ1 Compact には ClearAudio+ とか DSEE とかがありました。 Ace II にはそんなもの一切ありません。まぁ使わないので大した問題ではないのですが、これ本当に Xperia なのかな。

## 一応いいところも挙げましょう

### 安い、コンパクト

安いです。ノリで機種変できます。

コンパクト、嘘です。しかしこのスマホ巨大化時代においては相対的にコンパクトです。だから仕方なく買いました。仕方なく。

### 意外とマクロでピントが合うカメラ

カメラもまあまあお察しな性能で、適当に触って映えるということはほぼないのですが、扱い方がわかってくると、得意な撮り方がわかってきました。

かなり寄って撮影してもピントが合います。これは XZ1 Compact はちょっと苦手な部類だったはずなので、びっくりしました。

<figure class="fig-img">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20210909/20210909180236.jpg" alt="" />
<figcaption>丸亀製麵のトマたまカレーうどん</figcaption>
</figure>

あとは、すべて自動で任せないで、明るさを調整したり HDR のオンオフを切り替えたり、余裕があるときはしっかりパラメータをいじると、たまに当たりが出ます。

<figure class="fig-img">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20210925/20210925154247.jpg" alt="" />
<figcaption>何度か調整した玉ねぎ（泉の森 郷土民家園）</figcaption>
</figure>

## まとめ

やめとけ
