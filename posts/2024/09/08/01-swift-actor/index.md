---
pubdate: 2024-09-08T00:45+09:00
tags: [tech]
---

# SwiftのActorについての備忘録

最近、本業の組織変更でスマホアプリとWebのハイブリッド担当になりました。というわけでSwiftを書く機会が多くなってきたものの、仕様を理解しきれてない部分があったのでメモです。

SwiftでiOSアプリを書いているとよく `@MainActor` というコードを書くことがあります。このアノテーションを指定した型や関数はメインスレッドで動きます。と、いうところまでは簡単なのですが、このようなアノテーションを指定することで、具体的にどういう動作をするのか、どのような制約が生まれるのか、が若干複雑だったので整理していきます。

## Actorとは何か

`@MainActor`アノテーションの説明の前に、actorというもの自体の説明をしましょう。

### 操作の直列化

actorはほぼclassのようなものですが、必ず処理が直列化されるという特徴があります。

例えば、次のMyActorはfooというメソッドを持っています。

```swift
actor MyActor {
  func foo() {
    // do something
  }
}
```

同一のMyActorインスタンスに対して、複数スレッドから同時にfooメソッドを呼び出すとどうなるでしょうか？

通常のクラスであれば、何も排他制御が行われず、呼び出し元スレッドで普通にfooメソッドが呼び出されます。

一方、actorの場合は、呼び出しがキューに積まれて、順番に処理されます。これがひとつのactorインスタンスに対する操作は直列化されるという意味です。

### awaitの強制

キューに積まれて順番に処理されるということは、完了を待機する必要があるということです。しかし、完了を待機する間に呼び出し元スレッドをブロックすることはありません。代わりにawaitを使用することが強制されます。

次の例では、トップレベルからMyActorのメソッドを呼び出すときにawaitを指定しています。awaitを外すとコンパイルエラーになります。

```swift
actor MyActor {
  func foo() {
    // do something
  }

  func bar() {
    // 同一actor内なのでawaitが不要
    foo()
  }
}

let myActor = MyActor()

// actorの外なのでawaitが必要
await myActor.foo()
```

このように、actorのメソッドをactor外から呼び出すにはawaitが必要になります。

また、actorのメソッドが別のactorの処理を待機している間は、別の処理を進めることができます。例えば、Actor1がActor2のメソッドを呼び出している間に、Actor1の別のメソッドが呼ばれたならば、待機中にそのメソッドの処理を進めることができます。

```swift
import Foundation

actor Actor1 {
  let actor2 = Actor2()

  func work1() async {
    // actor2を呼び出して待機。ここで1秒かかる。
    await actor2.work()
    print("work1")
  }

  func work2() {
    print("work2")
  }
}

actor Actor2 {
  func work() {
    Thread.sleep(forTimeInterval: 1)
  }
}

let actor1 = Actor1()
// work1とwork2を同時に呼び出し
async let task1: () = actor1.work1()
async let task2: () = actor1.work2()
_ = await (task1, task2)
```

```samp
work2
work1
```

### actorの処理はどのスレッドで動いている？

デフォルトでは、標準のスレッドプール上で処理が実行されます。actorインスタンスそれぞれにスレッドが割り当てられているわけではありません。標準のスレッドプール上で、それぞれのactorが直列になるようにスケジュールされて実行されています。

詳しくは、こちらの記事が参考になります: [Limit Swift Concurrency's cooperative pool | Alejandro M. P.](https://alejandromp.com/development/blog/limit-swift-concurrency-cooperative-pool/)

標準のスレッドプール以外を使うようにカスタマイズすることもできます。[unownedExecutorプロパティ](https://developer.apple.com/documentation/swift/actor/unownedexecutor/)をオーバーライドすることで、自由に実行方法を指定することができます。

次の例では、独自のスレッドを起動して、そのスレッド上で処理を実行するactorを実装しています。[SerialExecutorプロトコル](https://developer.apple.com/documentation/swift/serialexecutor)を実装したオブジェクトを作成し、unownedExecutorプロパティでその参照を返しています。

```swift
import Foundation

// ジョブとロックを管理するオブジェクト。ThreadとExecutorで共有する。
final class MyExecutorQueue: @unchecked Sendable {
  private var queue: [UnownedJob] = []
  private let cond = NSCondition()
  private(set) var isQuitted = false

  func enqueue(_ job: UnownedJob) {
    cond.lock()
    queue.append(job)
    cond.signal()
    cond.unlock()
  }

  func dequeueAll() -> [UnownedJob] {
    cond.lock()
    if queue.isEmpty { cond.wait() }
    let jobs = queue // copy
    queue.removeAll(keepingCapacity: true)
    cond.unlock()
    return jobs
  }

  func quit() {
    cond.lock()
    isQuitted = true
    cond.signal()
    cond.unlock()
  }
}

// ワーカースレッド
final class MyExecutorThread: Thread {
  private let queue: MyExecutorQueue
  private let executor: UnownedSerialExecutor

  init(queue: MyExecutorQueue, executor: UnownedSerialExecutor) {
    self.queue = queue
    self.executor = executor
  }

  override func main() {
    print("MyExecutorThread started")

    while !queue.isQuitted {
      for job in queue.dequeueAll() {
        job.runSynchronously(on: executor)
      }
    }

    print("MyExecutorThread finished")
  }
}

final class MyExecutor {
  private let queue = MyExecutorQueue()

  func startThread() {
    let thread = MyExecutorThread(queue: queue, executor: asUnownedSerialExecutor())
    thread.name = "MyExecutorThread"
    thread.start()
  }

  deinit {
    queue.quit()
  }
}

// SerialExecutorプロトコルの実装
extension MyExecutor: SerialExecutor {
  func asUnownedSerialExecutor() -> UnownedSerialExecutor {
    UnownedSerialExecutor(ordinary: self)
  }

  func enqueue(_ job: UnownedJob) {
    queue.enqueue(job)
  }
}

actor MyActor {
  let executor: MyExecutor

  init(executor: MyExecutor) {
    self.executor = executor
  }

  // このプロパティをデフォルト実装からオーバーライドすることで、独自の方法で処理を実行できる
  nonisolated var unownedExecutor: UnownedSerialExecutor {
    executor.asUnownedSerialExecutor()
  }

  func work() {
    print("MyActor is working!")
    print(Thread.current)
  }
}

let executor = MyExecutor()
let myActor = MyActor(executor: executor)
executor.startThread()
await myActor.work()
```

```samp
MyExecutorThread started
MyActor is working!
<customthread.MyExecutorThread: 0x7f9af1804230>{number = 2, name = MyExecutorThread}
```

## MainActorとはGlobalActorのひとつである

actorの挙動が理解できたところで、`@MainActor`の謎に迫っていきましょう。

`@MainActor`という構文があるのではなく、実際には[MainActorというactor](https://developer.apple.com/documentation/swift/mainactor)が標準ライブラリに存在しています。ドキュメントには次のように定義されています。

```swift
@globalActor
final actor MainActor
```

この`@globalActor`が肝です。`@globalActor`は[GlobalActorプロトコル](https://developer.apple.com/documentation/swift/globalactor)に準拠した型（actorである必要はありません）に付与することができるアノテーションです。

GlobalActorプロトコルは、次の定義を要求します。

```swift
protocol GlobalActor {
  associatedtype ActorType: Actor
  static var shared: Self.ActorType
}
```

この定義から、シングルトンのactorを提供するのがGlobalActorだといえます。

そして、`@globalActor`を付与された型は、`@MainActor`のように`@`をつけることでアノテーションとして使用することができます。

### GlobalActorの効果

まずは適当なGlobalActor `@MyActor`を定義します。

```swift
@globalActor
actor MyActor {
  // ActorTypeは型推論されるので明示的に書かなくてもOK
  static let shared = MyActor()
}
```

`@MyActor`を付与した関数を定義すると、actorと同じようなawaitの強制ルールが適用されるようになります。

```swift
@MyActor
func work1() {
  print("work1")
}

@MyActor
func work2() {
  // 同じ@MyActorの中なので、awaitなしで呼び出せる
  work1()
  print("work2")
}

// @MyActorの外なのでawaitが必要
await work1()
```

また、actorと同じように`@MyActor`を指定した処理同士で直列化されます。

次の例ではちょっと意地悪なことをしてみます。`@MyActor`を指定した関数同士（work1, work3）が直列に実行されるのは簡単に予想できます。では`MyActor.shared`のメソッドを呼び出した場合はどうなるでしょうか？

```swift
import Foundation

@globalActor
actor MyActor {
  static let shared = MyActor()

  func work2() {
    Thread.sleep(forTimeInterval: 2)
    print("MyActor.shared.work2")
  }
}

@MyActor
func work1() {
  Thread.sleep(forTimeInterval: 3)
  print("work1")
}

@MyActor
func work3() {
  Thread.sleep(forTimeInterval: 1)
  print("work3")
}

// 順番に同時に呼び出し。work2は@MyActorではなくMyActor.sharedのメソッド。
async let task1: () = work1()
async let task2: () = MyActor.shared.work2()
async let task3: () = work3()
_ = await (task1, task2, task3)
```

```samp
work1
MyActor.shared.work2
work3
```

結果は、`@MyActor`を指定した関数と`MyActor.shared`のメソッドは全部混ぜて直列化されました。このことから、`@MyActor`を指定すると、`MyActor.shared`と同じコンテキストで実行される（`MyActor.shared.unownedExecutor`を使って実行される）といえます。

### つまり`@MainActor`とは何であったか

ここまでの内容から`@MainActor`は次のような動作をするものだといえそうです。

- `@MainActor`を付与した型や関数は、`MainActor.shared.unownedExecutor`を使って実行される → このExecutorの実装がDispatchQueueを使うものになっている（ExecutorはコンパイラのBuiltinで実装されている）
- actorのルールに従って、awaitを強制されたりされなかったりする
