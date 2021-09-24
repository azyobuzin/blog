---
pubdate: 2021-08-27T03:24+09:00
tags: [tech, C#, Android]
---

# Xamarin.Android アプリが例外で落ちるということ

TL;DR: Xamarin.Android のグローバル例外ハンドラは `AppDomain.UnhandledException`。これで Java の例外も拾えます。ただし、例外が発生したスレッドによってはうまく拾えないケースがあり、現在修正中です（[xamarin-android#6211](https://github.com/xamarin/xamarin-android/issues/6211)）。

## はじめに

ハンドルされない例外は、アプリにとって異常事態ですから、さっさと[切腹](https://github.com/xamarin/xamarin-android/blob/916d24b7d83a79853dd1d1cf060d327f98c46e77/src/java-runtime/java/mono/android/Seppuku.java)する必要があります。 Xamarin.Android アプリでは、 Java の例外と .NET の例外が入り混じり、境界ではそれぞれの例外に相互変換されています。では、相互変換を繰り返し、最終的に誰にもキャッチされなかった例外は、どのように処理されるのでしょうか？ そして、もし最後の砦、グローバル例外ハンドラを設定するなら、どこに設定するのが良いのでしょうか？

## 普通の Android アプリの死に方

まずはピュア Java の Android アプリを例外で落としてみましょう。適当な場所に `throw new RuntimeException();` と書けばいいだけですね。今回は `MainActivity.onStart` に仕込んでみます。これで起動した瞬間に落ちるはずです。

実行するとアプリが終了し、 logcat にはこのようなログが残ります。

```samp
E AndroidRuntime: FATAL EXCEPTION: main
E AndroidRuntime: Process: com.example.ochiruapplication, PID: 6823
E AndroidRuntime: java.lang.RuntimeException
E AndroidRuntime:        at com.example.ochiruapplication.MainActivity.onStart(MainActivity.java:18)
E AndroidRuntime:        at android.app.Instrumentation.callActivityOnStart(Instrumentation.java:1425)
E AndroidRuntime:        at android.app.Activity.performStart(Activity.java:7825)
E AndroidRuntime:        at android.app.ActivityThread.handleStartActivity(ActivityThread.java:3294)
E AndroidRuntime:        at android.app.servertransaction.TransactionExecutor.performLifecycleSequence(TransactionExecutor.java:221)
E AndroidRuntime:        at android.app.servertransaction.TransactionExecutor.cycleToPath(TransactionExecutor.java:201)
E AndroidRuntime:        at android.app.servertransaction.TransactionExecutor.executeLifecycleState(TransactionExecutor.java:173)
E AndroidRuntime:        at android.app.servertransaction.TransactionExecutor.execute(TransactionExecutor.java:97)
E AndroidRuntime:        at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2016)
E AndroidRuntime:        at android.os.Handler.dispatchMessage(Handler.java:107)
E AndroidRuntime:        at android.os.Looper.loop(Looper.java:214)
E AndroidRuntime:        at android.app.ActivityThread.main(ActivityThread.java:7356)
E AndroidRuntime:        at java.lang.reflect.Method.invoke(Native Method)
E AndroidRuntime:        at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:492)
E AndroidRuntime:        at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:930)
```

さて、例外の中身を知っているのは例外を起こしたプロセスだけですから、このログを吐き出した犯人を探すことで、 Android のグローバル例外ハンドラを探すことができそうです。 [Android Code Search](https://cs.android.com/) で「FATAL EXCEPTION」と検索すると、[それっぽい行](https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/com/android/internal/os/RuntimeInit.java;l=80;drc=56ab231a8fa86f4aa5107d9248d2cf6285469edb)が見つかりました。

さらに呼び出し元を調べることで仕組みがわかります。プロセス起動時（Zygote からフォークした直後）に呼びされる `RuntimeInit.commonInit` に次のようなプログラムが入っています。

<figure class="fig-code">
<figcaption><a href="https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/com/android/internal/os/RuntimeInit.java;l=225-231;drc=56ab231a8fa86f4aa5107d9248d2cf6285469edb">RuntimeInit.commonInit の一部</a></figcaption>

```java
LoggingHandler loggingHandler = new LoggingHandler();
RuntimeHooks.setUncaughtExceptionPreHandler(loggingHandler);
Thread.setDefaultUncaughtExceptionHandler(new KillApplicationHandler(loggingHandler));
```

</figure>

Java が管理するスレッドで発生した例外は、スレッド自体に例外ハンドラを設定していなければ `Thread.setDefaultUncaughtExceptionHandler` で設定したハンドラで処理されます。 Android では `RuntimeInit$KillApplicationHandler` が設定されており、これが最後の砦をやっています。また、 Android には Java 標準の `Thread` クラスにはない `setUncaughtExceptionPreHandler` があり、もしデフォルトのハンドラがアプリのコードによって書き換えられたとしても、 `RuntimeInit$LoggingHandler` だけは呼び出されて、 logcat に例外ログが吐きだされるようになっています。

`KillApplicationHandler` は、 `ActivityManager` サービスに後処理（アクティビティを終了させ、必要ならばクラッシュダイアログを表示する）を任せて、プロセスを終了します。

まとめ: Xamarin ではないピュアな Android アプリでは、基本的にすべてのスレッドを Java が管理しているので、 `Thread.setDefaultUncaughtExceptionHandler` で設定したハンドラによって未ハンドルの例外が処理されます。 Android ではハンドラとして `com.android.internal.os.RuntimeInit$KillApplicationHandler` が設定されており、アクティビティとプロセスの終了を担っています。

## Xamarin アプリを例外で落とす

同じことを Xamarin.Android でやってみましょう。 `MainActivity.OnStart` に `throw new Exception();` を仕込んで実行すると、このようなログが得られます。

```samp
E AndroidRuntime: FATAL EXCEPTION: main
E AndroidRuntime: Process: com.companyname.ochiruappxamarin, PID: 9701
E AndroidRuntime: java.lang.RuntimeException: java.lang.reflect.InvocationTargetException
E AndroidRuntime: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:502)
E AndroidRuntime: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:930)
E AndroidRuntime: Caused by: java.lang.reflect.InvocationTargetException
E AndroidRuntime: 	at java.lang.reflect.Method.invoke(Native Method)
E AndroidRuntime: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:492)
E AndroidRuntime: 	... 1 more
E AndroidRuntime: Caused by: java.lang.Exception
E AndroidRuntime: 	at crc64a14461782825e2ee.MainActivity.n_onStart(Native Method)
E AndroidRuntime: 	at crc64a14461782825e2ee.MainActivity.onStart(MainActivity.java:55)
E AndroidRuntime: 	at android.app.Instrumentation.callActivityOnStart(Instrumentation.java:1425)
E AndroidRuntime: 	at android.app.Activity.performStart(Activity.java:7825)
E AndroidRuntime: 	at android.app.ActivityThread.handleStartActivity(ActivityThread.java:3294)
E AndroidRuntime: 	at android.app.servertransaction.TransactionExecutor.performLifecycleSequence(TransactionExecutor.java:221)
E AndroidRuntime: 	at android.app.servertransaction.TransactionExecutor.cycleToPath(TransactionExecutor.java:201)
E AndroidRuntime: 	at android.app.servertransaction.TransactionExecutor.executeLifecycleState(TransactionExecutor.java:173)
E AndroidRuntime: 	at android.app.servertransaction.TransactionExecutor.execute(TransactionExecutor.java:97)
E AndroidRuntime: 	at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2016)
E AndroidRuntime: 	at android.os.Handler.dispatchMessage(Handler.java:107)
E AndroidRuntime: 	at android.os.Looper.loop(Looper.java:214)
E AndroidRuntime: 	at android.app.ActivityThread.main(ActivityThread.java:7356)
E AndroidRuntime: 	... 3 more
I MonoDroid: UNHANDLED EXCEPTION:
I MonoDroid: Java.Lang.RuntimeException: java.lang.reflect.InvocationTargetException ---> Java.Lang.Reflect.InvocationTargetException: Exception of type 'Java.Lang.Reflect.InvocationTargetException' was thrown. ---> Java.Lang.Exception: Exception of type 'Java.Lang.Exception' was thrown.
I MonoDroid:   at OchiruAppXamarin.MainActivity.OnStart () [0x0000d] in <c931122de5944a1da7dcf64a7158eefa>:0
I MonoDroid:   at Android.App.Activity.n_OnStart (System.IntPtr jnienv, System.IntPtr native__this) [0x00008] in <db0280fb1b254cf889f3a750ac3ea0bb>:0
I MonoDroid:   at (wrapper dynamic-method) Android.Runtime.DynamicMethodNameCounter.5(intptr,intptr)
I MonoDroid:    --- End of inner exception stack trace ---
I MonoDroid:    --- End of inner exception stack trace ---
I MonoDroid:   --- End of managed Java.Lang.RuntimeException stack trace ---
I MonoDroid: java.lang.RuntimeException: java.lang.reflect.InvocationTargetException
I MonoDroid: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:502)
I MonoDroid: 	at com.android.internal.os.ZygoteInit.main(ZygoteInit.java:930)
I MonoDroid: Caused by: java.lang.reflect.InvocationTargetException
I MonoDroid: 	at java.lang.reflect.Method.invoke(Native Method)
I MonoDroid: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:492)
I MonoDroid: 	... 1 more
I MonoDroid: Caused by: java.lang.Exception
I MonoDroid: 	at crc64a14461782825e2ee.MainActivity.n_onStart(Native Method)
I MonoDroid: 	at crc64a14461782825e2ee.MainActivity.onStart(MainActivity.java:55)
I MonoDroid: 	at android.app.Instrumentation.callActivityOnStart(Instrumentation.java:1425)
I MonoDroid: 	at android.app.Activity.performStart(Activity.java:7825)
I MonoDroid: 	at android.app.ActivityThread.handleStartActivity(ActivityThread.java:3294)
I MonoDroid: 	at android.app.servertransaction.TransactionExecutor.performLifecycleSequence(TransactionExecutor.java:221)
I MonoDroid: 	at android.app.servertransaction.TransactionExecutor.cycleToPath(TransactionExecutor.java:201)
I MonoDroid: 	at android.app.servertransaction.TransactionExecutor.executeLifecycleState(TransactionExecutor.java:173)
I MonoDroid: 	at android.app.servertransaction.TransactionExecutor.execute(TransactionExecutor.java:97)
I MonoDroid: 	at android.app.ActivityThread$H.handleMessage(ActivityThread.java:2016)
I MonoDroid: 	at android.os.Handler.dispatchMessage(Handler.java:107)
I MonoDroid: 	at android.os.Looper.loop(Looper.java:214)
I MonoDroid: 	at android.app.ActivityThread.main(ActivityThread.java:7356)
I MonoDroid: 	... 3 more
I MonoDroid:
```

見覚えのある前半と、見覚えのない後半ですね。ということは、 `RuntimeInit$LoggingHandler` は呼び出されるようです。 Java のスレッドで例外が発生しているので、 .NET の例外は JNI を通して Java 側にスローされていきます。なので Java のスレッドの例外ハンドラが処理しているのは不思議ではないですね。

では後半のログを出しているのは一体誰なのでしょうか？ 答えは `Thread.getDefaultUncaughtExceptionHandler()`（C# では `Java.Lang.Thread.DefaultUncaughtExceptionHandler`）を取得してみるとわかります。 Xamarin.Android の初期化メソッドが存在する `mono.android.Runtime` クラスの静的コンストラクタで、デフォルト例外ハンドラを独自に設定しています。

<figure class="fig-code">
<figcaption><a href="https://github.com/xamarin/xamarin-android/blob/681887ebdbd192ce7ce1cd02221d4939599ba762/src/java-runtime/java/mono/android/Runtime.java#L13-L15">Runtime.java の一部</a></figcaption>

```java
static {
    Thread.setDefaultUncaughtExceptionHandler (new XamarinUncaughtExceptionHandler (Thread.getDefaultUncaughtExceptionHandler ()));
}
```

</figure>

このハンドラでは、 Xamarin.Android 独自の処理をしたあと、もともと設定してあったハンドラに処理を投げています。つまり、処理順は PreHandler である `LoggingHandler` が呼び出されたあと、 Xamarin.Android 独自の処理をして、最後に `KillApplicationHandler` を実行する、という順番になります。

Xamarin.Android 独自の処理の中身は [`JNIEnv.PropagateUncaughtException`](https://github.com/xamarin/xamarin-android/blob/ab0ed93cc88863b226c917dfef1fa62979c6ead8/src/Mono.Android/Android.Runtime/JNIEnv.cs#L284) にあります。このメソッドの中には、ログにあった「UNHANDLED EXCEPTION」が見つけられます。また、ここで受け取った例外は `AppDomain.UnhandledException` に投げられることがわかります。

まとめ: Java のスレッドで発生した例外は、 Xamarin.Android 独自のハンドラで処理されます。このハンドラは `AppDomain.UnhandledException` イベントを発生させたあと、 Android の標準ハンドラである `KillApplicationHandler` を呼び出すことで Android に後片付けを任せます。

## .NET のスレッドで例外を起こす

ここまで Java のスレッドで例外を発生させてきました。しかし、 .NET でもスレッドを作成することができます。 .NET のスレッドで例外が発生した場合はどのように処理されるのでしょうか？

前回の実験コードの `throw new Exception();` を `new Thread(() => throw new Exception()).Start();` に書き換えて試してみましょう。実行すると logcat のエラーログはこんな感じになりました。

```samp
F mono-rt : [ERROR] FATAL UNHANDLED EXCEPTION: System.Exception: Exception of type 'System.Exception' was thrown.
F mono-rt :   at OchiruAppXamarin.MainActivity+<>c.<OnStart>b__2_0 () [0x00000] in <605572ca36544c48913788216f21b753>:0
F mono-rt :   at System.Threading.ThreadHelper.ThreadStart_Context (System.Object state) [0x00014] in <1b39a03c32ec46258a7821e202e0269f>:0
F mono-rt :   at System.Threading.ExecutionContext.RunInternal (System.Threading.ExecutionContext executionContext, System.Threading.ContextCallback callback, System.Object state, System.Boolean preserveSyncCtx) [0x00071] in <1b39a03c32ec46258a7821e202e0269f>:0
F mono-rt :   at System.Threading.ExecutionContext.Run (System.Threading.ExecutionContext executionContext, System.Threading.ContextCallback callback, System.Object state, System.Boolean preserveSyncCtx) [0x00000] in <1b39a03c32ec46258a7821e202e0269f>:0
F mono-rt :   at System.Threading.ExecutionContext.Run (System.Threading.ExecutionContext executionContext, System.Threading.ContextCallback callback, System.Object state) [0x0002b] in <1b39a03c32ec46258a7821e202e0269f>:0
F mono-rt :   at System.Threading.ThreadHelper.ThreadStart () [0x00008] in <1b39a03c32ec46258a7821e202e0269f>:0
```

ついに Java っぽいログが出なくなりました！

これはどういうことかというと、何の細工もなく、 Mono がプロセスを終了しています。普通の .NET アプリと同じです。 Java 側にはまったく通達されません。

まとめ: .NET のスレッドで例外が発生すると Mono によってハンドルされ、普通の .NET アプリのようにプロセスが終了します。

## 総まとめ

Java が管理するスレッドで例外が発生しても、 .NET が管理するスレッドで例外が発生しても、とりあえず `AppDomain.UnhandledException` が呼び出されるので、これが最強の例外ハンドラです。

## おまけ: AndroidEnvironment.UnhandledExceptionRaiser って何？

Xamarin.Android の例外処理を調べたことがある人は、 `AndroidEnvironment.UnhandledExceptionRaiser` が強そうな名前に見えて、使えそうに見えてしまったのではないでしょうか。しかし実際のところ、あんまり使い道はありません。

`AndroidEnvironment.UnhandledExceptionRaiser` イベントは、 .NET で発生した例外を Java の例外に変換するときに発生します。例えば、今まで `OnStart` メソッドで `throw new Exception();` をする例を示してきましたが、 `OnStart` メソッドの呼び出し元は Java なので、 Java の例外に変換する必要があります。

このイベントにハンドラを設定しない場合、もしくはいずれのハンドラも `e.Handled = true` をセットしない場合はデフォルトの挙動をします。デフォルトの挙動は、 .NET の例外を `Android.Runtime.JavaProxyThrowable` でラップし、 Java を例外状態（JNI の `Throw` 関数を呼び出す）にします。

使い道としては、 .NET で発生した例外を握りつぶして Java のプログラムを続行させたり（`e.Handled = true` をセットして何もしない）、 `Android.Runtime.JavaProxyThrowable` ではない独自の `Throwable` に変換したり（`JNIEnv.Throw` を呼び出す）、が考えられます。
