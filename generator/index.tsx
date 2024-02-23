import { cp, mkdir } from "fs/promises"
import { join, resolve } from "path"
import type { Element as XElement, Root as XRoot } from "xast"
import { homeFeed, tagFeed } from "./feeds"
import { Element, h } from "./lib/jsx"
import { Post, readPosts } from "./lib/posts"
import { renderHtml } from "./lib/render-html"
import { renderXml } from "./lib/render-xml"
import Index from "./pages/Index"
import NotFound from "./pages/NotFound"
import PostPage from "./pages/PostPage"
import TagPage from "./pages/TagPage"

const postsDir = process.argv[2]
const outDir = process.argv[3]

if (typeof postsDir !== "string" || typeof outDir !== "string") {
  console.warn("Usage: generator POSTS_DIR OUT_DIR")
  process.exit(1)
}

type Renderer = (path: string) => Promise<void>
const htmlFile =
  (tree: Element): Renderer =>
  (path: string) =>
    renderHtml(tree, path)
const xmlFile =
  (tree: XElement | XRoot): Renderer =>
  (path: string) =>
    renderXml(tree, path)

readPosts(postsDir)
  .then(async (posts) => {
    const homePosts = filterUnlisted(posts)

    const files: Record<string, (path: string) => Promise<void>> = {
      "index.html": htmlFile(<Index posts={homePosts} />),
      "feed.atom": xmlFile(homeFeed(homePosts)),
      "404.html": htmlFile(<NotFound />),
      ...postPages(posts),
      ...tagPages(posts),
    }

    return await Promise.all([renderFiles(files), copyStaticFiles(posts)])
  })
  .catch((err) => {
    console.error(err)
    process.exit(2)
  })

/** unlisted タグがついた記事はトップページに表示しない */
function filterUnlisted(posts: Post[]): Post[] {
  return posts.filter((x) => !x.tags.includes("unlisted"))
}

function postPages(posts: Post[]): Record<string, Renderer> {
  return Object.fromEntries(
    posts.map((post) => [
      `${post.slug}/index.html`,
      htmlFile(<PostPage post={post} />),
    ]),
  )
}

function tagPages(posts: Post[]): Record<string, Renderer> {
  const tags = new Set<string>(posts.flatMap((x) => x.tags))
  return Object.fromEntries(
    [...tags].flatMap((tag) => {
      const postsByTag = posts.filter((x) => x.tags.includes(tag))
      return [
        [
          `tags/${tag}/index.html`,
          htmlFile(<TagPage tag={tag} posts={postsByTag} />),
        ],
        [`tags/${tag}/feed.atom`, xmlFile(tagFeed(tag, postsByTag))],
      ]
    }),
  )
}

async function renderFiles(files: Record<string, Renderer>): Promise<void> {
  for (const [outPath, render] of Object.entries(files)) {
    await render(join(outDir, outPath))
    console.log(outPath)
  }
}

async function copyStaticFiles(posts: Post[]): Promise<void> {
  for (const post of posts) {
    const srcDir = resolve(postsDir, post.slug)
    const dstDir = resolve(outDir, post.slug)

    await mkdir(dstDir, { recursive: true })

    await cp(srcDir, dstDir, {
      recursive: true,
      force: true,
      filter: (srcPath) => resolve(srcPath) !== resolve(srcDir, "index.md"),
    })
  }
}
