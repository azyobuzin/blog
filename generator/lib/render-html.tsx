import { mkdir } from "node:fs/promises"
import { resolve } from "node:path"
import type { Root as HastRoot } from "hast"
import { select } from "hast-util-select"
import katex from "katex"
import rehypeStringify from "rehype-stringify"
import { write } from "to-vfile"
import { type Plugin, unified } from "unified"
import { VFile } from "vfile"
import { type Element, h } from "./jsx"

export async function renderHtml(
  tree: Element,
  outPath: string,
): Promise<void> {
  let htmlFile = new VFile({ path: outPath, result: tree })
  htmlFile = await processor.process(htmlFile)
  await mkdir(resolve(htmlFile.cwd, htmlFile.path, ".."), { recursive: true })
  await write(htmlFile)
}

const fromElement: Plugin<[], HastRoot> = function () {
  this.Parser = (_doc: string, file: VFile) => {
    const el = file.result as Element
    return el.type === "root" ? el : { type: "root", children: [el] }
  }
}

/** 必要に応じて KaTeX のスタイルを適用 */
const mathStyle: Plugin<[], HastRoot> = () => {
  return (tree: HastRoot) => {
    if (select(".katex", tree) == null) return

    const head = select("head", tree)!
    const katexVersion = (katex as unknown as { version: string }).version
    const katexDist = `https://unpkg.com/katex@${katexVersion}/dist/`

    head.children.push(
      <link
        rel="stylesheet"
        href={`${katexDist}katex.min.css`}
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
      />,
      <script
        src={`${katexDist}contrib/copy-tex.min.js`}
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        async
      />,
    )
  }
}

const processor = unified()
  .use(fromElement)
  .use(mathStyle)
  .use(rehypeStringify, {
    allowDangerousHtml: true,
    upperDoctype: true,
  })
  .freeze()
