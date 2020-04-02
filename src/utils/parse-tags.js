module.exports = function parseTags (s) {
  return s ? s.split(',').map(x => x.trim()).filter(x => x.length > 0) : []
}
