import { describe, expect, test } from "bun:test"
import { runCLI } from "./helpers.js"

describe("unstop-cli", () => {
  test("prints help when called with no arguments", async () => {
    const res = await runCLI([])
    expect(res.exitCode).toBe(0)
    expect(res.stdout).toContain("unstop-cli")
  })

  test("runs search and returns json with meta and results", async () => {
    const res = await runCLI(["search", "-q", "python", "-n", "3", "--format", "json"])
    expect(res.exitCode).toBe(0)
    const data = JSON.parse(res.stdout)
    expect(data.meta).toBeDefined()
    expect(Array.isArray(data.results)).toBe(true)
    if (data.results.length > 0) {
      const first = data.results[0]
      expect(first.id).toBeDefined()
      expect(first.title).toBeDefined()
      expect(first.url).toBeDefined()
    }
  })

  test("returns error for missing detail argument", async () => {
    const res = await runCLI(["detail"])
    expect(res.exitCode).toBe(1)
    expect(res.stderr).toContain("USAGE_ERROR")
  })
})
