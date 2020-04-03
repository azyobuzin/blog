import React from 'react'
import { Helmet } from 'react-helmet'
import { Link, graphql } from 'gatsby'
import Layout from '../components/layout.js'
import BlogPostList from '../components/blog-post-list.js'

export default function BlogPostTemplate ({
  data,
  pageContext: {
    tag
  }
}) {
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allBlogPost.edges.map(x => x.node)

  return (
    <Layout>
      <Helmet>
        <title>{tag} | {siteTitle}</title>
      </Helmet>

      <div className='container'>
        <header>
          <h1>{tag}</h1>
          <p className='breadcrumb'>
            <Link to='/'>ホーム</Link>
            {' > '}
            <i className='fa fa-tag' aria-hidden='true' title='タグ' />
            {' ' + tag}
          </p>
        </header>

        <BlogPostList posts={posts} />

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
  query TagPage($tag: String!) {
    site {
      siteMetadata {
        title
        siteUrl
      }
    }
    allBlogPost(
      filter: {keywords: {in: [$tag]}},
      sort: {fields: slug, order: DESC}
    ) {
      edges {
        node {
          preamble
          ...BlogPostMeta
        }
      }
    }
  }
`
