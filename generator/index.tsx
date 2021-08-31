import { cp, mkdir } from "fs/promises"
import { join, resolve } from "path"
import { Element, h } from "./lib/jsx"
import { Post, readPosts } from "./lib/posts"
import { renderHtml } from "./lib/render-html"
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

readPosts(postsDir)
  .then(async (posts) => {
    const pages: Record<string, Element> = {
      "index.html": <Index posts={filterUnlisted(posts)} />,
      "404.html": <NotFound />,
      ...postPages(posts),
      ...tagPages(posts),
    }

    return await Promise.all([renderToHtmlFiles(pages), copyStaticFiles(posts)])
  })
  .catch((err) => {
    console.error(err)
    process.exit(2)
  })

/** unlisted タグがついた記事はトップページに表示しない */
function filterUnlisted(posts: Post[]): Post[] {
  return posts.filter((x) => !x.tags.includes("unlisted"))
}

function postPages(posts: Post[]): Record<string, Element> {
  return Object.fromEntries(
    posts.map((post) => [`${post.slug}/index.html`, <PostPage post={post} />])
  )
}

function tagPages(posts: Post[]): Record<string, Element> {
  const tags = new Set<string>(posts.flatMap((x) => x.tags))
  return Object.fromEntries(
    Array.from(tags, (tag) => {
      const postsByTag = posts.filter((x) => x.tags.includes(tag))
      return [
        `tags/${tag}/index.html`,
        <TagPage tag={tag} posts={postsByTag} />,
      ]
    })
  )
}

async function renderToHtmlFiles(
  pages: Record<string, Element>
): Promise<void> {
  for (const [outPath, page] of Object.entries(pages)) {
    await renderHtml(page, join(outDir, outPath))
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
