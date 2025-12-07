import type { Element as HastElement, Root as HastRoot } from "hast"
import { type Child, h as hastscript, type Properties } from "hastscript"

export type Node = Child
export type Element = HastElement | HastRoot
export type VFC<P = object, R extends Element = Element> = (props: P) => R
export type FC<P = object, R extends Element = Element> = VFC<
  P & { children: Node },
  R
>

export function h<P, R extends Element>(
  component: VFC<P, R>,
  properties: Omit<P, "children">,
  ...children: P extends { children: infer C }
    ? C extends unknown[]
      ? C
      : never
    : []
): R

export function h<R extends Element>(component: VFC<object, R>): R

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
  selector: VFC | string | null | undefined,
  // biome-ignore lint/suspicious/noExplicitAny: オーバーロードで具体的な型を指定しているため
  properties?: any,
  // biome-ignore lint/suspicious/noExplicitAny: オーバーロードで具体的な型を指定しているため
  ...children: any[]
): Element {
  return typeof selector === "function"
    ? selector({ children, ...properties })
    : hastscript(
        // biome-ignore lint/suspicious/noExplicitAny: hastscriptのオーバーロードを解決できないためanyを指定
        selector as any,
        properties,
        children.filter((x) => x != null && x !== true && x !== false),
      )
}

declare global {
  namespace JSX {
    interface ElementChildrenAttribute {
      // biome-ignore lint/suspicious/noExplicitAny: JSXの型チェックはしない
      children: any
    }

    // biome-ignore lint/suspicious/noExplicitAny: JSXの型チェックはしない
    type IntrinsicElements = Record<string, any>
  }
}
