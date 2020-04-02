import React from 'react'
import LinkToTag from './link-to-tag.js'

export default function BlogPostMeta ({ post }) {
  return (
    <>
      <p className='article-meta'>
        <i className='fa fa-pencil-square-o' aria-hidden='true' title='公開日' />
        {' '}
        <time dateTime={post.pubdate}>{post.pubdate.replace('-', '/')}</time>
      </p>
      {
        post.keywords.length > 0 && (
          <p className='article-meta'>
            <i className='fa fa-tags' aria-hidden='true' title='タグ' />
            {post.keywords.map((x, i) =>
              <React.Fragment key={i}>
                {' '}
                <LinkToTag className='article-tag' tag={x}>{x}</LinkToTag>
              </React.Fragment>
            )}
          </p>
        )
      }
    </>
  )
}
