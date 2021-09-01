import { FC, h } from "../lib/jsx"

function factory(className: string, title: string): FC {
  return ({ children }) => {
    return (
      <div className={`admonitionblock ${className}`} role="note">
        <div class="icon">{title}</div>
        <div class="content">{children}</div>
      </div>
    )
  }
}

export const Important = factory("important", "Important")
export const Caution = factory("caution", "Caution")
export const Warning = factory("warning", "Warning")
