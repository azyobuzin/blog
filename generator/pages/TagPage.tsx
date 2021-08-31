import Layout from "../components/Layout"
import PostList from "../components/PostList"
import { SITE_TITLE } from "../lib/constants"
import { VFC, h } from "../lib/jsx"
import { Post } from "../lib/posts"

const TagPage: VFC<{ tag: string; posts: Post[] }> = ({ tag, posts }) => {
  return (
    <Layout
      head={
        <title>
          {tag} | {SITE_TITLE}
        </title>
      }
    >
      <div className="container">
        <header>
          <h1>{tag}</h1>
          <p className="breadcrumb">
            <a href="/">ホーム</a>
            {" > "}
            <i className="fa fa-tag" aria-hidden="true" title="タグ" />
            {" " + tag}
          </p>
        </header>

        <PostList posts={posts} />

        <footer>
          <hr />
          <nav>
            <a href="/">{SITE_TITLE}</a>
          </nav>
        </footer>
      </div>
    </Layout>
  )
}

export default TagPage
