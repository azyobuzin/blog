import { execFile } from "node:child_process"
import { stat } from "node:fs/promises"
import * as path from "node:path"
import canvas from "canvas"
import chalk from "chalk"
import { glob } from "glob"
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
import { selectAll } from "hast-util-select"
import type { Parent as MdastParent, Root as MdastRoot } from "mdast"
import { toHast } from "mdast-util-to-hast"
import rehypeHighlight from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import remarkExtractFrontmatter from "remark-extract-frontmatter"
import remarkFrontmatter from "remark-frontmatter"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { read as readVFile } from "to-vfile"
import { type Plugin, type Processor, unified } from "unified"
import { map } from "unist-util-map"
import { SKIP, visit } from "unist-util-visit"
import type { VFile } from "vfile"
import yaml from "yaml"
import { rehypeCustomElements } from "../custom-elements"
import { SITE_URL } from "./constants"

const CONTENT_FILE_NAME = "index.md"

export interface Post {
  /** yyyy/MM/dd/foo */
  slug: string
  title: HastRoot
  pubdate: string
  revdate?: string
  tags: string[]
  description?: string
  thumbnail?: string
  content: HastRoot
  preamble: HastRoot
  /** preamble に全文入っていれば false */
  truncated: boolean
  commitHash?: string
  style?: string
}

interface Frontmatter {
  pubdate?: string
  tags?: string[]
  /** セクション番号を表示するか */
  sectnums?: boolean
  /** meta タグの説明文 */
  description?: string
  thumbnail?: string
  style?: string
}

// Compilerの出力は、CompileResultMapにあるフィールドの型のいずれかしか許されない
// https://github.com/unifiedjs/unified/blob/11.0.5/readme.md#compileresultmap
declare module "unified" {
  interface CompileResultMap {
    Post: Post
  }
}

export async function readPosts(postsDir: string): Promise<Post[]> {
  const dirs = await glob("????/??/??/*", {
    cwd: postsDir,
    absolute: true,
  })

  let posts = await Promise.all(
    dirs.map(async (dir) => {
      if (!(await stat(path.join(dir, CONTENT_FILE_NAME))).isFile()) return null
      return await readPost(dir)
    }),
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
    console.warn(chalk.yellow(msg.toString()))
  }

  return resultFile.result as Post
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
            throw new Error(`Unexpected node ${JSON.stringify(titleHtml)}`)
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
        if (x != null) sectnum += `${x}.`
      }

      if (enabled) {
        node.children.unshift({ type: "text", value: `${sectnum} ` })
      }

      const id = node.properties?.id
      if (id != null) {
        sectionById.set(id as string, `Section ${sectnum.slice(0, -1)}`)
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
    for (const el of selectAll("code.language-samp", tree)) el.tagName = "samp"
  }
}

/** コードブロックのスタイルは milligram に任せるので、 hljs のスタイルを消す */
const removeHljsClass: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot) => {
    visit(tree, (node) => {
      if (isHastElement(node, "code") && node.properties?.className != null)
        classnames(node, { hljs: false })
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
  nameById: Map<string, string>,
): void {
  for (const el of selectAll('a[href^="#"]:empty', tree)) {
    const figNumStr = nameById.get((el.properties!.href as string).slice(1))
    if (figNumStr != null) {
      const textNode: HastText = { type: "text", value: figNumStr }
      el.children = [textNode]
    }
  }
}

/** `<img>` に width, height をセットする。 */
const assignImgSize: Plugin<[], HastRoot> = () => {
  return async (tree: HastRoot, file: VFile) => {
    await Promise.all(
      selectAll("img", tree).map(async (el) => {
        const props = el.properties as
          | {
              src?: string
              width?: number | string
              height?: number | string
            }
          | undefined
        if (props?.src == null) return

        if (props.width == null || props.height == null) {
          if (props.src.includes("//")) {
            // 絶対パスなのでサイズの取得は諦め、警告する
            file.message(
              `width and height are not specfied. They are required for an external resource (${props.src}).`,
              el.position,
            )
            return
          }

          // canvas で読み込んでサイズを調べる
          try {
            const img = new canvas.Image()
            const loadPromise = new Promise<void>((resolve, reject) => {
              img.onload = () => {
                resolve()
              }
              img.onerror = (err) => {
                reject(err)
              }
            })
            img.src = path.resolve(file.cwd, file.path, "..", props.src)
            await loadPromise

            if (props.width == null) {
              if (props.height == null) {
                props.width = img.naturalWidth
                props.height = img.naturalHeight
              } else {
                props.width = Math.round(
                  img.naturalWidth * (Number(props.height) / img.naturalHeight),
                )
              }
            } else {
              props.height = Math.round(
                img.naturalHeight * (Number(props.width) / img.naturalWidth),
              )
            }
          } catch (err) {
            file.message(err as Error, el.position)
          }
        }
      }),
    )
  }
}

/** <table> → <div class="table-wrapper"><table> */
const tableWrapper: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot) => {
    visit(tree, (node, index, parent) => {
      if (
        index == null ||
        !isHastElement(node, "table") ||
        !isHastElement(parent, "figure")
      )
        return

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: "table-wrapper" },
        children: [node],
      }

      return SKIP
    })
  }
}

/** `<figure>` に class が指定されていなかったら警告 */
const lintFigureClass: Plugin<[], HastRoot> = () => {
  const allowedClasses = [
    "fig-code",
    "fig-img",
    "fig-quote",
    "fig-table",
    "fig-tweet",
  ]
  let selector = "figure"
  for (const c of allowedClasses) selector += `:not(figure.${c})`

  return (tree: HastRoot, file: VFile) => {
    for (const el of selectAll(selector, tree)) {
      file.message("No class is specified for <figure>", el.position)
    }
  }
}

function toPost(
  this: Processor<undefined, undefined, undefined, HastRoot, Post>,
) {
  this.compiler = (tree: HastRoot, file: VFile): Post => {
    const slug = path
      .resolve(file.cwd, file.path, "..")
      .split(path.sep)
      .slice(-4)
      .join("/")
    const baseUrl = `${SITE_URL}/${slug}/`

    const frontmatter = file.data.frontmatter as Frontmatter | undefined

    let thumbnail = frontmatter?.thumbnail
    if (thumbnail != null) thumbnail = new URL(thumbnail, baseUrl).href

    const headingIndex = tree.children.findIndex((x) => isHastHeading(x))
    let preamble: HastRoot =
      headingIndex < 0
        ? tree
        : {
            type: "root",
            children: tree.children.slice(0, headingIndex),
          }
    preamble = removeRelativeLink(preamble, baseUrl)

    return {
      slug,
      title: file.data.title as HastRoot,
      pubdate: frontmatter?.pubdate ?? slug.split("/").slice(0, 3).join("-"),
      revdate: file.data.revdate as string | undefined,
      tags: frontmatter?.tags ?? [],
      description: frontmatter?.description,
      thumbnail,
      content: tree,
      preamble,
      truncated: headingIndex >= 0,
      commitHash: file.data.commitHash as string | undefined,
      style: frontmatter?.style,
    }
  }
}

const processor = unified()
  .use(remarkParse)
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
  .use(rehypeKatex)
  .use(rehypeHighlight)
  .use(removeHljsClass)
  .use(figureNumbering)
  .use(assignImgSize)
  .use(tableWrapper)
  .use(rehypeCustomElements)
  .use(lintFigureClass)
  .use(toPost as unknown as Plugin<[], HastRoot, Post>) // NOTE: first-partyプラグインでもd.tsで型を強引に変更している
  .freeze()

async function getGitCommit(
  path: string,
): Promise<{ commitHash?: string; revdate?: string }> {
  return await new Promise((resolve, reject) => {
    execFile(
      "git",
      ["log", "-1", "--pretty=format:%H%n%aI", "--", path],
      (error, stdout) => {
        let commitHash: string | undefined
        let revdate: string | undefined

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
      },
    )
  })
}

export function removeRelativeLink<T extends HastNode>(
  node: T,
  baseUrl: URL | string,
): T {
  return map(node, (node) => {
    if (
      (isHastElement as (node: unknown) => node is Element)(node) &&
      node.properties != null
    ) {
      // id属性を削除する
      const { id, ...newProps } = node.properties

      // リンクを絶対URLにする
      for (const key of ["href", "src"]) {
        const href = newProps[key]
        if (typeof href === "string") {
          newProps[key] = new URL(href, baseUrl).href
        }
      }

      return { ...node, properties: newProps }
    }
    return { ...node }
  }) as T
}
