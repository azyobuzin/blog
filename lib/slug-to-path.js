module.exports = function slugToPath (slug) {
  return slug.replace(/^(\d+)-(\d+)-(\d+)-/, '/$1/$2/$3/') + '/'
}
