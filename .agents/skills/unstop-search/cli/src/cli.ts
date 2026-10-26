#!/usr/bin/env bun
// Self-contained CLI for searching jobs and internships on Unstop.
// Queries Unstop's public opportunity search REST API (clean JSON).
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

const HELP = `unstop-cli — search jobs and internships on Unstop

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (role, title, or skills).
  --location, -l <text>   Filter by city or "remote" (e.g. "Bengaluru").
  --opportunity <type>    jobs | internships | all. Default: auto-inferred (internships if "intern" in query, else jobs).
  --jobage <days>         Posted within N days.
  --page <n>              1-indexed page. Default: 1.
  --limit, -n <n>         Max results to return (client cap). Default: 20.
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "machine learning intern" -l "Bengaluru" --format table
  bun run src/cli.ts search -q "python developer" --jobage 14 --format json
  bun run src/cli.ts detail 1766700 --format plain
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
      opportunity: (flags.opportunity as any) || undefined,
      page: typeof flags.page === "string" ? parseInt(flags.page, 10) : 1,
      limit: typeof flags.limit === "string" ? parseInt(flags.limit, 10) : 20,
      format: (flags.format as any) || "json",
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const target = (flags._ as string[])[1]
    if (!target) {
      process.stderr.write(JSON.stringify({ error: "Missing required argument: <id|url>", code: "USAGE_ERROR" }) + "\n")
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
