import { execFile } from "child_process"
import { stat } from "fs/promises"
import * as path from "path"
import glob from "glob"
import type { Element, Node as HastNode, Root as HastRoot } from "hast"
import { classnames } from "hast-util-classnames"
import { toText } from "hast-util-to-text"
import type { Parent as MdastParent, Root as MdastRoot } from "mdast"
import { toHast } from "mdast-util-to-hast"
import rehypeHighlight from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import remarkExtractFrontmatter from "remark-extract-frontmatter"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
// @ts-expect-error remark-sectionize の型定義がない
import remarkSectionize from "remark-sectionize"
import { read as readVFile } from "to-vfile"
import { FrozenProcessor, Plugin, unified } from "unified"
import { map } from "unist-util-map"
import { SKIP, visit } from "unist-util-visit"
import type { VFile } from "vfile"
import yaml from "yaml"
import { SITE_URL } from "./constants"

const CONTENT_FILE_NAME = "index.md"

export interface Post {
  /** yyyy/MM/dd/foo */
  slug: string
  title: HastRoot
  pubdate: string
  revdate?: string
  tags: string[]
  description: string
  thumbnail?: string
  content: HastRoot
  preamble: HastRoot
  commitHash?: string
}

interface Frontmatter {
  pubdate?: string
  tags?: string[]
  sectnums?: boolean
  description?: string
  thumbnail?: string
}

export async function readPosts(postsDir: string): Promise<Post[]> {
  const dirs = await new Promise<string[]>((resolve, reject) => {
    glob(
      "????/??/??/*",
      {
        cwd: postsDir,
        nosort: true,
        absolute: true,
      },
      (err, matches) => (err == null ? resolve(matches) : reject(err))
    )
  })

  let posts = await Promise.all(
    dirs.map(async (dir) => {
      if (!(await stat(path.join(dir, CONTENT_FILE_NAME))).isFile()) return null
      return await readPost(dir)
    })
  )

  posts = posts.filter((x) => x != null)

  // https://stackoverflow.com/a/40355107
  // @ts-expect-error 暗黙の型変換を利用
  posts.sort((x, y) => (y.slug > x.slug) - (y.slug < x.slug))

  return posts as Post[]
}

async function readPost(postDir: string): Promise<Post> {
  const commitInfo = await getGitCommit(postDir)
  const mdFile = await readVFile(path.join(postDir, CONTENT_FILE_NAME))
  Object.assign(mdFile.data, commitInfo)

  const resultFile = await processor.process(mdFile)

  for (const msg of resultFile.messages) {
    if (msg.fatal === true) throw msg
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    console.warn(msg.toString())
  }

  return resultFile.result
}

/** h1 をタイトルとして扱う */
const extractTitle: Plugin<[], MdastRoot> = () => {
  return (tree: MdastRoot, file: VFile) => {
    let found = false
    traverse(tree)

    if (!found) file.fail("No h1 element")

    function traverse(parent: MdastParent): boolean {
      for (let i = 0; i < parent.children.length; ) {
        const node = parent.children[i]

        if (node.type === "heading" && node.depth === 1) {
          if (found) {
            file.message("There are multiple h1 elements", node.position)
            return false
          }

          // タイトルを HTML に変換
          const titleHtml = toHast(node) as Element
          if (titleHtml.tagName !== "h1")
            throw new Error("Unexpected node " + JSON.stringify(titleHtml))
          file.data.title = { type: "root", children: titleHtml.children }

          // ツリーから h1 を取り除く
          parent.children.splice(i, 1)
          found = true
        } else {
          if ("children" in node) {
            if (!traverse(node)) return false
          }

          i++
        }
      }

      return true
    }
  }
}

const sectionNumbering: Plugin<[], MdastRoot> = () => {
  return (tree: MdastRoot, file: VFile) => {
    if ((file.data.frontmatter as Frontmatter | undefined)?.sectnums !== true)
      return

    const currentSection: Record<number, number> = {}
    let depth = 0

    visit(tree, "heading", (node) => {
      const heading = node
      const deeper = heading.depth > depth
      depth = heading.depth

      if (deeper) {
        currentSection[depth] = 1
      } else {
        currentSection[depth]++
      }

      let sectnum = ""
      for (let i = 1; i <= depth; i++) {
        const x = currentSection[i]
        if (x != null) sectnum += x.toString() + "."
      }

      heading.children.unshift({ type: "text", value: sectnum + " " })

      return SKIP
    })
  }
}

/** language-samp を samp タグにする */
const sampElement: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot) => {
    visit(
      tree,
      (node) => isHastElement(node) && node.tagName === "code",
      (node) => {
        const el = node as Element
        const isSamp = (
          classnames(el.properties?.className as any) as string[]
        ).includes("language-samp")
        if (isSamp) el.tagName = "samp"
      }
    )
  }
}

/** rehype-hightlight は `<pre><code>` すべてをハイライトしようとするので、抑制する */
const assignNoHighlight: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot) => {
    visit(tree, "element", (node, _index, parent): void => {
      if (
        !isHastElement(node) ||
        !isHastElement(parent) ||
        node.tagName !== "code" ||
        parent.tagName !== "pre"
      )
        return

      const hasLangClass = (
        classnames(node.properties?.className as any) as string[]
      ).some((x) => x.includes("lang"))

      if (!hasLangClass) classnames(node, "no-highlight")
    })
  }
}

/** コードブロックのスタイルは milligram に任せるので、 hljs のスタイルを消す */
const removeHljsClass: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot) => {
    visit(
      tree,
      (node) =>
        isHastElement(node) &&
        node.tagName === "code" &&
        node.properties?.className != null,
      (node) => {
        classnames(node as Element, { hljs: false, "no-highlight": false })
      }
    )
  }
}

const toPost: Plugin<[], HastRoot> = function () {
  this.Compiler = (tree: HastRoot, file: VFile): Post => {
    const slug = path
      .resolve(file.cwd, file.path, "..")
      .split(path.sep)
      .slice(-4)
      .join("/")
    const baseUrl = `${SITE_URL}/${slug}/`

    const frontmatter = file.data.frontmatter as Frontmatter | undefined

    let thumbnail = frontmatter?.thumbnail
    if (thumbnail != null) thumbnail = new URL(thumbnail, baseUrl).href

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Use `as` to avoid type error
    let preamble: HastRoot = {
      type: "root",
      children: tree.children.slice(
        0,
        tree.children.findIndex((x) => (x as Element).tagName === "section")
      ),
    }
    preamble = map(preamble, transformPreamble) as HastRoot

    return {
      slug,
      title: file.data.title as HastRoot,
      pubdate: frontmatter?.pubdate ?? slug.split("/").slice(0, 3).join("-"),
      revdate: file.data.revdate as string | undefined,
      tags: frontmatter?.tags ?? [],
      description: frontmatter?.description ?? toText(preamble),
      thumbnail: frontmatter?.thumbnail,
      content: tree,
      preamble,
      commitHash: file.data.commitHash as string | undefined,
    }

    function transformPreamble(node: HastNode): HastNode {
      if (isHastElement(node) && node.properties != null) {
        const newProps = { ...node.properties }

        // リンクを絶対URLにする
        for (const key of ["href", "src"]) {
          const href = newProps[key]
          if (typeof href === "string") {
            newProps[key] = new URL(href, baseUrl).href
          }
        }

        // id 属性を削除する
        delete newProps.id

        const newEl: Element = { ...node, properties: newProps }
        return newEl
      }
      return node
    }
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkFrontmatter)
  .use(remarkExtractFrontmatter, {
    yaml: yaml.parse,
    name: "frontmatter",
    throws: true,
  })
  .use(extractTitle)
  .use(sectionNumbering)
  .use(remarkMath)
  .use(remarkSectionize)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(sampElement)
  .use(assignNoHighlight)
  .use(rehypeHighlight)
  .use(removeHljsClass)
  .use(rehypeKatex)
  .use(toPost)
  .freeze() as FrozenProcessor<MdastRoot, HastRoot, HastRoot, Post>

async function getGitCommit(
  path: string
): Promise<{ commitHash?: string; revdate?: string }> {
  return await new Promise((resolve, reject) => {
    execFile(
      "git",
      ["log", "-1", "--pretty=format:%H%n%aI", "--", path],
      (error, stdout) => {
        let commitHash
        let revdate

        if (error != null) {
          if (
            error.message == null ||
            !error.message.startsWith("Command failed: ")
          ) {
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
      }
    )
  })
}

function isHastElement(node?: HastNode | null): node is Element {
  return node != null && node.type === "element"
}
