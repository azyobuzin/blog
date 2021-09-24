import moment from "moment-timezone"
import { TIMEZONE } from "../lib/constants"
import { VFC, h } from "../lib/jsx"
import { Post } from "../lib/posts"
import LinkToPost from "./LinkToPost"
import LinkToTag from "./LinkToTag"

const PostHeader: VFC<{ post: Post; link: boolean; showHistory: boolean }> = ({
  post,
  link,
  showHistory,
}) => {
  const pubdate = moment.tz(post.pubdate, TIMEZONE)
  const revdate =
    post.revdate != null ? moment.tz(post.revdate, TIMEZONE) : null
  const dateFormat = "YYYY/MM/DD"
  const displayFormat = "YYYY/MM/DD HH:mm"
  let dateDetails =
    "公開: " +
    pubdate.format(post.pubdate.includes("T") ? displayFormat : dateFormat)
  if (revdate != null)
    dateDetails += "\n最終更新: " + revdate.format(displayFormat)

  const historyUrl =
    showHistory && post.commitHash != null
      ? `https://github.com/azyobuzin/blog/commits/${post.commitHash}/posts/${post.slug}`
      : null

  return (
    <header>
      <h1>
        {link ? (
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
        />{" "}
        <time dateTime={post.pubdate} title={dateDetails}>
          {pubdate.format(dateFormat)}
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
