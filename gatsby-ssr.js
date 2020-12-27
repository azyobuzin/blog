exports.onPreRenderHTML = ({ getPostBodyComponents, replacePostBodyComponents }) => {
  replacePostBodyComponents(getPostBodyComponents().filter(x => !(x.type === 'script' && x.props.src.startsWith('/polyfill-'))))
}
