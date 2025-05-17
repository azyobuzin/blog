import { formatDate } from "../lib/date"
import { type FC, h } from "../lib/jsx"

const InsBlock: FC<{ dateTime: string }> = ({ dateTime, children }) => {
  if (dateTime == null) throw new TypeError("dateTime is required")

  return (
    <ins className="note ins-block" dateTime={dateTime} role="note">
      <div className="note-heading">
        追記 <time dateTime={dateTime}>{formatDate(dateTime, true)}</time>
      </div>
      <div className="note-content">{children}</div>
    </ins>
  )
}

export default InsBlock
