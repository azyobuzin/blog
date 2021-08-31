import Layout from "../components/Layout"
import { SITE_TITLE } from "../lib/constants"
import { VFC, h } from "../lib/jsx"

const NotFound: VFC = () => {
  return (
    <Layout head={<title>そんなページないよ！ | {SITE_TITLE}</title>}>
      <div className="container">
        <main>
          <h1 style={{ textAlign: "center" }}>
            404
            <br />
            そんなページないよ！
          </h1>
        </main>

        <footer>
          <nav className="article-nav">
            <a href="/">{SITE_TITLE}</a>
          </nav>
        </footer>
      </div>
    </Layout>
  )
}

export default NotFound
