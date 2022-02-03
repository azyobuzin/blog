import { FC, h } from "../lib/jsx"
import { tagUrl } from "../lib/url"

const LinkToTag: FC<{
  tag: string
  className?: string
}> = ({ tag, children, ...rest }) => {
  return (
    <a rel="tag" {...rest} href={tagUrl(tag)}>
      {children}
    </a>
  )
}

export default LinkToTag
