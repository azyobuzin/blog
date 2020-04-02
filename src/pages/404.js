import React from 'react'
import { Helmet } from 'react-helmet'
import { Link, graphql } from 'gatsby'
import Layout from '../components/layout.js'

export default function NotFound ({
  data: {
    site: { siteMetadata: { title: siteTitle } }
  }
}) {
  return (
    <Layout>
      <Helmet>
        <title>そんなページないよ！ | {siteTitle}</title>
      </Helmet>

      <div className='container'>
        <main>
          <h1 style={{ textAlign: 'center' }}>404<br />そんなページないよ！</h1>
        </main>

        <footer>
          <nav className='article-nav'>
            <Link to='/'>{siteTitle}</Link>
          </nav>
        </footer>
      </div>
    </Layout>
  )
}

export const query = graphql`
  query NotFoundPage {
    site {
      siteMetadata {
        title
      }
    }
  }
`
