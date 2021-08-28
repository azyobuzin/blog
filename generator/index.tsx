import { join } from "path"
import { Element, h } from "./lib/jsx"
import { readPosts } from "./lib/posts"
import { renderHtml } from "./lib/render-html"
import Index from "./pages/Index"
import NotFound from "./pages/NotFound"
import PostPage from "./pages/PostPage"
import TagPage from "./pages/TagPage"

const postsDir = process.argv[2]
const outDir = process.argv[3]

if (!postsDir || !outDir) {
  console.warn("Usage: generator POSTS_DIR OUT_DIR")
  process.exit(1)
}

readPosts(postsDir)
  .then(async (posts) => {
    const pages: Record<string, Element> = {
      "index.html": <Index posts={posts} />,
      "404.html": <NotFound />,
    }

    for (const post of posts) {
      pages[`${post.slug}/index.html`] = <PostPage post={post} />
    }

    const tags = new Set<string>(posts.flatMap((x) => x.tags))
    for (const tag of tags) {
      pages[`tags/${tag}/index.html`] = (
        <TagPage tag={tag} posts={posts.filter((x) => x.tags.includes(tag))} />
      )
    }

    await Promise.all(
      Object.entries(pages).map(async ([outPath, page]) => {
        await renderHtml(page, join(outDir, outPath))
        console.log(outPath)
      })
    )

    // TODO: その他のファイルをコピー
  })
  .catch((err) => {
    console.error(err)
    process.exit(2)
  })
