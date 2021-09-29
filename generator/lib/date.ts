export function formatDate(isoDate: string, includeTime: boolean): string {
  const timeIndex = isoDate.indexOf("T")
  let result = (
    timeIndex >= 0 ? isoDate.slice(0, timeIndex) : isoDate
  ).replaceAll("-", "/")

  if (includeTime && timeIndex >= 0) {
    result += " " + isoDate.slice(timeIndex + 1, timeIndex + 6)
  }

  return result
}
