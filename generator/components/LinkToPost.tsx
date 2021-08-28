import { Component, Node, h } from "../lib/jsx"

const LinkToPost: Component<{ slug: string; children: Node }> = ({
  slug,
  children,
  ...rest
}) => {
  return (
    <a {...rest} href={`/${slug}/`}>
      {children}
    </a>
  )
}

export default LinkToPost
