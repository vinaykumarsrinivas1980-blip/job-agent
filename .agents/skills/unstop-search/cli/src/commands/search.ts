import {
  BASE_API_URL,
  apiFetch,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage?: number
  opportunity?: "jobs" | "internships" | "all"
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

interface UnstopItem {
  id: number
  title: string
  public_url?: string
  seo_url?: string
  updated_at?: string
  region?: string
  organisation?: {
    name?: string
    public_url?: string
  }
  jobDetail?: {
    locations?: string[]
    type?: string
    min_salary?: number
    max_salary?: number
  }
}

interface UnstopSearchResponse {
  data?: {
    total?: number
    current_page?: number
    data?: UnstopItem[]
  }
}

function buildUrl(opts: SearchOpts): string {
  const params = new URLSearchParams()
  if (opts.opportunity && opts.opportunity !== "all") {
    params.set("opportunity", opts.opportunity)
  } else if (!opts.opportunity) {
    // If query mentions intern, search internships, otherwise jobs
    const isIntern = (opts.query || "").toLowerCase().includes("intern")
    params.set("opportunity", isIntern ? "internships" : "jobs")
  }
  if (opts.query) {
    params.set("searchTerm", opts.query)
  }
  params.set("page", String(opts.page || 1))
  params.set("per_page", String(opts.limit && opts.limit > 0 ? Math.min(opts.limit, 50) : 20))
  return `${BASE_API_URL}?${params.toString()}`
}

function parseItem(item: UnstopItem): JobCard {
  let locationStr = "Remote/Online"
  if (item.jobDetail?.locations && item.jobDetail.locations.length > 0) {
    locationStr = item.jobDetail.locations.join(", ")
  } else if (item.region && item.region !== "online") {
    locationStr = item.region
  }

  let dateStr: string | null = null
  if (item.updated_at) {
    dateStr = item.updated_at.split("T")[0]
  }

  const url = item.seo_url || (item.public_url ? `https://unstop.com/${item.public_url}` : `https://unstop.com/jobs/${item.id}`)

  return {
    id: String(item.id),
    title: item.title || "Untitled Role",
    company: item.organisation?.name || null,
    companyUrl: item.organisation?.public_url ? `https://unstop.com/${item.organisation.public_url}` : null,
    location: locationStr,
    date: dateStr,
    url,
  }
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 42).padEnd(42)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 24).padEnd(24)
    const date = c.date || "—"
    return `${c.id.padEnd(10)} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(10) +
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
    const res = await apiFetch<UnstopSearchResponse>(url)
    const rawItems = res.data?.data || []
    let cards = rawItems.map(parseItem)

    // Filter by location if specified
    if (opts.location) {
      const locTarget = opts.location.toLowerCase()
      cards = cards.filter((c) => {
        if (!c.location) return false
        const l = c.location.toLowerCase()
        return l.includes(locTarget) || locTarget.includes(l) || (locTarget.includes("remote") && l.includes("online"))
      })
    }

    // Filter by recency if specified
    if (opts.jobage && opts.jobage > 0) {
      const cutoff = new Date(Date.now() - opts.jobage * 24 * 60 * 60 * 1000)
      cards = cards.filter((c) => {
        if (!c.date) return true
        const d = new Date(c.date)
        return !isNaN(d.getTime()) && d >= cutoff
      })
    }

    if (opts.limit !== undefined && opts.limit >= 0) {
      cards = cards.slice(0, opts.limit)
    }

    if (opts.format === "json") {
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: cards.length,
              total: res.data?.total ?? cards.length,
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
