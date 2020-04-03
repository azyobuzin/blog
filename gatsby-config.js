const siteTitle = 'あじょろぐ'

module.exports = {
  siteMetadata: {
    title: siteTitle,
    description: 'azyobuzinの進捗の証',
    siteUrl: 'https://blog.azyobuzi.net',
    social: {
      twitter: '@azyobuzin'
    }
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
              const slugToPath = require('./lib/slug-to-path.js')

              return allBlogPost.edges.map(({ node: post }) => {
                const url = site.siteMetadata.siteUrl + slugToPath(post.slug)
                return {
                  title: post.title,
                  description: post.description,
                  url,
                  guid: url,
                  categories: post.keywords,
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
