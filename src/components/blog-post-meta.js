import React from 'react'
import parseTags from '../utils/parse-tags.js'

export default function BlogPostMeta ({ post }) {
  const tags = parseTags(post.keywords)

  return (
    <>
      <p className='article-meta'>
        <i className='fa fa-pencil-square-o' aria-hidden='true' title='公開日' />
        <time datetime={post.pubdate}>{post.pubdate.replace('-', '/')}</time>
      </p>
      {
        tags.length > 0 && (
          <p className='article-meta'>
            <i className='fa fa-tags' aria-hidden='true' title='タグ' />
            {tags.map((x, i) => <span key={i} className='article-tag'>{x}</span>)}
          </p>
        )
      }
    </>
  )
}
