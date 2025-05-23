import { SITE_TITLE } from "../lib/constants"
import { type FC, type Node, h } from "../lib/jsx"

const Layout: FC<{ head?: Node }> = (props) => {
  return {
    type: "root",
    children: [
      { type: "doctype", name: "html" },
      <html lang="ja" prefix="og: http://ogp.me/ns#">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="generator" content="https://github.com/azyobuzin/blog" />
          <link
            rel="stylesheet"
            href="https://unpkg.com/fork-awesome@~1.2.0/css/fork-awesome.min.css"
            crossorigin="anonymous"
            referrerpolicy="no-referrer"
          />
          <link rel="stylesheet" href="/global.css" />
          <meta property="og:site_name" content={SITE_TITLE} />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:creator" content="@azyobuzin" />
          {props.head}
        </head>
        <body>{props.children}</body>
      </html>,
    ],
  }
}

export default Layout
