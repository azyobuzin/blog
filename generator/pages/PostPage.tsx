import BlogPostHeader from "../components/BlogPostHeader"
import Layout from "../components/Layout"
import { SITE_TITLE } from "../lib/constants"
import { Component, h } from "../lib/jsx"
import { Post } from "../lib/posts"

const PostPage: Component<{ post: Post }> = ({ post }) => {
  const canonical = `${SITE_TITLE}/${post.slug}/`

  return (
    <Layout
      head={
        <>
          <title>
            {post.title} | {SITE_TITLE}
          </title>
          <link rel="canonical" href={canonical} />
          <meta name="description" content={post.description} />
          <meta property="og:title" content={post.title} />
          <meta property="og:type" content="article" />
          <meta property="og:url" content={canonical} />
          <meta property="og:description" content={post.description} />
          <meta property="og:article:published_time" content={post.pubdate} />
          {post.revdate && (
            <meta property="og:article:modified_time" content={post.revdate} />
          )}
          {post.tags.map((x) => (
            <meta property="og:article:tag" content={x} />
          ))}
          {post.thumbnail && (
            <meta property="og:image" content={post.thumbnail} />
          )}
        </>
      }
    >
      <div className="container">
        <article className="article-page">
          <BlogPostHeader post={post} link={false} />
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
