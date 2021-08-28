import { Component, h } from "../lib/jsx"
import { Post } from "../lib/posts"
import BlogPostHeader from "./BlogPostHeader"
import LinkToPost from "./LinkToPost"

const BlogPostPreview: Component<{ post: Post }> = ({ post }) => {
  return (
    <article className="article-list-item">
      <hr />
      <div className="article-list-item-content">
        <BlogPostHeader post={post} link />

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

const BlogPostList: Component<{ posts: Post[] }> = ({ posts }) => {
  return (
    <main className="article-list">
      {posts.map((x) => (
        <BlogPostPreview post={x} />
      ))}
    </main>
  )
}

export default BlogPostList
