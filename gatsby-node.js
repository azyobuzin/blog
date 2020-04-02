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
    }
  `)

  if (result.errors) {
    throw result.errors
  }

  const posts = result.data.allBlogPost.edges
    .map(x => x.node.slug)

  const blogPost = path.resolve('./src/templates/blog-post.js')

  posts.forEach(slug => {
    createPage({
      path: require('./src/utils/slug-to-path.js')(slug),
      component: blogPost,
      context: { slug }
    })
  })
}

exports.onCreateNode = require('./lib/blog-post-nodes.js').onCreateNode
