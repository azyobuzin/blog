const path = require('path')

exports.createPages = async ({ graphql, actions: { createPage } }) => {
  const result = await graphql(`
    {
      allBlogPost {
        edges {
          node {
            slug
          }
        }
      }
      tagsGroup: allBlogPost {
        group(field: keywords) {
          fieldValue
        }
      }
    }
  `)

  if (result.errors) {
    throw result.errors
  }

  const blogPostTemplate = path.resolve('./src/templates/blog-post.js')

  result.data.allBlogPost.edges
    .map(x => x.node.slug)
    .forEach(slug => {
      createPage({
        path: require('./src/utils/slug-to-path.js')(slug),
        component: blogPostTemplate,
        context: { slug }
      })
    })

  const tagTemplate = path.resolve('./src/templates/tag.js')

  result.data.tagsGroup.group
    .map(x => x.fieldValue)
    .forEach(tag => {
      createPage({
        path: `/tags/${tag}/`,
        component: tagTemplate,
        context: { tag }
      })
    })
}

exports.onCreateNode = require('./lib/blog-post-nodes.js').onCreateNode
