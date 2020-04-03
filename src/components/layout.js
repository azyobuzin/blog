import React from 'react'
import { Helmet } from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'
import '../styles/global.scss'

export default function Layout ({ children }) {
  const data = useStaticQuery(graphql`
    query Layout {
      site {
        siteMetadata {
          title
          social {
            twitter
          }
        }
      }
    }
  `)

  const site = data.site.siteMetadata

  return (
    <>
      <Helmet>
        <html lang='ja' />
        <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/fork-awesome@1.1.7/css/fork-awesome.min.css' integrity='sha256-gsmEoJAws/Kd3CjuOQzLie5Q3yshhvmo7YNtBG7aaEY=' crossorigin='anonymous' />
        <link rel='stylesheet' href='https://fonts.googleapis.com/css2?family=Roboto+Mono&amp;family=Roboto:ital,wght@0,300;0,500;0,700;1,300;1,700&amp;display=swap' />
        <meta property='og:site_name' content={site.title} />
        <meta name='twitter:card' content='summary' />
        <meta name='twitter:creator' content={site.social.twitter} />
      </Helmet>
      {children}
    </>
  )
}
