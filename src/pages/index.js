import React from 'react'
import { Helmet } from 'react-helmet'
import { graphql } from 'gatsby'
import Layout from '../components/layout.js'
import BlogPostList from '../components/blog-post-list.js'

export default function Index ({ data }) {
  const siteTitle = data.site.siteMetadata.title
  const posts = data.allBlogPost.edges.map(x => x.node)

  return (
    <Layout>
      <Helmet>
        <title>{siteTitle}</title>
      </Helmet>

      <div className='container'>
        <header>
          <h1>{siteTitle}</h1>
        </header>

        <BlogPostList posts={posts} />
      </div>
    </Layout>
  )
}

export const query = graphql`
  query IndexPage {
    site {
      siteMetadata {
        title
      }
    }
    allBlogPost(sort: {fields: slug, order: DESC}) {
      edges {
        node {
          slug
          title
          pubdate
          keywords
          preamble
        }
      }
    }
  }
`
