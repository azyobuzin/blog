import Layout from "../components/Layout"
import PostList from "../components/PostList"
import { SITE_TITLE, SITE_URL } from "../lib/constants"
import { Component, h } from "../lib/jsx"
import type { Post } from "../lib/posts"

const DESCRIPTION = "azyobuzinの進捗の証"

const Index: Component<{ posts: Post[] }> = ({ posts }) => {
  return (
    <Layout
      head={
        <>
          <title>{SITE_TITLE}</title>
          <meta name="description" content={DESCRIPTION} />
          <meta property="og:title" content={SITE_TITLE} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={SITE_URL + "/"} />
          <meta property="og:description" content={DESCRIPTION} />
        </>
      }
    >
      <div className="container">
        <header>
          <h1>{SITE_TITLE}</h1>
          <p>{DESCRIPTION}</p>
        </header>

        <PostList posts={posts} />

        <hr />
        <p>
          <a href="https://azyobuzin.hatenablog.com/" rel="external">
            もっと古い記事（はてなブログ）
          </a>
        </p>
      </div>
    </Layout>
  )
}

export default Index
