import { VFC, h } from "../lib/jsx"
import { Post } from "../lib/posts"
import LinkToPost from "./LinkToPost"
import PostHeader from "./PostHeader"

const PostPreview: VFC<{ post: Post }> = ({ post }) => {
  return (
    <article className="article-list-item">
      <hr />
      <div className="article-list-item-content">
        <PostHeader post={post} link showHistory={false} />

        <div className="article-content">
          {post.preamble}
          <p>
            <LinkToPost slug={post.slug}>続きを読む</LinkToPost>
          </p>
        </div>
      </div>
    </article>
  )
}

const PostList: VFC<{ posts: Post[] }> = ({ posts }) => {
  return (
    <main className="article-list">
      {posts.map((x) => (
        <PostPreview post={x} />
      ))}
    </main>
  )
}

export default PostList
