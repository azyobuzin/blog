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
<figure id="fig-x" data-num="図">
  <img src="path/to/img.jpg" />
  <figcaption>タイトル</figcaption>
</figure>
```

↓

```html
<figure id="fig-x" data-num="図">
  <img src="path/to/img.jpg" alt="タイトル" />
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
