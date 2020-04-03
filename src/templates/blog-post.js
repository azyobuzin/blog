import React from 'react'
import { Helmet } from 'react-helmet'
import { Link, graphql } from 'gatsby'
import Layout from '../components/layout.js'
import BlogPostMeta from '../components/blog-post-meta.js'
import slugToPath from '../../lib/slug-to-path.js'
import moment from 'moment-timezone'

export default function BlogPostTemplate ({
  data: {
    site: { siteMetadata: { title: siteTitle, siteUrl, timezone } },
    blogPost: post
  }
}) {
  function toIsoDate (s) {
    return moment.tz(s, timezone).toISOString(true)
  }

  return (
    <Layout>
      <Helmet>
        <title>{post.title} | {siteTitle}</title>
        <meta name='description' content={post.description} />
        <meta property='og:title' content={post.title} />
        <meta property='og:type' content='article' />
        <meta property='og:url' content={siteUrl + slugToPath(post.slug)} />
        <meta property='og:description' content={post.description} />
        <meta property='og:article:published_time' content={toIsoDate(post.pubdate)} />
        {post.revdate && <meta property='og:article:modified_time' content={toIsoDate(post.revdate)} />}
        {post.keywords.map((x, i) => <meta key={`tag-${i}`} property='og:article:tag' content={x} />)}
      </Helmet>

      <div className='container'>
        <article className='article-page'>
          <header>
            <h1 className='article-title'>{post.title}</h1>
            <BlogPostMeta post={post} />
          </header>

          <div className='article-content' dangerouslySetInnerHTML={{ __html: post.html }} />
        </article>

        <footer>
          <hr />
          <nav>
            <Link to='/'>{siteTitle}</Link>
          </nav>
        </footer>
      </div>
    </Layout>
  )
}

export const query = graphql`
  query BlogPostPage($slug: String!) {
    site {
      siteMetadata {
        title
        siteUrl
        timezone
      }
    }
    blogPost(slug: { eq: $slug }) {
      html
      commitHash
      ...BlogPostMeta
      parent {
        ... on File {
          relativePath
        }
      }
    }
  }
`
