import { Element as HastElement, Root as HastRoot } from "hast"
import { Child, Properties, h as hastscript } from "hastscript"

export type Node = Child
export type Element = HastElement | HastRoot
export type Component<P = {}> = (props: P) => Element

export function h<P = {}>(
  component: Component<P>,
  properties: Omit<P, "children">,
  ...children: P extends { children: infer C }
    ? C extends any[]
      ? C
      : never
    : []
): Element

export function h(
  selector: null | undefined,
  properties?: Properties,
  ...children: Child[]
): HastRoot

export function h(
  selector: string,
  properties?: Properties,
  ...children: Child[]
): HastElement

export function h(
  selector: Function | string | null | undefined,
  // @eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  properties?: any,
  ...children: any[]
): Element {
  return typeof selector === "function"
    ? selector({ children, ...properties })
    : hastscript(
        selector as any,
        properties,
        children.filter((x) => x != null && x !== true && x !== false)
      )
}
