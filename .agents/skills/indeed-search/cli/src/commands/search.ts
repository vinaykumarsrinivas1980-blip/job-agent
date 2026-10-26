import {
  fetchIndeedHtml,
  parseIndeedResults,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage?: number
  page: number
  limit?: number
  domain?: string
  format: "json" | "table" | "plain"
}

function buildUrl(opts: SearchOpts): string {
  const domain = opts.domain || (opts.location?.toLowerCase().includes("india") || opts.location?.toLowerCase().includes("bengaluru") || !opts.location ? "in.indeed.com" : "www.indeed.com")
  const params = new URLSearchParams()
  if (opts.query) params.set("q", opts.query)
  if (opts.location) params.set("l", opts.location)
  if (opts.jobage && opts.jobage > 0) params.set("fromage", String(opts.jobage))
  if (opts.page > 1) params.set("start", String((opts.page - 1) * 10))

  return `https://${domain}/jobs?${params.toString()}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 42).padEnd(42)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 24).padEnd(24)
    const date = c.date || "—"
    return `${c.id.padEnd(16)} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(16) +
    " " +
    "TITLE".padEnd(42) +
    " " +
    "COMPANY".padEnd(26) +
    " " +
    "LOCATION".padEnd(24) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const url = buildUrl(opts)
    const html = await fetchIndeedHtml(url)
    let cards = parseIndeedResults(html)

    if (opts.limit !== undefined && opts.limit >= 0) {
      cards = cards.slice(0, opts.limit)
    }

    if (opts.format === "json") {
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: cards.length,
              page: opts.page,
            },
            results: cards,
          },
          null,
          2
        ) + "\n"
      )
    } else if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else {
      for (const c of cards) {
        process.stdout.write(
          `${c.title} — ${c.company || "Unknown"} (${c.location || "Remote"})\n  ${c.url}\n`
        )
      }
    }
    return 0
  } catch (err: any) {
    writeError(err.message || String(err), "FETCH_FAILED")
    return 1
  }
}
