import React from 'react'
import { useStaticQuery, graphql } from 'gatsby'
import LinkToTag from './link-to-tag.js'
import moment from 'moment-timezone'

export default function BlogPostMeta ({ post }) {
  const site = useStaticQuery(graphql`
    {
      site {
        siteMetadata {
          repository
          timezone
        }
      }
    }
  `).site.siteMetadata

  const pubdate = moment.tz(post.pubdate, site.timezone)
  const revdate = post.revdate ? moment.tz(post.revdate, site.timezone) : null
  const displayFormat = 'YYYY/MM/DD HH:mm'
  let dateDetails = '公開: ' + pubdate.format(displayFormat)
  if (revdate) dateDetails += '\n最終更新: ' + revdate.format(displayFormat)

  let historyUrl = null
  if (post.commitHash) {
    historyUrl = site.repository +
      '/commits/' + post.commitHash +
      '/content/blog/' + post.parent.relativePath
  }

  return (
    <>
      <div className='article-meta'>
        <i className='fa fa-pencil-square-o' aria-hidden='true' title='公開日' />
        {' '}
        <time dateTime={pubdate.toISOString(true)} title={dateDetails}>
          {pubdate.format('YYYY/MM/DD')}
        </time>
        {
          historyUrl && (
            <>{' ― '}<a href={historyUrl}>History</a></>
          )
        }
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
