import React from 'react'
import { Helmet } from 'react-helmet'
import { graphql } from 'gatsby'
import Layout from '../components/layout.js'
import BlogPostList from '../components/blog-post-list.js'

export default function Index ({ data }) {
  const site = data.site.siteMetadata
  const posts = data.allBlogPost.edges.map(x => x.node)

  return (
    <Layout>
      <Helmet>
        <title>{site.title}</title>
        <meta name='description' content={site.description} />
        <meta property='og:title' content={site.title} />
        <meta property='og:type' content='website' />
        <meta property='og:url' content={site.siteUrl + '/'} />
        <meta property='og:description' content={site.description} />
      </Helmet>

      <div className='container'>
        <header>
          <h1>{site.title}</h1>
          <p>{site.description}</p>
        </header>

        <BlogPostList posts={posts} />

        <hr />
        <p><a href='https://azyobuzin.hatenablog.com/'>もっと古い記事（はてなブログ）</a></p>
      </div>
    </Layout>
  )
}

export const query = graphql`
  query IndexPage {
    site {
      siteMetadata {
        title
        description
        siteUrl
        social {
          twitter
        }
      }
    }
    allBlogPost(sort: {fields: slug, order: DESC}) {
      edges {
        node {
          preamble
          ...BlogPostMeta
        }
      }
    }
  }

  fragment BlogPostMeta on BlogPost {
    slug
    title
    pubdate
    revdate
    keywords
  }
`
