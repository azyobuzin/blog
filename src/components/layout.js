import React from 'react'
import { Helmet } from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'
import '../styles/main.scss'

export default function Layout ({ children }) {
  const data = useStaticQuery(graphql`
    query Layout {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  const siteTitle = data.site.siteMetadata.title

  return (
    <>
      <Helmet>
        <html lang='ja' />
        <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/fork-awesome@1.1.7/css/fork-awesome.min.css' integrity='sha256-gsmEoJAws/Kd3CjuOQzLie5Q3yshhvmo7YNtBG7aaEY=' crossorigin='anonymous' />
        <meta property='og:site_name' content={siteTitle} />
      </Helmet>
      {children}
    </>
  )
}
