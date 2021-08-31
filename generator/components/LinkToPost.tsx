import { FC, h } from "../lib/jsx"

const LinkToPost: FC<{ slug: string }> = ({ slug, children, ...rest }) => {
  return (
    <a {...rest} href={`/${slug}/`}>
      {children}
    </a>
  )
}

export default LinkToPost
