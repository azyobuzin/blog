# あじょろぐ

https://blog.azyobuzi.net/

## コントリビューション

ここ間違っているぞ、文章が読みづらいデザインだぞ、などありましたら、お気軽に Issue, Pull Request してください。

筆者に議論をふっかけたいぞと思ったときは Twitter @azyobuzin にリプライするのが確実です。

## 構文リファレンス

### Markdown

#### Frontmatter

```yaml
---
pubdate: 2021-08-28T22:00+09:00
tags: [tag]
sectnums: true
description: SEO！
thumbnail: thumbnail.jpg
---
```

#### タイトル

h1 がタイトル扱い

```md
# タイトル
```

#### samp ブロック

code ではなく samp が妥当な場合に。

````
```samp
コマンドライン出力
```
````

### HTML

Markdown を拡張しだすとキリがなくなるので、足りない機能は HTML で補う。

#### 図表番号

`data-num` 属性を指定すると、図表番号を表示するようになる。

```html
<figure id="fig-x" class="fig-img" data-num="図">
  <img src="path/to/img.jpg" alt="" />
  <figcaption>タイトル</figcaption>
</figure>
```

↓

```html
<figure id="fig-x" class="fig-img" data-num="図">
  <img src="path/to/img.jpg" alt="" />
  <figcaption>図 1: タイトル</figcaption>
</figure>
```

#### 図表参照

a タグの中身が空ならば、図表番号に置き換える。

```md
[](#fig-x)
```

↓

```html
<a href="#fig-x">図 1</a>
```

#### Admonitions

DocBook の意味に従う。未実装のものは必要になったら追加する。

```html
<ab-important>
  <p>重要なこと</p>
</ab-important>

<ab-caution>
  <p>注意深く行動すること</p>
</ab-caution>

<ab-warning>
  <p>従わないとやばいことになる可能性があること</p>
</ab-warning>
```

↓

```html
<div class="admonitionblock important" role="note">
  <div class="icon">Important</div>
  <div class="content">
    <p>重要なこと</p>
  </div>
</div>

<div class="admonitionblock caution" role="note">
  <div class="icon">Caution</div>
  <div class="content">
    <p>注意深く行動すること</p>
  </div>
</div>

<div class="admonitionblock warning" role="note">
  <div class="icon">Warning</div>
  <div class="content">
    <p>従わないとやばいことになる可能性があること</p>
  </div>
</div>
```

#### 追記

```html
<ab-insblock datetime="2021-09-27">
  <p>変更がありました。</p>
</ab-insblock>
```

↓

```html
<ins class="ins-block" datetime="2021-09-27" role="note">
  <div class="icon">追記 <time datetime="2021-09-27">2021/09/27</time></div>
  <div class="content">
    <p>変更がありました。</p>
  </div>
</ins>
```
