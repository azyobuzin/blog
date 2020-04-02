const React = require('react')

exports.onPreRenderHTML = ({ getHeadComponents, replaceHeadComponents }) => {
  // インラインスタイルをやめさせる
  replaceHeadComponents(getHeadComponents().map(el => {
    if (el.type !== 'style') return el
    const href = el.props['data-href']
    return href
      ? (<link rel='stylesheet' href={href} />)
      : el
  }))
}
