import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn utility function", () => {
  it("merges single and multiple string class names", () => {
    expect(cn("px-2")).toBe("px-2")
    expect(cn("px-2", "py-1", "text-center")).toBe("px-2 py-1 text-center")
  })

  it("handles conditional class objects", () => {
    expect(
      cn("btn", {
        "bg-blue-500": true,
        "text-white": true,
        "opacity-50": false,
      })
    ).toBe("btn bg-blue-500 text-white")
  })

  it("ignores falsy values (false, null, undefined, 0, empty string)", () => {
    expect(cn("px-2", false, null, undefined, 0, "", "py-1")).toBe("px-2 py-1")
  })

  it("flattens array class names and nested arrays", () => {
    expect(cn(["px-2", "py-1"], ["text-sm", ["font-bold"]])).toBe(
      "px-2 py-1 text-sm font-bold"
    )
  })

  it("correctly resolves conflicting Tailwind CSS classes", () => {
    expect(cn("px-2 px-4")).toBe("px-4")
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500")
    expect(cn("p-4", "px-2")).toBe("p-4 px-2")
    expect(cn("text-red-500 text-sm", "text-blue-500 text-lg")).toBe(
      "text-blue-500 text-lg"
    )
  })

  it("returns empty string when no inputs or only falsy inputs are provided", () => {
    expect(cn()).toBe("")
    expect(cn(null, undefined, false)).toBe("")
  })
})
