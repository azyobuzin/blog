---
pubdate: 2020-09-14T22:13+09:00
tags: [Docker]
---

# 結局、理想のネットワークは Docker で実現できなかった

[Cilium](https://cilium.io/) の Docker プラグインの導入を検討したものの、無理みがあった。ぱたり。

## イントロダクション

ケチケチしたインターネットライフに Kubernetes は無縁です。

以前、 Docker のネットワークに細かい設定ができないという不満があって、 Kubernetes の調査をしていたこともありました（[「<cite>Kubernetesで隔離Mastodonネットワークを作った</cite>」](https://azyobuzin.hatenablog.com/entry/2019/03/21/024504)）。しかしながら、趣味で動かしている web サーバに Kubernetes を導入するのは、ケチケチした人間には不可能です。メモリ 2GB (GMO の株主優待を受けて、スペックアップしました！) の VPS に詰め込めるだけのアプリを詰める、そういうことをしている人間にとっては、 Kubernetes の導入はデメリットの方が多くなります。

そんなわけで、私が管理しているサービスは、基本的に Docker Compose で管理されています。しかし、動かしているアプリも増えてきて、 Pleroma のような SSRF 対策も必要なアプリ（例: [「<cite>比較的安全に Docker で Pleroma サーバーを建てる</cite>」](https://azyobuzin.hatenablog.com/entry/2019/11/12/005317)）も出てくると、そろそろ真面目にネットワークポリシーを導入して、安心してコンテナを動かしたくなります。

しかしまぁどう検索しても Kubernetes の話しか出てこなくてキレそうだったわけですが、 [Cilium](https://cilium.io/) という仮想ネットワークツールが Docker のプラグインとして動いてくれるみたいなので、検証してみました。

## Docker ネットワークの課題

Docker 標準の bridge ネットワークの表現力を確認して、課題を確認します。

まず、 Docker のネットワークとは何かですが、隔離されたサブネットです。コンテナはネットワークに接続することで、そのサブネットの IP アドレスが与えられます。 `docker network connect` コマンドで接続できるので「接続」と書きましたが、「参加」という表現のほうがわかりやすいかもしれません。コンテナは 0 個以上のネットワークに参加することができます。

<figure class="fig-img">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200913/20200913020748.png" />
<figcaption>コンテナとネットワークの関係</figcaption>
</figure>

基本的なネットワークの種類である bridge ネットワークでは、ネットワークごとに次のような設定ができます。

1. ネットワーク内のコンテナ間で通信 (Inter Container Connectivity) できるようにするか
2. IP マスカレードを有効にするか = ホストの外に通信できるようにするか

これの何が不満かというと、コンテナ間の通信の可否はネットワーク単位でしか設定できないということです。

例えば、次の図のように、ふたつのアプリがひとつのデータベースを共有しているとします。前提がケチケチなので、アプリごとにデータベースのプロセスを分けたりしないという想定です。これを bridge ネットワークで実現しようとすると、DB、アプリ1、アプリ2が同一ネットワークに参加している必要があります。すると、アプリとデータベースの通信だけできればいいにも関わらず、アプリ同士の通信も可能になっています。これがまずい状況であるという例を示しましょう。アプリ1がクリティカルな情報を扱っているものの、認証は前段のリバースプロキシに任せている、とします。ここでアプリ2に脆弱性があったら、意図せずアプリ1のデータを認証なしで読み出してしまうかもしれません。

<figure class="fig-img">
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200913/20200913022141.png" />
<figcaption>DBを参照するふたつのアプリ</figcaption>
</figure>

このような想定をし始めると、 bridge ネットワークに不満を感じてくるでしょう。コンテナ間の通信を制御しているのは iptables なので、 iptables を直接いじってあげればどうにかできなくはないですが、自分でやりたくはないです。

## Cilium

とりあえず「docker network policy」でググってみてください。はい、 1 ページ目のすべてが Kubernetes ですね。というわけで、意外と Docker のネットワークを強固にしようという試みはやられていないようです。存在するネットワークプラグインは皆複数ノードをひとつのネットワークとして使えるようにするみたいなやつばかりです。そんな中で、やっと見つけてきたのが Cilium です。

Cilium も複数ノードをひとつのネットワークとして使えるようにするやつのひとつです。メインの用途は Kubernetes の仮想ネットワークです。 Kubernetes の仮想ネットワークといえば、クラスタ内がひとつのネットワークになっていて、初期状態では任意の Pod 同士で通信ができるやつです。そして、それを制限する方法として NetworkPolicy リソースがあります。 Cilium はこれを実現します。

Cilium が他の仮想ネットワークツールと違うところは、 Kubernetes がなくてもネットワークポリシーが設定できるところです。つまり単体で使い物になる！ ……はずでした。

## Getting Started

Cilium を Docker で使う例は、ドキュメントにこの 1 ページしかありません。ありがとうございました。

[<cite>Cilium with Docker & libnetwork ― Cilium 1.8.3 documentation</cite>](https://docs.cilium.io/en/v1.8/gettingstarted/docker/)

Debian 10 で試してみましたが、特に Linux の設定は必要なく、[サンプルの docker-compose.yml](https://github.com/cilium/cilium/blob/v1.8.3/examples/getting-started/docker-compose.yml) を投入するだけで起動することができました。

とにかく、この 1 ページを一通り読むと、ポリシー設定を突っ込むところまで体験できます。

メモリ使用量は Cilium + Consul で 100MB 弱と、まぁまぁ許容範囲内かなというところでした。

## で、何がダメだったの？

1. ポートバインディング (`--publish`) が使えない
2. ポリシーが永続化されない

### 1. ポートバインディングが使えない

`docker run -p 80:80 nginx` と書くとホストの 80 番ポートからコンテナの 80 番ポートにつながるやつです。 Cilium の Docker プラグインはこのオプションを実装していないので、指定しても何も起こりません。

改造して解決しようかと挑んだものの、別の課題を先になんとかしないといけないことがわかったので面倒になりました。

これは現実的な解決策があり、 Traefik を使ったリバースプロキシを host ネットワークに用意すればいいです。 Traefik 2 からは TCP のリバースプロキシもできるようになったので、 HTTP に限らず何でもいけます。

### 2. ポリシーが永続化されない

これが致命的。

ポリシーを設定しても永続化してくれません。 Consul や etcd がそこにあるのにどうして記憶してくれないの？

永続化されないということは Cilium が起動したときにポリシーを設定する必要があります。これが問題になるのは、特にマシンや Docker デーモンを再起動したときです。 Cilium が起動するのを待ち、ポリシーを設定するようなサイドカーを用意しておかないと、正しくポリシーが適用されません。このようなサイドカーの実装を考え始めると、どんどん制御ループ、つまり Kubernetes のコンセプトに近づいていきます。

## 結局

[K3s に最初に食いついた](https://azyobuzin.hatenablog.com/entry/2019/03/04/144245 "k3s の中身とメモリ使用量の調査")人間なので、諦めて K3s と仲良くするのが一番いいのかもしれません。うっ……。

<figure class="fig-quote">
<blockquote cite="https://twitter.com/azyobuzin/status/1251774353579978758">
働かざる者Kubeからずというように、個人の趣味プロジェクトでKubernetesを使うべきではない
</blockquote>
<figcaption><a href="https://twitter.com/azyobuzin/status/1251774353579978758">@azyobuzin</a></figcaption>
</figure>

## おまけ: IPv6 を使う

[サンプル](https://docs.cilium.io/en/v1.8/gettingstarted/docker/)をいくらか改造すると IPv6 も使えるようになります。

1. Vagrantfile の `cilium_opts` から `--enable-ipv6=false` を削除する
2. `cilium-net` を作成するコマンドで `--ipv6` を指定する

   ```
   docker network create --driver cilium --ipam-driver cilium --ipv6 cilium-net
   ```

これでコンテナに IPv6 アドレスが振られるようになります。が、 NAT が設定されないので外に出ていったパケットが帰ってこられなくなります。これは Cilium の Issue に積まれていますが、なかなか修正される様子がないです。ワークアラウンドとしては、自分で ip6tables を設定してねということです。

<figure class="fig-quote">

> Install an ip6tables MASQUERADE rule for IPv6 traffic leaving the node.
>
> ```
> ip6tables -t nat -A POSTROUTING ! -o cilium_+ -s f00d::/16 -j MASQUERADE
> ```

<figcaption><a href="https://github.com/cilium/cilium/issues/6320#issuecomment-442722329"><cite>Cilium needs ip6tables rules to route IPv6 packets · Issue #6320 · cilium/cilium</cite></a></figcaption>
</figure>
