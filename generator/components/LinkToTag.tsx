import { FC, h } from "../lib/jsx"

const LinkToTag: FC<{
  tag: string
  className?: string
}> = ({ tag, children, ...rest }) => {
  return (
    <a
      {...rest}
      href={`/tags/${tag.split("/").map(encodeURIComponent).join("/")}/`}
    >
      {children}
    </a>
  )
}

export default LinkToTag
