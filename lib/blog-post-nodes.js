const asciidoctor = require('@asciidoctor/core')()
const sourceHighlighter = 'highlightjs2'
registerSyntaxHighlighter()

module.exports.createSchemaCustomization = function createSchemaCustomization ({
  actions: { createTypes }, schema
}) {
  createTypes(`
    type BlogPost implements Node {
      slug: String!
      title: String!
      html: String!
      pubdate: String!
      revdate: String
      keywords: [String!]!
      description: String!
      stem: Boolean!
      preamble: String!
      commitHash: String
    }
  `)
}

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
  if (node.sourceInstanceName !== 'blog' ||
    !node.relativePath ||
    !(pathMatch = node.relativePath.match(pathPattern))
  ) {
    return
  }

  const { slug, pubdate } = pathMatch.groups

  const { commitHash, revdate } = await getGitCommit(node.absolutePath)

  const defaultAttributes = {
    'lang@': 'ja',
    'pubdate@': pubdate,
    'source-highlighter': sourceHighlighter
  }

  if (revdate) defaultAttributes['revdate@'] = revdate

  const content = await loadNodeContent(node)
  const doc = asciidoctor.load(content, {
    attributes: defaultAttributes,
    base_dir: node.dir,
    safe: 'unsafe'
  })

  const preamble = getPreamble(doc) || ''

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
    revdate: doc.getAttribute('revdate'),
    keywords: doc.getAttribute('keywords', '').split(',')
      .map(x => x.trim()).filter(x => x.length > 0),
    description: doc.hasAttribute('description')
      ? doc.getAttribute('description')
      : preamble ? require('striptags')(preamble).trim() : '',
    stem: doc.hasAttribute('stem'),
    preamble,
    commitHash
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

function registerSyntaxHighlighter () {
  asciidoctor.SyntaxHighlighter.register(sourceHighlighter, {
    highlight (_node, source, lang, _opts) {
      const hljs = require('highlight.js')
      return hljs.highlight(lang, source, true).value
    },
    handlesHighlighting () {
      return true
    }
  })
}

function getGitCommit (path) {
  return new Promise((resolve, reject) => {
    require('child_process').execFile(
      'git', ['log', '-1', '--pretty=format:%H%n%aI', '--', path],
      (error, stdout) => {
        let commitHash = null
        let revdate = null

        if (error) {
          if (!error.message ||
              !error.message.startsWith('Command failed: ')) {
            reject(error)
            return
          }
        } else {
          const lines = stdout.split(/\r?\n/g)
          if (lines.length >= 2) {
            commitHash = lines[0]
            revdate = lines[1]
          }
        }

        resolve({ commitHash, revdate })
      })
  })
}
