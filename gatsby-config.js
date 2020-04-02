const siteTitle = 'あじょろぐ'

module.exports = {
  siteMetadata: {
    title: siteTitle,
    description: '進捗の証',
    siteUrl: 'https://blog.azyobuzi.net'
  },
  plugins: [
    'gatsby-plugin-sass',
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'blog',
        path: `${__dirname}/content/blog`
      }
    },
    {
      resolve: 'gatsby-plugin-feed',
      options: {
        feeds: [
          {
            serialize ({ query: { site, allBlogPost } }) {
              const slugToPath = require('./src/utils/slug-to-path.js')
              const parseTags = require('./src/utils/parse-tags.js')

              return allBlogPost.edges.map(({ node: post }) => {
                const url = site.siteMetadata.siteUrl + slugToPath(post.slug)
                return {
                  title: post.title,
                  description: post.description,
                  url,
                  guid: url,
                  categories: parseTags(post.keywords),
                  date: post.pubdate,
                  custom_elements: [{ 'content:encoded': post.html }]
                }
              })
            },
            query: `
              {
                allBlogPost {
                  edges {
                    node {
                      slug
                      title
                      html
                      pubdate
                      keywords
                      description
                      preamble
                    }
                  }
                }
              }
            `,
            title: siteTitle,
            output: '/rss.xml'
          }
        ]
      }
    },
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-no-javascript'
  ]
}
