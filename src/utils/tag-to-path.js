module.exports = function tagToPath (tag) {
  return `/tags/${tag.split('/').map(encodeURIComponent).join('/')}/`
}
