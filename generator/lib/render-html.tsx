import { mkdir } from "fs/promises"
import { resolve } from "path"
import type { Element as HastElement, Root as HastRoot } from "hast"
import { select } from "hast-util-select"
import rehypeStringify from "rehype-stringify"
import { write } from "to-vfile"
import { Plugin, unified } from "unified"
import { VFile } from "vfile"
import { rehypeCustomElements } from "../custom-elements"
import { Element, h } from "./jsx"

export async function renderHtml(
  page: Element,
  outPath: string
): Promise<void> {
  let htmlFile = new VFile({ path: outPath, result: page })
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
    if (select(".math", tree) == null) return

    const head = select("head", tree) as HastElement
    head.children.push(
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.16/katex.min.css"
        integrity="sha512-l4xXl7jwDJzz8wpSgj4pcSOwc5Bmc5LO4R5T52CmYJhAaHZwRALNntPCrMR0FQh4dbl/kOE0VfUyEFGyq6YGaw=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
      />,
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.16/contrib/copy-tex.min.css"
        integrity="sha512-zpYS5KnYzWXUCp2eKVtNDIBAVxhAGbhXOCnm4eZUDsYqcveMwokhfV5FpNT1r23pr3QLb1Xsw+zJ7eqAZAdBag=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
      />,
      <script
        src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.13.16/contrib/copy-tex.min.js"
        integrity="sha512-69oQlJyjN7VLQDagAaaOrUfgp66VdWTi0ZBy7aoAraAH8H2C13YM+JAPR0N3KBW7G82gDnvcb0l953DOi0GyoQ=="
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        async
      />
    )
  }
}

const processor = unified()
  .use(fromElement)
  .use(rehypeCustomElements)
  .use(mathStyle)
  .use(rehypeStringify, {
    allowDangerousHtml: true,
  })
  .freeze()
