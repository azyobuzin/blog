import type { Element as HastElement, Root as HastRoot } from "hast"
import { Child, Properties, h as hastscript } from "hastscript"

export type Node = Child
export type Element = HastElement | HastRoot
export type VFC<P = {}, R extends Element = Element> = (props: P) => R
export type FC<P = {}, R extends Element = Element> = VFC<
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

export function h<R extends Element>(component: VFC<{}, R>): R

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
        children.filter((x) => x != null && x !== true && x !== false),
      )
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface ElementChildrenAttribute {
      children: any
    }

    type IntrinsicElements = Record<string, any>
  }
}
