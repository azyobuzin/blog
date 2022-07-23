import Layout from "../components/Layout"
import PostList from "../components/PostList"
import StyleTags from "../components/StyleTags"
import { SITE_TITLE, SITE_URL } from "../lib/constants"
import { VFC, h } from "../lib/jsx"
import type { Post } from "../lib/posts"

const DESCRIPTION = "azyobuzinの進捗の証"

const Index: VFC<{ posts: Post[] }> = ({ posts }) => {
  return (
    <Layout
      head={
        <>
          <title>{SITE_TITLE}</title>
          <link rel="canonical" href={SITE_URL + "/"} />
          <meta name="description" content={DESCRIPTION} />
          <meta property="og:title" content={SITE_TITLE} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content={SITE_URL + "/"} />
          <meta property="og:description" content={DESCRIPTION} />
          <link rel="alternate" href="/feed.atom" type="application/atom+xml" />
          <StyleTags styles={posts.map((x) => x.style)} />
        </>
      }
    >
      <div className="container">
        <header>
          <h1>{SITE_TITLE}</h1>
          <p>{DESCRIPTION}</p>
        </header>

        <main>
          <PostList posts={posts} />

          <div className="article-list-item">
            <p>
              <a href="https://azyobuzin.hatenablog.com/" rel="external">
                もっと古い記事（はてなブログ）
              </a>
            </p>
          </div>
        </main>
      </div>
    </Layout>
  )
}

export default Index
