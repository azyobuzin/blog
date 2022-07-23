import Layout from "../components/Layout"
import PostList from "../components/PostList"
import StyleTags from "../components/StyleTags"
import { SITE_TITLE, SITE_URL } from "../lib/constants"
import { VFC, h } from "../lib/jsx"
import { Post } from "../lib/posts"
import { tagUrl } from "../lib/url"

const TagPage: VFC<{ tag: string; posts: Post[] }> = ({ tag, posts }) => {
  const canonical = SITE_URL + tagUrl(tag)

  return (
    <Layout
      head={
        <>
          <title>
            {tag} | {SITE_TITLE}
          </title>
          <link rel="canonical" href={canonical} />
          <meta property="og:url" content={canonical} />
          <link
            rel="alternate"
            href={tagUrl(tag) + "feed.atom"}
            type="application/atom+xml"
          />
          <StyleTags styles={posts.map((x) => x.style)} />
        </>
      }
    >
      <div className="container">
        <header>
          <h1>{tag}</h1>
          <p className="breadcrumb" role="list">
            <span role="listitem">
              <a href="/">ホーム</a>
            </span>
            {" > "}
            <span role="listitem" aria-current="page">
              <i className="fa fa-tag" title="タグ" />
              {" " + tag}
            </span>
          </p>
        </header>

        <main>
          <PostList posts={posts} />
        </main>

        <footer>
          <nav>
            <a href="/">{SITE_TITLE}</a>
          </nav>
        </footer>
      </div>
    </Layout>
  )
}

export default TagPage
