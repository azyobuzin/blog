import { toText } from "hast-util-to-text"
import Layout from "../components/Layout"
import PostHeader from "../components/PostHeader"
import { SITE_TITLE, SITE_URL } from "../lib/constants"
import { VFC, h } from "../lib/jsx"
import { Post } from "../lib/posts"

const PostPage: VFC<{ post: Post }> = ({ post }) => {
  const titleText = toText(post.title)
  const canonical = `${SITE_URL}/${SITE_TITLE}/${post.slug}/`

  return (
    <Layout
      head={
        <>
          <title>
            {titleText} | {SITE_TITLE}
          </title>
          <link rel="canonical" href={canonical} />
          <meta property="og:title" content={titleText} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonical} />
          <meta property="og:description" content={post.description} />
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
        </>
      }
    >
      <div className="container">
        <article className="article-page">
          <PostHeader post={post} link={false} showHistory />
          <div className="article-content">{post.content}</div>
        </article>

        <footer>
          <hr />
          <nav>
            <a href="/">{SITE_TITLE}</a>
            {"　|　"}
            <a href="https://twitter.com/azyobuzin" rel="author external">
              @azyobuzin
            </a>
          </nav>
        </footer>
      </div>
    </Layout>
  )
}

export default PostPage
