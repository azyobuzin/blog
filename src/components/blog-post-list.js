import React from 'react'
import BlogPostHeader from './blog-post-header.js'
import LinkToPost from '../components/link-to-post.js'

function BlogPostPreview ({ post }) {
  return (
    <article className='article-list-item'>
      <hr />
      <div className='article-list-item-content'>
        <BlogPostHeader post={post} link={true} />

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
