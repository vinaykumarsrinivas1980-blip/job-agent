#!/usr/bin/env bun
// Self-contained CLI for searching jobs on Indeed's public listings.
// Uses curl with standard browser headers to retrieve public listings.
// Zero runtime dependencies, runs with plain Bun.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--") || a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

const HELP = `indeed-cli — search jobs on Indeed (India and Global)

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (role, title, or skills). e.g. "python developer"
  --location, -l <text>   Location (e.g. "Bengaluru, Karnataka", "Remote").
  --jobage <days>         Posted within N days (e.g. 1, 7, 14, 30).
  --page <n>              1-indexed page. Default: 1.
  --limit, -n <n>         Max results to return (client cap). Default: 15.
  --domain <domain>       "in.indeed.com" (default for India) or "www.indeed.com".
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "machine learning intern" -l "Bengaluru" --format table
  bun run src/cli.ts search -q "devops" -l "Remote" --jobage 14 --format json
  bun run src/cli.ts detail 4122910bade22407 --format plain
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (flags.help || flags.h || !cmd) {
    process.stdout.write(HELP)
    return 0
  }

  if (cmd === "search") {
    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage: typeof flags.jobage === "string" ? parseInt(flags.jobage, 10) : undefined,
      page: typeof flags.page === "string" ? parseInt(flags.page, 10) : 1,
      limit: typeof flags.limit === "string" ? parseInt(flags.limit, 10) : 15,
      domain: typeof flags.domain === "string" ? flags.domain : undefined,
      format: (flags.format as any) || "json",
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const target = (flags._ as string[])[1]
    if (!target) {
      process.stderr.write(
        JSON.stringify({ error: "Missing required argument: <id|url>", code: "USAGE_ERROR" }) + "\n"
      )
      return 1
    }
    const opts: DetailOpts = {
      idOrUrl: target,
      format: (flags.format as any) || "json",
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command: ${cmd}`, code: "USAGE_ERROR" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
