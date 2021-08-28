import { SITE_TITLE } from "../lib/constants"
import { Component, Node, h } from "../lib/jsx"

const Layout: Component<{ head?: Node; children: Node }> = (props) => {
  return {
    type: "root",
    children: [
      { type: "doctype", name: "html" },
      <html lang="ja" prefix="og: http://ogp.me/ns#">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/fork-awesome@1.1.7/css/fork-awesome.min.css"
            integrity="sha256-gsmEoJAws/Kd3CjuOQzLie5Q3yshhvmo7YNtBG7aaEY="
            crossorigin="anonymous"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Roboto+Mono&amp;family=Roboto:ital,wght@0,300;0,400;0,700;1,300;1,700&amp;display=swap"
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
