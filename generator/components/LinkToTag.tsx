import { Component, Node, h } from "../lib/jsx"

const LinkToTag: Component<{
  tag: string
  className?: string
  children: Node
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
