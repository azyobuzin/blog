import { mkdir } from "fs/promises"
import { resolve } from "path"
import type { Root as HastRoot } from "hast"
import rehypeStringify from "rehype-stringify"
import { write } from "to-vfile"
import { Plugin, unified } from "unified"
import { VFile } from "vfile"
import type { Element } from "./jsx"

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

const processor = unified()
  .use(fromElement)
  .use(rehypeStringify, {
    allowDangerousHtml: true,
  })
  .freeze()

// TODO: 必要に応じて katex の CSS を挿入
