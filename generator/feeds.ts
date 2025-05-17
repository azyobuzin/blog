import type { Root } from "xast"
import { createAtom } from "./lib/atom"
import { SITE_TITLE, SITE_URL } from "./lib/constants"
import type { Post } from "./lib/posts"
import { tagUrl } from "./lib/url"

export function homeFeed(posts: Post[]): Root {
  return createAtom(SITE_TITLE, `${SITE_URL}/`, `${SITE_URL}/feed.atom`, posts)
}

export function tagFeed(tag: string, posts: Post[]): Root {
  return createAtom(
    `${tag} | ${SITE_TITLE}`,
    SITE_URL + tagUrl(tag),
    `${SITE_URL + tagUrl(tag)}feed.atom`,
    posts,
  )
}
