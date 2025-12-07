import { toText } from "hast-util-to-text"
import Layout from "../components/Layout"
import PostHeader from "../components/PostHeader"
import StyleTags from "../components/StyleTags"
import { SITE_TITLE, SITE_URL } from "../lib/constants"
import { h, type VFC } from "../lib/jsx"
import type { Post } from "../lib/posts"

const PostPage: VFC<{ post: Post }> = ({ post }) => {
  const titleText = toText(post.title)
  const canonical = `${SITE_URL}/${post.slug}/`

  return (
    <Layout
      head={
        <>
          <title>
            {titleText} | {SITE_TITLE}
          </title>
          <link rel="canonical" href={canonical} />
          {post.description != null && (
            <meta name="description" content={post.description} />
          )}
          <meta property="og:title" content={titleText} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonical} />
          <meta
            property="og:description"
            content={post.description ?? toText(post.preamble)}
          />
          <meta property="og:article:published_time" content={post.pubdate} />
          {post.revdate != null && (
            <meta property="og:article:modified_time" content={post.revdate} />
          )}
          {post.tags.map((x) => (
            <meta property="og:article:tag" content={x} />
          ))}
          {post.thumbnail != null && (
            <meta property="og:image" content={post.thumbnail} />
          )}
          {post.style != null && <StyleTags styles={[post.style]} />}
        </>
      }
    >
      <div className="container">
        <main>
          <article>
            <PostHeader post={post} showHistory />
            <div className="article-content">{post.content}</div>
          </article>
        </main>

        <footer>
          <nav>
            <ul>
              <li>
                <a href="/">{SITE_TITLE}</a>
              </li>
              <li>
                <a href="https://twitter.com/azyobuzin" rel="author external">
                  @azyobuzin
                </a>
              </li>
            </ul>
          </nav>
        </footer>
      </div>
    </Layout>
  )
}

export default PostPage
