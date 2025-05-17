import { writeFile } from "node:fs/promises"
import type { Element, Root } from "xast"
import { toXml } from "xast-util-to-xml"

export async function renderXml(
  tree: Element | Root,
  outPath: string,
): Promise<void> {
  if (tree.type !== "root") {
    // biome-ignore lint/style/noParameterAssign: rootではないときだけ書き換える
    tree = {
      type: "root",
      children: [
        {
          type: "instruction",
          name: "xml",
          value: 'version="1.0" encoding="utf-8"',
        },
        tree,
      ],
    }
  }

  await writeFile(
    outPath,
    toXml(tree, { closeEmptyElements: true, allowDangerousXml: true }),
  )
}
