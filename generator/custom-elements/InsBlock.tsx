import { FC, h } from "../lib/jsx"

const InsBlock: FC<{ dateTime: string }> = ({ dateTime, children }) => {
  if (dateTime == null) throw new TypeError("dateTime is required")

  return (
    <ins className="ins-block" dateTime={dateTime} role="note">
      <div className="icon">
        追記 <time>{dateTime}</time>
      </div>
      <div className="content">{children}</div>
    </ins>
  )
}

export default InsBlock
