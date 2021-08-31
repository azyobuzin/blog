import { execFile } from "child_process"
import { stat } from "fs/promises"
import * as path from "path"
import glob from "glob"
import type {
  Element,
  Node as HastNode,
  Root as HastRoot,
  Text as HastText,
} from "hast"
import { classnames } from "hast-util-classnames"
import { hasProperty } from "hast-util-has-property"
import { heading as isHastHeading } from "hast-util-heading"
import { headingRank } from "hast-util-heading-rank"
import { isElement as isHastElement } from "hast-util-is-element"
import { HastParent, toText } from "hast-util-to-text"
import type { Parent as MdastParent, Root as MdastRoot } from "mdast"
import { toHast } from "mdast-util-to-hast"
import rehypeHighlight from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import remarkExtractFrontmatter from "remark-extract-frontmatter"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
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
  /** セクション番号を表示するか */
  sectnums?: boolean
  /** meta タグの説明文 */
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

/** セクション番号 */
const sectionNumbering: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot, file: VFile) => {
    const enabled =
      (file.data.frontmatter as Frontmatter | undefined)?.sectnums === true

    const currentSection: Record<number, number> = {}
    let prevDepth = 0
    const sectionById = new Map<string, string>()

    visit(tree, "element", (node) => {
      const depth = headingRank(node)
      if (depth == null) return

      const deeper = depth > prevDepth
      prevDepth = depth

      if (deeper) {
        currentSection[prevDepth] = 1
      } else {
        currentSection[prevDepth]++
      }

      let sectnum = ""
      for (let i = 1; i <= prevDepth; i++) {
        const x = currentSection[i]
        if (x != null) sectnum += x.toString() + "."
      }

      if (enabled) {
        node.children.unshift({ type: "text", value: sectnum + " " })
      }

      const id = node.properties?.id
      if (id != null) {
        sectionById.set(
          id as string,
          "Section " + sectnum.substring(0, sectnum.length - 1)
        )
      }

      return SKIP
    })

    // a タグを書き換える
    assignTextToAnchor(tree, sectionById)
  }
}

/** language-samp を samp タグにする */
const sampElement: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot) => {
    visit(
      tree,
      (node) => isHastElement(node, "code"),
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
    visit(tree, (node, _index, parent): void => {
      if (!isHastElement(node, "code") || !isHastElement(parent, "pre")) return

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
    visit(tree, (node) => {
      if (isHastElement(node, "code") && node.properties?.className != null)
        classnames(node, { hljs: false, "no-highlight": false })
    })
  }
}

/** img の alt に figcaption をセットする */
const assignAlt: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot) => {
    visit(tree, (node, _index, parent) => {
      if (!isHastElement(node, "img") || !isHastElement(parent, "figure"))
        return

      const currentAlt = node.properties?.alt
      if (typeof currentAlt === "string" && currentAlt.length > 0) return

      let alt: string | undefined
      for (const child of parent.children) {
        if (isHastElement(child, "figcaption")) {
          alt = toText(child)
          break
        }
      }

      if (alt == null) return

      node.properties = { ...node.properties, alt }
    })
  }
}

/** 図表番号 */
const figureNumbering: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot) => {
    const counter = new Map<string, number>()
    const numById = new Map<string, string>()

    visit(tree, (node) => {
      if (!isHastElement(node, "figure") || !hasProperty(node, "dataNum"))
        return

      const prefix = node.properties!.dataNum as string

      const num = (counter.get(prefix) ?? 0) + 1
      counter.set(prefix, num)

      const id = node.properties!.id as string | undefined
      if (id != null) numById.set(id, `${prefix} ${num}`)

      // figcaption を書き換える
      for (const child of node.children) {
        if (isHastElement(child, "figcaption")) {
          const textNode: HastText = {
            type: "text",
            value: `${prefix} ${num}: `,
          }
          child.children.unshift(textNode)
          break
        }
      }
    })

    // a タグを書き換える
    assignTextToAnchor(tree, numById)
  }
}

function assignTextToAnchor(
  tree: HastRoot,
  nameById: Map<string, string>
): void {
  visit(tree, (node) => {
    if (
      !isHastElement(node, "a") ||
      !hasProperty(node, "href") ||
      !isChildrenEmpty(node)
    )
      return

    const href = node.properties!.href as string
    if (!href.startsWith("#")) return

    const figNumStr = nameById.get(href.substring(1))
    if (figNumStr != null) {
      const textNode: HastText = { type: "text", value: figNumStr }
      node.children = [textNode]
    }
  })
}

function isChildrenEmpty(el: Element): boolean {
  return traverse(el)

  function traverse(parent: HastParent): boolean {
    for (const child of parent.children) {
      switch (child.type as string) {
        case "root":
          if (!traverse(child as unknown as HastRoot)) return false
          break
        case "element":
          return false
        case "text": {
          const v = (child as HastText).value
          if (v != null && v.length > 0) return false
          break
        }
      }
    }
    return true
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

    let preamble: HastRoot = {
      type: "root",
      children: tree.children.slice(
        0,
        tree.children.findIndex((x) => isHastHeading(x))
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
      if (
        (isHastElement as (node: any) => node is Element)(node) &&
        node.properties != null
      ) {
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
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(sectionNumbering)
  .use(sampElement)
  .use(assignNoHighlight)
  .use(rehypeHighlight)
  .use(removeHljsClass)
  .use(assignAlt)
  .use(figureNumbering)
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