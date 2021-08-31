---
pubdate: 2020-04-30T02:36+09:00
tags: [C#]
sectnums: true
---

# プロトコルから比較する Reactive Streams と TPL Dataflow

以前、[「<cite>いまさら使う TPL Dataflow</cite>」](https://azyobuzin.hatenablog.com/entry/2019/05/26/164155)で紹介した TPL Dataflow は、入力されたデータを並列に処理するプログラムを、ブロックの組み合わせで簡単に記述できるライブラリです。
[「<cite>類似品との比較</cite>」](https://azyobuzin.hatenablog.com/entry/2019/05/26/164155#%E9%A1%9E%E4%BC%BC%E5%93%81%E3%81%A8%E3%81%AE%E6%AF%94%E8%BC%83)で述べたように、 TPL Dataflow は、プッシュ型とプル型の両方の性質を持っており、送信者（<i>Producer</i>）が、受信者（<i>Consumer</i>）が処理しきれないほど大量のデータをプッシュしようとするとき、受信者がそのデータの受信を遅延させることで、データフロー内を流れるデータ量を制御します。

一方で、このような、大量のデータや時系列データ（イベント列）を入力し、データフロー内を流れるデータ量を制御しながら、並列にデータを加工する仕組みは、一般的に、特に Java のコミュニティでは [<dfn>Reactive Streams</dfn>](https://www.reactive-streams.org/) と呼ばれています。 Reactive Streams に用いられるインターフェイスは Java 9 で `java.util.concurrent.Flow` として標準ライブラリ入りしており、 RxJava や Akka Streams がこのインターフェイスの実装を提供しています（実際には、互換性のため [reactive-streams パッケージ](https://github.com/reactive-streams/reactive-streams-jvm)を通じて実装しています）。

C# においても Reactive Streams は他人事ではなく、 `java.util.concurrent.Flow` と同様のインターフェイスが [Reactive.Streams パッケージ](https://github.com/reactive-streams/reactive-streams-dotnet)として NuGet で配布されており、標準的なインターフェイスの座を狙っています。また Akka.NET Streams がこのインターフェイスの実装を提供しています。

いずれの方法も、 Reactive Extensions (Rx) 的なプッシュ型に対して、流量制限（<i>back pressure</i>）を導入することで、データ量を制御しています。この記事では、 Reactive Streams と TPL Dataflow をプロトコル（インターフェイスとその実装方法）から比較します。

## Reactive Streams

先に Reactive Streams のほうから導入していきましょう。 Reactive Streams の基本思想は、**受信者がどれだけデータを受け入れられるかを送信者に申告する**ことによって、流量の合意を取ります。

インターフェイスを見ていきましょう。 Reactive Streams では、送信者は <dfn>Publisher</dfn>、受信者は <dfn>Subscriber</dfn> と呼ばれます。 Publisher は Rx における Observable に対応し、 Subscriber は Observer に対応します。インターフェイスは次のようになっており、 `IPublisher.Subscribe` に、購読者のコールバックを表す `ISubscriber` インスタンスを渡すことによって、購読を開始します。

<figure>
<figcaption><a href="https://github.com/reactive-streams/reactive-streams-dotnet/blob/v1.0.2/src/api/Reactive.Streams/IPublisher.cs">IPublisher</a></figcaption>

```cs
public interface IPublisher<out T>
{
    void Subscribe(ISubscriber<T> subscriber);
}
```

</figure>

<figure>
<figcaption><a href="https://github.com/reactive-streams/reactive-streams-dotnet/blob/v1.0.2/src/api/Reactive.Streams/ISubscriber.cs">ISubscriber</a></figcaption>

```cs
public interface ISubscriber<in T>
{
    void OnSubscribe(ISubscription subscription);
    void OnNext(T element);
    void OnError(Exception cause);
    void OnComplete();
}
```

</figure>

`ISubscriber` について、 Publisher がデータを送信するために `OnNext` が呼び出され、 Publisher が送信すべきすべてのデータを送信しきったら `OnComplete` が呼び出されます。また Publisher でエラーが発生したら `OnError` が呼び出されます。 `OnComplete` または `OnError` が呼び出されたあとは、いずれのメソッドも呼び出されることはありません。このあたりのルールは Observer とまったく同じになっています。

`IObservable`、`IObserver` と比較して、 `Subscribe` の戻り値が `IDisposable` ではなく `void` ですが、これは [RxJava にあわせた](http://reactivex.io/RxJava/3.x/javadoc/io/reactivex/rxjava3/core/ObservableSource.html#subscribe-io.reactivex.rxjava3.core.Observer-)ためだと思われます。購読の解除には、 `ISubscriber.OnSubscribe` で受け取ることができる `ISubscription` を使います。

Observable と異なり、 Subscribe を呼び出した瞬間にデータが飛んでくる（`ISubscriber.OnNext` が呼び出される）ことはありません。 Publisher は Subscriber がどれだけのデータを受け取る準備があるかを確認してから、データを送信します。 Subscriber は、今どれだけのデータを受け取ることができるかを `OnSubscribe` で受け取った `ISubscription` インスタンスを通じて Publisher に申告します。 `ISubscription` は次のように定義されています。 `Request` メソッドに渡す引数が、どれだけデータを受信できるかを表します。 `Cancel` は先ほど説明した `IDisposable` の代わりとなるものです。

<figure>
<figcaption><a href="https://github.com/reactive-streams/reactive-streams-dotnet/blob/v1.0.2/src/api/Reactive.Streams/ISubscription.cs">ISubscription</a></figcaption>

```cs
public interface ISubscription
{
    void Request(long n);
    void Cancel();
}
```

</figure>

Reactive Streams は以上のインターフェイスとルールによって成り立っています。キーポイントは **Subscriber が Publisher に自分のキャパシティを伝え、 Publisher はそのキャパシティの範囲内で `OnNext` を呼び出す**ことによって、データを送信を行っているところです。流量についてプル型でありながら、データを送信するタイミングは自由（プッシュ型）というところでしょうか。

Reactive Streams には、 Rx と同様に、 **Hot な Publisher と Cold な Publisher があります**。 Hot と Cold の違いについては[「<cite>Rx入門 (13) - HotとCold - xin9le.net</cite>」](https://blog.xin9le.net/entry/2012/01/18/105003)が参考になります。ただし、 Reactive Streams では、 Rx と異なり流量制限があります。したがって、 Hot な Publisher や、時系列データを扱う Publisher が Subscriber に対してデータを送信しようとしたとき、キャパシティが足りない Subscriber がいる可能性があります。そのときに、どのような動作をするかは、実装次第です。例えば RxJava において Observable から Publisher に変換するときは、あふれた値を破棄したり、例外を送出したり、などの選択肢が与えられています（参考: [Observable#toFlowable](http://reactivex.io/RxJava/3.x/javadoc/io/reactivex/rxjava3/core/Observable.html#toFlowable-io.reactivex.rxjava3.core.BackpressureStrategy-)）。

最後に、シーケンス図で例を示しておきます。 2 件のデータを出力する Publisher と、データを 1 件ずつ処理することができる Subscriber を接続すると、次のように通信を行います。

<figure>
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200429/20200429204015.png" />
<figcaption>Reactive Streams のシーケンス図</figcaption>
</figure>

実際には、 Cold な Publisher を実装するときには、 `IPublisher` は `ISubscription` を作成するだけの存在となり、 `ISubscription` が実際に Subscriber と通信するような実装になります。

<figure>
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200429/20200429230100.png" />
<figcaption>Cold な Publisher のシーケンス図</figcaption>
</figure>

## TPL Dataflow

Reactive Streams は流量についてプル型とまとめましたが、 TPL Dataflow では逆の設計思想となっています。 TPL Dataflow では、**データをプッシュしてみて、失敗したらプルされるのを待つ**、という戦略を取ることによって、流量制限を実現しています。

登場人物の紹介です。 TPL Dataflow では、送信者は <dfn>Source</dfn>、受信者は <dfn>Target</dfn> と呼ばれます。どちらもデータフローを構成する要素で、これら構成要素のことを<dfn>データフローブロック</dfn>と呼びます。

まず、データフローブロック共通のインターフェイスである `IDataflowBlock` を導入します。 `Completion` はそのブロックがすべてのデータの処理が完了したら完了する（またはエラーとなる） `Task` を表します。 `Complete` と `Fault` は Reactive Streams の `ISubscriber.OnComplete`、`OnError` に対応するものですが、 Target 以外もこのメソッドを実装します。

<figure>
<figcaption><a href="https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.idataflowblock?view=netcore-3.1">IDataflowBlock</a></figcaption>

```cs
public interface IDataflowBlock
{
    Task Completion { get; }
    void Complete();
    void Fault(Exception exception);
}
```

</figure>

Source から Target への接続は、リンクと呼ばれます。リンクによって、 Source は Target を認知し、もし送信できるデータがあるならば、データを送信します。

まずは Source のインターフェイスを見てみます。ユーザーが `LinkTo` を呼び出すことによって、 Source から Target へのリンクが作成されます。戻り値の `IDisposable` を使って、リンクを解除できます。その他のメソッドは Target によって呼び出されます。

<figure>
<figcaption><a href="https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.isourceblock-1?view=netcore-3.1">ISourceBlock</a></figcaption>

```cs
public interface ISourceBlock<out TOutput> : IDataflowBlock
{
    IDisposable LinkTo(ITargetBlock<TOutput> target, DataflowLinkOptions linkOptions);
    TOutput ConsumeMessage(DataflowMessageHeader messageHeader, ITargetBlock<TOutput> target, out bool messageConsumed);
    bool ReserveMessage(DataflowMessageHeader messageHeader, ITargetBlock<TOutput> target);
    void ReleaseReservation(DataflowMessageHeader messageHeader, ITargetBlock<TOutput> target);
}
```

</figure>

対して、 Target のインターフェイスは、データを受信するための `OfferMessage` と、 Source の完了を受け取る `IDataflowBlock.Complete`、`Fault` になります。

<figure>
<figcaption><a href="https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.itargetblock-1?view=netcore-3.1">ITargetBlock</a></figcaption>

```cs
public interface ITargetBlock<in TInput> : IDataflowBlock
{
    DataflowMessageStatus OfferMessage(DataflowMessageHeader messageHeader, TInput messageValue, ISourceBlock<TInput>? source, bool consumeToAccept);
}
```

</figure>

さて、 `LinkTo` と `OfferMessage` だけで成り立つならば話は簡単だったのですが、流量制限を導入するために、 Source と Target は密接に通信する必要があります。

まず、いくつかのメソッドの引数に現れた [`DataflowMessageHeader`](https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.dataflowmessageheader?view=netcore-3.1) について説明します。中身は `long` 型の数値です。 Source が送信するメッセージには、 Source 内でユニークな（通常連番の） ID が振られます。この ID を用いて、どのメッセージについての呼び出しなのかを判定します（実際には、送信しようとしている最新のメッセージについてかどうかのアサーションを行うために用いられます）。

次に、 `OfferMessage` がどのように振る舞うかです。もし、 Target に空きがあり、データを受信することができるならば、 `DataflowMessageStatus.Accepted` を返して終わりです（ただし `consumeToAccept` 引数が `true` ならば、 Source の `ConsumeMessage` を呼び出す必要があります）。一方で、 Target に空きがなく、データを受信することができないとき、 `DataflowMessageStatus.Postponed` を返します。このとき Target は、受信できなかったメッセージの ID をキューに記録します。その後、空きができて受信できるようになったら、キューから ID を取り出し、 `ConsumeMessage` を呼び出すことによって、 Source からデータを受信します。ただし、 Source は複数のリンク先を持つことができ、 Target が `Postponed` を返したとき、他の Target へ送信しようとします。したがって、 `ConsumeMessage` を呼び出しても、データを取得できないことがあります。

`OfferMessage` は同一 ID のメッセージについて、複数回呼び出されることを許容する必要があります。これは Source のリンクが変更されたときに、再度送信を試みるためです。

`ReserveMessage`、`ReleaseReservation` については、最短一致モード（<i>non-greedy mode</i>）を実装するときと、 Source より先に Target が終了するときに Source にリンク解除を要求するために利用されます。

ここまでだらだらと文章で説明してきましたが、**アホほど面倒くさい**インターフェイスだということがわかったと思います。

最後に、 Reactive Streams と同じように、 2 件のデータを出力する Source と、データを 1 件ずつ処理することができる Target のシーケンス図を示します。ここでは、 `LinkTo` のオプションとして、完了を通知する <code><a href="https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.dataflowlinkoptions.propagatecompletion?view=netcore-3.1">PropagateCompletion</a> = true</code> を指定したものとします。

<figure>
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200429/20200429224922.png" />
<figcaption>TPL Dataflow のシーケンス図</figcaption>
</figure>

## 動作開始タイミングの違いについて

TPL Dataflow では、データフローブロック間のリンクが作成された時点で、 Source の準備ができていれば、データが送信されます。次の図は、 Source が送信したデータが Propagator（Target と Source の両方の性質を持つブロック）を経由して Target に到達するフローに対して、前から順にリンクを行ったときの動作の様子です。

<figure>
<img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200429/20200429232247.gif" alt="TPL Dataflow が動作を開始する様子" />
</figure>

一方で、 Reactive Streams では、上の図のような使い方もできますが、通常はフローを作成し、それに対して Subscribe を呼び出すことで実際の処理を開始する、という使い方のほうが一般的かと思います。例えば、次の RxJava の例では、 [`range`](http://reactivex.io/RxJava/3.x/javadoc/io/reactivex/rxjava3/core/Flowable.html#range-int-int-) という Publisher と、それを加工する `map` を接続したストリーム `flowable`（`Publisher<Integer>` を実装しています）を定義していますが、 `subscribe` を呼び出すまでは、何も処理を行いません。また、 `range` は Cold なストリームなので、複数回 `subscribe` すると、そのたびに値が送信されます。

```java
var flowable = Flowable.range(1, 1).map(x -> x + 1);
flowable.blockingForEach(System.out::println); // 2
flowable.blockingForEach(System.out::println); // 2
```

逆に TPL Dataflow で Cold なストリームを実現するには、フローの作成を関数で包むという方法が必要になります。

## 並列化について

Reactive Streams プロトコルでは、 `OnNext` を並行に呼び出すことを禁止されています。また TPL Dataflow も `OfferMessage` を並行に呼び出すことはできません（これを間違えて、デッドロックを起こした経験が……）。したがって、いずれのプロトコルも、ひとつの Publisher の境界を越えて並列化することはできません。そこで、それぞれの実装から、どのように処理の並列化を行っているかを見ていきましょう。

Reactive Streams の実装である RxJava では、並列部分については `Publisher` を実装しない独自の [`ParallelFlowable`](http://reactivex.io/RxJava/3.x/javadoc/io/reactivex/rxjava3/parallel/ParallelFlowable.html) 型で表されます。並列処理を終え、また直列なフローに戻るときに `Flowable`（`Publisher` の実装）で包み直します。

```java
var flowable = Flowable.range(1, 100) // Flowable
    .parallel() //  ParallelFlowable
    .runOn(Schedulers.computation())
    .map(x -> x + 1)
    .sequential() // Flowable
    .map(x -> x + 1);
```

TPL Dataflow では、各データフローブロックが並列に処理を行います。例えば、 `map` に相当する [`TransformBlock`](https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.transformblock-2?view=netcore-3.1) や、基本的な Target である [`ActionBlock`](https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.actionblock-1?view=netcore-3.1) はオプションとして [`MaxDegreeOfParallelism`](https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.executiondataflowblockoptions.maxdegreeofparallelism?view=netcore-3.1) を指定することで、データが並列に処理されます。また RxJava では、並列部分ではデータの順番が維持される保証がありませんが、 `TransformBlock` では <code><a href="https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.dataflowblockoptions.ensureordered?view=netcore-3.1">EnsureOrdered</a> = true</code> を指定することで、データの順番を維持できます。

いずれも実装の違いであり、インターフェイス上はどうにでもできます。

## それぞれのメリット、デメリット

### プロトコル

Reactive Streams のプロトコルには、一度 `Request` した数を取り消せないという問題があります。したがって、状況によって受け入れられるデータ量が増減するようなとき、もっとも保守的な手法、すなわち 1 件受け取っては `Request(1)` を呼び出すという非効率的な方法を取らざるを得なくなります。しかし、これが問題かというと、問題になるユースケースが特に思いつかないです。

一方 TPL Dataflow は、独自でデータフローブロックを実装するのが非常に難しいです。標準で提供されているブロックの組み合わせだけでなんとかしてくださいという感じです。

### 実装

Reactive Streams は、 Java では RxJava という最強の実装がありますが、 C# には Akka.NET Streams しかない状況です。 Akka.NET Streams は Akka のランタイムを必要とする重厚なものになっており、 RxJava ほど軽い気持ちで導入しにくいという印象があります。

TPL Dataflow は、半標準ライブラリな存在であり、品質も良いです。ただし、提供されているブロックは、有用ではありますが、もしかすると痒いところに手が届かないかもしれないなという品揃えです。ですが、先ほど述べたように、独自でデータフローブロックを実装するのはとても大変です（ある程度妥協できるなら、 [`DataflowBlock.Encapsulate`](https://docs.microsoft.com/ja-jp/dotnet/api/system.threading.tasks.dataflow.dataflowblock.encapsulate?view=netcore-3.1) という便利メソッドがあることは覚えておいてください）。

## C# で Reactive Streams とどう向き合うか

Rx と並んで登場した Ix (Interactive Extensions) には AsyncEnumerable が含まれていました。 .NET Standard 2.1 では [`IAsyncEnumerable`](https://docs.microsoft.com/ja-jp/dotnet/api/system.collections.generic.iasyncenumerable-1?view=netcore-3.1) が標準入りを果たしました。 AsyncEnumerable は、常に `Request(1)` を投げる Reactive Streams と見なすこともできます。

ここまで Reactive Streams と TPL Dataflow の比較をしてきましたが、**AsyncEnumerable が C# における Reactive Streams の大本命**なのでは、と考えています（正確にはこの章を書き始めて気づいた……）。「並列化について」で述べたように、 Reactive Streams はいくら上流にキャパシティを報告したところで、 `OnNext` を並行実行できません。したがって、キャパシティを報告することにあまり意味はなく、 AsyncEnumerable のように常にプル型でも問題ないと考えられます。キャパシティを気にする必要がある、流量の制御できないデータソースからの入力や、ある程度まとまったデータがないとパフォーマンスメリットがない並列化部分の前後にバッファを置くだけで解決できてしまいます。

一方で、並列処理という観点では TPL Dataflow は非常に良質なライブラリです。並列処理において困る部分が隠蔽されており、本質的な処理を書くことに集中できます。

現在の私の野心としては、 AsyncEnumerable のメソッドチェーンの中に、 TPL Dataflow を導入することと、 `IAsyncEnumerable` と `IPublisher` の相互変換です。前者によって、 AsyncEnumerable を並列に処理する表現力が向上します。後者は Akka.NET Streams のような Java 由来のライブラリで Reactive Streams の利用が考えられることから、相互変換が容易に行えると便利だという考えです。これらは現在開発中のライブラリ（[BiDaFlow](https://github.com/azyobuzin/BiDaFlow)）で実現できればなと考えています。

## おわりに

（Reactive Streams と TPL Dataflow を比較しようと思って書き始めたはずだったのに、最終的に AsyncEnumerable 最強という結論になってしまって :thinking_face:）
