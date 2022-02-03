---
pubdate: 2020-09-28T02:29+09:00
tags: [tech, C#, Docker]
---

# Visual Studio と VSCode どちらでも使える Docker Compose 環境

開発環境を Docker でいい感じにしてくれるやつとして、 Visual Studio では「コンテナー開発ツール」が、 Visual Studio Code には Remote 拡張があります。これらは Dockerfile や docker-compose.yml を用意すると、その中でアプリを動かすことができるやつです。しかし、同じものではないので、挙動はまったく異なります。それぞれメリット、デメリットがあるので、両方使えるとうれしいわけです。そこで、うまいこと両方で使える docker-compose.yml を書いてみようという試みをやっていきます。

## それぞれのメリット、デメリット

コンテナ化、特に Docker Compose を使いたい理由として、クラサバ型データベースを開発環境に置きたいという欲求があります。適当にデバッグ実行したら適当なデータベースが動いていると便利です。というわけで、今回は PostgreSQL コンテナとアプリ開発環境が共存することを目標とします。

Visual Studio の Docker 連携は、コンテナにビルド結果とデバッガーの口をマウントして、コンテナ内でアプリを実行してくれます。メリットは、開発環境はホストにあるので、 Visual Studio をフルに使えることです。デメリットは、コンテナ内に入って何か操作するというのが面倒なところです。

VSCode Remote は、コンテナの中で VSCode が動きます。ホストのディレクトリをコンテナにマウントすることで、ホストのファイルを編集できます。メリットは、 VSCode のターミナルからコンテナ内を触り放題なところです。例えば Windows で開発していて、 Linux で動かしたい開発ツールがあるときには便利です。デメリットは、 Visual Studio に慣れた人間にとって、 VSCode の C# 拡張は不足を感じるところです。

データベースを置くという今回の仮定では、データベースを手で操作するときに簡単に環境に入るために VSCode を使いたいものの、メインの開発は Visual Studio でしたい、となり、共存させたい欲求が発生しています。

## やっていく

### 1. Visual Studio で連携を設定する

ここで説明する手順を実行するには、 Visual Studio 2019 で「ASP.NET と Web 開発」または「.NET Core クロスプラットフォームの開発」ワークロードがインストールされている必要があります。

ソリューションエクスプローラーで、 Docker で動かしたいプロジェクトを右クリックし、「コンテナー オーケストレーターのサポート」を追加します。

<figure class="fig-img"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200928/20200928004102.png" alt="「コンテナー オーケストレーターのサポート」を追加" /></figure>

いろいろ聞かれますが、 OS は Linux、ツールは Docker Compose としておけば OK です。

完了すると、 Dockerfile と「docker-compose」というプロジェクトが生えます。

<figure class="fig-img"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200928/20200928004106.png" alt="完了後のソリューション" /></figure>

これで、必要なファイルを Visual Studio に自動生成させることができました。ここから先は生成されたファイル書き換えたり移動させたりして VSCode にフィットさせていきましょう。

### 2. Dockerfile を改変する

生成された Dockerfile を確認すると、本番ビルド用のスクリプトが書かれています。今回はこれを完全に捨てることにします。ただ、プロジェクトディレクトリ下に Dockerfile がないと Visual Studio が認識してくれないので、ここに開発環境を作成するスクリプトを書きましょう。本番用 Dockerfile はどこか別のところに置いてください……。

最低限必要なのは `FROM mcr.microsoft.com/dotnet/core/sdk:3.1-buster` だけです。「buster」のところは好きなディストリビューションに変えてください。必要に応じて、例えば今回の仮定ならば postgresql-client を入れたりするのもいいでしょう。

### 3. docker-compose.yml を改変する

ここからの操作は Visual Studio を破壊するので、すべてが完了するまで Visual Studio は閉じておきましょう。

いま、ソリューションディレクトリ直下に「docker-compose.yml」と「docker-compose.override.yml」があります。直下にあってもわかりにくいので、後で devcontainer.json というファイルを入れることになる .devcontainer というディレクトリをつくっておき、そこに移動させます。

<figure class="fig-img"><img src="https://cdn-ak.f.st-hatena.com/images/fotolife/a/azyobuzin/20200928/20200928010233.png" alt="docker-compose.yml を .devcontainer へ移動" /></figure>

さらに、 docker-compose.override.yml という名前だと Visual Studio 用なのか VSCode 用なのかわかりにくいので、 docker-compose.vs.yml に改名しておくといいでしょう。

いま docker-compose.yml の中身はこのようになっていると思います。

<figure class="fig-code">
<figcaption>docker-compose.yml</figcaption>

```yaml
version: "3.4"

services:
  mydatabaseapp:
    image: ${DOCKER_REGISTRY-}mydatabaseapp
    build:
      context: .
      dockerfile: MyDatabaseApp/Dockerfile
```

</figure>

改変が必要なポイントは次のふたつです。

- `build.context` のパスを正しく直す。 docker-compose.yml を移動したので、それに合わせます。
- PostgreSQL を追加する。

改変結果はこんな感じです。 docker-compose.yml の構文バージョンやプロジェクト名は、環境に合わせて書き換えてください。

<figure class="fig-code">
<figcaption>docker-compose.yml</figcaption>

```yaml
version: "3.4"

services:
  mydatabaseapp:
    build:
      context: ..
      dockerfile: MyDatabaseApp/Dockerfile

  db:
    image: postgres:11
    environment:
      POSTGRES_PASSWORD: postgres
    volumes:
      - ./db/data:/var/lib/postgresql/data
```

</figure>

データベースのデータの永続化は、ホストのパスを指定するか、この docker-compose.yml の外で作成したボリュームを割り当ててください。でないと、 VS と VSCode で Docker Compose のプロジェクト名が異なるので、同じデータを見てくれません。

### 4. docker-compose.dcproj を改変する

docker-compose.yml を移動したので、 docker-compose.dcproj も書き換えます。これもソリューションディレクトリ直下にあると邪魔なので .devcontainer に移動させてしまいましょう。

さらにファイル名変更を反映して、ディレクトリ外に行ってしまった .dockerignore をプロジェクトから消します。

<figure class="fig-code">
<figcaption>docker-compose.dcproj</figcaption>

```diff
 <?xml version="1.0" encoding="utf-8"?>
 <Project ToolsVersion="15.0" Sdk="Microsoft.Docker.Sdk">
   <PropertyGroup Label="Globals">
     <ProjectVersion>2.1</ProjectVersion>
     <DockerTargetOS>Linux</DockerTargetOS>
     <ProjectGuid>3caba81b-3f76-4ecf-9907-78b96280d41c</ProjectGuid>
   </PropertyGroup>
   <ItemGroup>
-    <None Include="docker-compose.override.yml">
+    <None Include="docker-compose.vs.yml">
       <DependentUpon>docker-compose.yml</DependentUpon>
     </None>
     <None Include="docker-compose.yml" />
-    <None Include=".dockerignore" />
   </ItemGroup>
 </Project>
```

</figure>

またソリューションファイルもパスを書き換えます。

<figure class="fig-code">
<figcaption>MyDatabaseApp.sln</figcaption>

```diff
-Project("{E53339B2-1760-4266-BCC7-CA923CBCF16C}") = "docker-compose", "docker-compose.dcproj", "{3CABA81B-3F76-4ECF-9907-78B96280D41C}"
+Project("{E53339B2-1760-4266-BCC7-CA923CBCF16C}") = "docker-compose", ".devcontainer\docker-compose.dcproj", "{3CABA81B-3F76-4ECF-9907-78B96280D41C}"
```

</figure>

### 5. VSCode 向けの docker-compose.yml をつくる

VSCode 向けに .devcontainer/docker-compose.vscode.yml を作っていきます。ポイントは次のふたつです。

- コンテナが終了しないように無限ループさせる
- 作業ディレクトリをマウントする

実際の YAML で表すとこれだけです。

<figure class="fig-code">
<figcaption>docker-compose.vscode.yml</figcaption>

```yaml
version: "3.4"

services:
  mydatabaseapp:
    command: /bin/sh -c "while sleep 1000; do :; done"
    volumes:
      - ..:/workspace:cached
```

</figure>

必要に応じて、ポートを公開するために `ports` を追加したりしてください。

参考: [<cite>VS Code Remote - Containers を Docker Compose で使うのだー！ - Mitsuyuki.Shiiba</cite>](https://bufferings.hatenablog.com/entry/2020/06/11/233201)

### 6. devcontainer.json をつくる

devcontainer.json は VSCode にコンテナ作成を指示する設定ファイルです。これも .devcontainer に置きます。

最小限の devcontainer.json はこんな感じです。

<figure class="fig-code">
<figcaption>devcontainer.json</figcaption>

```json
{
  "dockerComposeFile": ["docker-compose.yml", "docker-compose.vscode.yml"],

  // docker-compose.yml の services のうち、開発環境につかうもの
  "service": "mydatabaseapp",

  // docker-compose.vscode.yml で指定したマウント先
  "workspaceFolder": "/workspace",

  // 事前にインストールしておいてほしい拡張
  "extensions": ["ms-dotnettools.csharp"]
}
```

</figure>

いじり倒したいときは [<cite>devcontainer.json reference</cite>](https://code.visualstudio.com/docs/remote/devcontainerjson-reference) を読むといいでしょう。

### 完成！

これで準備完了です。 VSCode で「Reopen in Container」を実行すると、コンテナ上で VSCode が動き始めます。 Dockerfile のビルドが走るので気長に待ちましょう。

また、 Visual Studio でも docker-compose プロジェクトをスタートアッププロジェクトに設定して実行できるはずです！

<div role="note" class="note note-caution">
<h4 class="note-heading">注意！</h4>
<div class="note-content">
Visual Studio と VSCode の同時実行は危険です。同じマウント先のデータベースがふたつ動くことになってしまいます。また、それぞれ終了後 30 秒くらいはコンテナが動いているので、コンテナが終了されたことを確認してから、他方を使ってください。
</div>
</div>

## まとめ

頑張れば Visual Studio でも VSCode でも使える Docker Compose 環境がつくれることを示しました。これで開発が捗ればいいね。捗らんか……。

ここまでの内容を clone するだけでお試しできるものを GitHub に置いておきました。

[azyobuzin/vs-docker-compose-example](https://github.com/azyobuzin/vs-docker-compose-example)
