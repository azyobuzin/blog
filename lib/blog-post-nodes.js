const asciidoctor = require('@asciidoctor/core')()

module.exports.onCreateNode = async function onCreateNode ({
  node,
  actions: {
    createNode,
    createParentChildLink
  },
  loadNodeContent,
  createNodeId,
  createContentDigest
}) {
  const pathPattern = /(?:^|\/)(?<slug>(?<pubdate>\d+-\d+-\d+)-[^\\/]+)(?:\/index)?\.adoc$/
  let pathMatch
  if (!node.relativePath || !(pathMatch = node.relativePath.match(pathPattern))) {
    return
  }

  const { slug, pubdate } = pathMatch.groups

  const content = await loadNodeContent(node)
  const doc = asciidoctor.load(content, {
    attributes: {
      'lang@': 'ja',
      'pubdate@': pubdate,
      'icons@': 'font'
    },
    base_dir: node.dir,
    safe: 'unsafe'
  })

  const preamble = getPreamble(doc)

  const blogPostNode = {
    id: createNodeId(`${node.id} >>> BlogPost`),
    parent: node.id,
    children: [],
    internal: {
      type: 'BlogPost'
    },
    slug,
    title: doc.getDocumentTitle(),
    html: doc.convert(),
    pubdate: doc.getAttribute('pubdate'),
    keywords: doc.getAttribute('keywords', '').split(',')
      .map(x => x.trim()).filter(x => x.length > 0),
    description: doc.hasAttribute('description')
      ? doc.getAttribute('description')
      : preamble ? require('striptags')(preamble).trim() : '',
    stem: doc.hasAttribute('stem'),
    preamble
  }

  blogPostNode.internal.contentDigest = createContentDigest(blogPostNode)

  createNode(blogPostNode)
  createParentChildLink({ parent: node, child: blogPostNode })
}

function getPreamble (doc) {
  const preambleBlock = doc.getBlocks()
    .find(block => block.getNodeName() === 'preamble')
  return (preambleBlock && preambleBlock.convert()) || null
}
