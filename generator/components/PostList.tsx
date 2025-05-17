import { type VFC, h } from "../lib/jsx"
import type { Post } from "../lib/posts"
import LinkToPost from "./LinkToPost"
import PostHeader from "./PostHeader"

const PostPreview: VFC<{ post: Post }> = ({ post }) => {
  return (
    <article className="article-list-item">
      <div className="article-list-item-content">
        <PostHeader post={post} titleLink />

        <div className="article-content">
          {post.preamble}
          {post.truncated && (
            <p>
              <LinkToPost slug={post.slug}>続きを読む</LinkToPost>
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

const PostList: VFC<{ posts: Post[] }> = ({ posts }) => {
  return (
    <div className="article-list" role="feed">
      {posts.map((x) => (
        <PostPreview post={x} />
      ))}
    </div>
  )
}

export default PostList
