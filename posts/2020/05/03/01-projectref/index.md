---
pubdate: 2020-05-03T04:07+09:00
tags: [tech, C#]
---

# ProjectReference にバージョン範囲を指定したい

複数のプロジェクトをひとつのリポジトリで管理するとき、プロジェクト間の参照関係は csproj に `<ProjectReference>` を書くわけですが、ここで、このプロジェクトを NuGet パッケージ化するときのことを考えます。例えば、 A と B というプロジェクトがあり、 B が A に依存しているとします。このとき B を `dotnet pack` してできあがるパッケージの A への依存はどのようになるでしょうか？ 実際にやってみると、現在の A のバージョン**以上**という依存関係になります。

ここで、 A の現在のバージョンを 1.0.0 とします。 Semantic Versioning に従っていると考えると、もし 2.0.0 がリリースされたら、破壊的な変更が入っているかもしれません。それでも B から A への依存は 1.0.0 **以上**で良いのでしょうか？ と考えると、「以上」以外の柔軟な依存関係を指定したくなりませんか？ というわけで、 `<ProjectReference>` を使ったプロジェクト間参照で、柔軟なバージョン範囲指定をしたいというのが今回のお話です。

## サンプルプロジェクト

文章でだらだらと説明されても読みたくないのはわかります。ので、実際の csproj を示しておきます。

<figure class="fig-code">
<figcaption>A/A.csproj</figcaption>

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <Version>1.0.0</Version>
  </PropertyGroup>
</Project>
```

</figure>

<figure class="fig-code">
<figcaption>B/B.csproj</figcaption>

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\A\A.csproj" />
  </ItemGroup>
</Project>
```

</figure>

ここで、 B に対して `dotnet pack` を実行したときの nuspec の `<dependencies>` はこのようになります。

```xml
<dependencies>
  <group targetFramework=".NETStandard2.0">
    <dependency id="A" version="1.0.0" exclude="Build,Analyzers" />
  </group>
</dependencies>
```

`version="1.0.0"` という指定は、「1.0.0 以上」と解釈されます。

## 目標設定

ここでは、 Semantic Versioning という前提で、 B が依存するのは A v1.0.0 以上 2.0.0 未満、としましょう。こうすれば、 B が A の Public API のみに依存しているならば、 B はこの依存関係が解決できる限り、必ず動作するといえます。

## 一筋縄で実現できたらブログ書いてない

はい。これは NuGet の Issue ([NuGet/Home#5556](https://github.com/NuGet/Home/issues/5556)) に挙がっており、現在も実現されていません。しかし頑張ればできないこともない状況になっています。

必要なものは [.NET 5.0 Preview SDK](https://dotnet.microsoft.com/download/dotnet/5.0) (執筆時点で 5.0.100-preview.3.20216.6) です。最新の NuGet を搭載している SDK を使うと、 csproj に少し手を入れるだけで、 `<ProjectReference>` に対する依存関係に介入できるようになります。

## 目標をクリアする csproj

仕組みとかいいからとりあえず使いたいって人は、これをコピペしてください。バージョンの指定方法は、 NuGet のドキュメント ([<cite>Version ranges</cite>](https://docs.microsoft.com/ja-jp/nuget/concepts/package-versioning#version-ranges)) を確認してください。

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\A\A.csproj" />
  </ItemGroup>

  <!-- 以下を追加 -->
  <Target Name="SetDependencyVersion" AfterTargets="_GetProjectReferenceVersions">
    <ItemGroup>
      <_ProjectReferencesWithVersions Update="..\A\A.csproj" ProjectVersion="[1.0.0,2.0.0)" />
    </ItemGroup>
  </Target>
</Project>
```

出力される nuspec の `<dependencies>` はこんな感じになります。

```xml
<dependencies>
  <group targetFramework=".NETStandard2.0">
    <dependency id="A" version="[1.0.0, 2.0.0)" exclude="Build,Analyzers" />
  </group>
</dependencies>
```

## 仕組み

`dotnet pack` (MSBuild で `Pack` ターゲットを実行する) では、 `<ProjectReference>` Item があったら、そのプロジェクトのバージョンを読み込み、 `<_ProjectReferencesWithVersions>` という Item を作成します。そこで、その処理が行われる `_GetProjectReferenceVersions` ターゲットの後に、読み込まれたバージョンを上書きするようなターゲットを作成することで、好きなバージョンに書き換えることができます。

ここまでは古い SDK でもできたのですが、古い SDK では `ProjectVersion` 属性にバージョンの**範囲**が指定されることを想定していませんでした。つまり `1.0.0` は受け付けるけど、 `[1.0.0,2.0.0)` は受け付けてくれなかったわけです。新しい SDK では、範囲を指定してもエラーにならないようになったので、このようなハックでお茶を濁せるようになりました。

## 今後もっと簡単になるか？

[NuGet/Home#5556](https://github.com/NuGet/Home/issues/5556) を監視していきましょう。

## NuGet に対するぼやき

依存関係解決の戦略がデフォルトで「条件を満たす最小バージョン」な所為で、依存バージョンをすぐ「以上」にしてしまうのは NuGet の悪いところだなぁと思っています。そのおかげで lock ファイルを使わなくても、あまり崩壊しないという利点はありますが、少なくともリビジョンリリースは自動で最新にしてほしくない？ という思いがあります。
