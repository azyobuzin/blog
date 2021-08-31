import { Root } from "hast"
import { Plugin } from "unified"
import { SKIP, visit } from "unist-util-visit"
import { Caution, Important, Warning } from "./admonitions"

export const components = {
  "ab-important": Important,
  "ab-caution": Caution,
  "ab-warning": Warning,
}

export const rehypeCustomElements: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "element", (node, index, parent) => {
      const component = (components as Record<string, Function | undefined>)[
        node.tagName
      ]
      if (component == null) return

      parent!.children[index!] = component({
        children: node.children,
        ...node.properties,
      })
      return [SKIP, index]
    })
  }
}
