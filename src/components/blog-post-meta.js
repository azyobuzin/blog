import React from 'react'
import LinkToTag from './link-to-tag.js'

export default function BlogPostMeta ({ post }) {
  return (
    <>
      <div className='article-meta'>
        <i className='fa fa-pencil-square-o' aria-hidden='true' title='公開日' />
        {' '}
        <time dateTime={post.pubdate}>{post.pubdate.replace(/-/g, '/')}</time>
      </div>
      {
        post.keywords.length > 0 && (
          <div className='article-meta'>
            <i className='fa fa-tags' aria-hidden='true' title='タグ' />
            {post.keywords.map((x, i) =>
              <React.Fragment key={i}>
                {' '}
                <LinkToTag className='button button-outline article-tag' tag={x}>{x}</LinkToTag>
              </React.Fragment>
            )}
          </div>
        )
      }
    </>
  )
}
