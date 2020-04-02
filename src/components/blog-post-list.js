import React from 'react'
import BlogPostMeta from './blog-post-meta.js'
import LinkToPost from '../components/link-to-post.js'

function BlogPostPreview ({ post }) {
  return (
    <article className='article-list-item'>
      <hr />
      <div className='article-list-item-content'>
        <header>
          <h1 className='article-title'>
            <LinkToPost slug={post.slug}>{post.title}</LinkToPost>
          </h1>
          <BlogPostMeta post={post} />
        </header>

        <div className='article-content'>
          <div dangerouslySetInnerHTML={{ __html: post.preamble }} />
          <p><LinkToPost slug={post.slug}>続きを読む</LinkToPost></p>
        </div>
      </div>
    </article>
  )
}

export default function BlogPostList ({ posts }) {
  return (
    <main className='article-list'>
      {posts.map(x => <BlogPostPreview key={x.slug} post={x} />)}
    </main>
  )
}
