import { toHtml } from "hast-util-to-html"
import type { Element, Root } from "xast"
import { x as h } from "xastscript"
import { SITE_URL } from "./constants"
import { Post, removeRelativeLink } from "./posts"

export function createAtom(
  title: string,
  url: string,
  feedUrl: string,
  posts: Post[]
): Root {
  const entries = posts.map((post) => {
    const url = `${SITE_URL}/${post.slug}/`

    return (
      // FIXME: TS2322: Type '{ "__@children@21625": (XResult | XResult[] | null)[]; }' is not assignable to type 'XAttributes'.
      // @ts-expect-error
      <entry>
        {post.tags.map((tag) => (
          <category term={tag} label={tag} />
        ))}
        <content type="html">
          {toHtml(removeRelativeLink(post.content, url))}
        </content>
        <id>{url}</id>
        <link href={url} rel="alternate" type="text/html" />
        {post.thumbnail == null ? null : (
          <link href={post.thumbnail} rel="enclosure" />
        )}
        <published>{fixDateString(post.pubdate)}</published>
        {post.description == null ? null : (
          <summary>{post.description}</summary>
        )}
        <title type="html">{toHtml(post.title)}</title>
        <updated>{fixDateString(post.revdate ?? post.pubdate)}</updated>
      </entry>
    )
  }) as Element[]

  const root = (
    // FIXME: TS2322: Type '{ "__@children@21625": (XResult | Element[])[]; xmlns: string; "xml:lang": string; }' is not assignable to type 'XAttributes | { [children]?: XChild; }'.
    // @ts-expect-error
    <feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ja-JP">
      <author>
        <name>azyobuzin</name>
        <uri>https://twitter.com/azyobuzin</uri>
      </author>
      <id>{feedUrl}</id>
      <link href={feedUrl} rel="self" type="application/atom+xml" />
      <link href={url} rel="alternate" type="text/html" />
      <title>{title}</title>
      <updated>{feedUpdated(posts)}</updated>
      {entries}
    </feed>
  ) as Element

  return {
    type: "root",
    children: [
      {
        type: "instruction",
        name: "xml",
        value: 'version="1.0" encoding="utf-8"',
      },
      root,
    ],
  }
}

function feedUpdated(posts: Post[]): string {
  if (posts.length === 0) return new Date().toISOString()

  let latestDateStr = posts[0].revdate ?? posts[0].pubdate
  let latestTime = new Date(latestDateStr).getTime()

  for (let i = 1; i < posts.length; i++) {
    const dateStr = posts[i].revdate ?? posts[i].pubdate
    const time = new Date(dateStr).getTime()

    if (time > latestTime) {
      latestDateStr = dateStr
      latestTime = time
    }
  }

  return fixDateString(latestDateStr)
}

// https://validator.w3.org/feed/docs/error/InvalidRFC3339Date.html
function fixDateString(s: string): string {
  // 時刻がない
  if (!s.includes("T")) return s + "T00:00:00+09:00"

  // 秒がない
  return s.replace(/T\d{2}:\d{2}(?!:)/g, "$&:00")
}
