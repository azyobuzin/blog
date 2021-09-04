export function tagUrl(tag: string): string {
  return `/tags/${tag.split("/").map(encodeURIComponent).join("/")}/`
}
