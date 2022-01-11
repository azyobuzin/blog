import { formatDate } from "../lib/date"
import { VFC, h } from "../lib/jsx"
import { Post } from "../lib/posts"
import LinkToPost from "./LinkToPost"
import LinkToTag from "./LinkToTag"

export interface PostHeaderProps {
  post: Post
  titleLink?: boolean
  showHistory?: boolean
}

const PostHeader: VFC<PostHeaderProps> = ({ post, titleLink, showHistory }) => {
  let dateDetails = "公開: " + formatDate(post.pubdate, true)
  if (post.revdate != null)
    dateDetails += "\n最終更新: " + formatDate(post.revdate, true)

  const historyUrl =
    showHistory === true && post.commitHash != null
      ? `https://github.com/azyobuzin/blog/commits/${post.commitHash}/posts/${post.slug}`
      : null

  return (
    <header>
      <h1>
        {titleLink === true ? (
          <LinkToPost slug={post.slug}>{post.title}</LinkToPost>
        ) : (
          post.title
        )}
      </h1>
      <div className="article-meta">
        <i
          className="fa fa-pencil-square-o"
          aria-hidden="true"
          title="公開日"
        />
        <span className="sr-only">公開日</span>{" "}
        <time dateTime={post.pubdate} title={dateDetails}>
          {formatDate(post.pubdate, false)}
        </time>
        {historyUrl != null && (
          <>
            {" ― "}
            <a href={historyUrl} rel="external">
              History
            </a>
          </>
        )}
      </div>
      {post.tags.length > 0 && (
        <div className="article-meta">
          <i className="fa fa-tags" aria-hidden="true" title="タグ" />
          <span className="sr-only">タグ</span>
          {post.tags.map((x) => (
            <>
              {" "}
              <LinkToTag className="button button-outline article-tag" tag={x}>
                {x}
              </LinkToTag>
            </>
          ))}
        </div>
      )}
    </header>
  )
}

export default PostHeader