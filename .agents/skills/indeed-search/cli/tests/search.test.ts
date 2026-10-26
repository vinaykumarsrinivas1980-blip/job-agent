import { describe, expect, test } from "bun:test"
import { runCLI } from "./helpers.js"

describe("indeed-cli", () => {
  test("prints help when called with no arguments", async () => {
    const res = await runCLI([])
    expect(res.exitCode).toBe(0)
    expect(res.stdout).toContain("indeed-cli")
  })

  test("returns error for missing detail argument", async () => {
    const res = await runCLI(["detail"])
    expect(res.exitCode).toBe(1)
    expect(res.stderr).toContain("USAGE_ERROR")
  })
})
