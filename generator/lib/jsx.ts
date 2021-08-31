import { Element as HastElement, Root as HastRoot } from "hast"
import { Child, Properties, h as hastscript } from "hastscript"

export type Node = Child
export type Element = HastElement | HastRoot
export type VFC<P = {}> = (props: P) => Element
export type FC<P = {}> = VFC<P & { children: Node }>

export function h<P>(
  component: VFC<P>,
  properties: Omit<P, "children">,
  ...children: P extends { children: infer C }
    ? C extends unknown[]
      ? C
      : never
    : []
): Element

export function h(component: VFC<{}>): Element

export function h(
  selector: null | undefined,
  properties?: Properties | null,
  ...children: Child[]
): HastRoot

export function h(
  selector: string,
  properties?: Properties | null,
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
