import { formatDate } from "./date"

describe("formatDate", () => {
  test("date only", () => {
    const input = "2021-09-30"
    const output = "2021/09/30"
    expect(formatDate(input, false)).toBe(output)
    expect(formatDate(input, true)).toBe(output)
  })

  test("date and time", () => {
    expect(formatDate("2021-09-30T01:47:01+09:00", true)).toBe(
      "2021/09/30 01:47",
    )
  })

  test("exclude time", () => {
    expect(formatDate("2021-09-30T01:47:01+09:00", false)).toBe("2021/09/30")
  })
})
