import {
  BASE_API_URL,
  apiFetch,
  stripHtml,
  writeError,
  type JobDetail,
} from "../helpers.js"

export interface DetailOpts {
  idOrUrl: string
  format: "json" | "plain"
}

interface UnstopItem {
  id: number
  title: string
  public_url?: string
  seo_url?: string
  updated_at?: string
  end_date?: string
  region?: string
  details?: string
  organisation?: {
    name?: string
    public_url?: string
  }
  jobDetail?: {
    locations?: string[]
    type?: string
    timing?: string
    min_salary?: number
    max_salary?: number
    currency?: string
  }
}

interface UnstopSearchResponse {
  data?: {
    data?: UnstopItem[]
  }
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  try {
    const term = opts.idOrUrl.trim()
    const idMatch = term.match(/(\d+)(?:[/?#]|$)/)
    const targetId = idMatch ? idMatch[1] : null

    // Try without opportunity filter, then jobs, then internships
    const urls = [
      `${BASE_API_URL}?searchTerm=${encodeURIComponent(targetId || term)}&per_page=10`,
      `${BASE_API_URL}?opportunity=internships&searchTerm=${encodeURIComponent(targetId || term)}&per_page=10`,
      `${BASE_API_URL}?opportunity=jobs&searchTerm=${encodeURIComponent(targetId || term)}&per_page=10`,
    ]

    let foundItem: UnstopItem | null = null

    for (const u of urls) {
      try {
        const res = await apiFetch<UnstopSearchResponse>(u)
        const items = res.data?.data || []
        if (targetId) {
          foundItem = items.find((i) => String(i.id) === targetId) || null
        }
        if (!foundItem && items.length > 0) {
          foundItem = items[0]
        }
        if (foundItem) break
      } catch {
        // continue
      }
    }

    if (!foundItem) {
      writeError(`Job posting not found for ${opts.idOrUrl}`, "NOT_FOUND")
      return 1
    }

    const item = foundItem
    let locationStr = "Remote/Online"
    if (item.jobDetail?.locations && item.jobDetail.locations.length > 0) {
      locationStr = item.jobDetail.locations.join(", ")
    } else if (item.region && item.region !== "online") {
      locationStr = item.region
    }

    let salaryStr: string | null = null
    if (item.jobDetail?.min_salary || item.jobDetail?.max_salary) {
      salaryStr = `${item.jobDetail.min_salary || 0} - ${item.jobDetail.max_salary || "Open"} ${item.jobDetail.currency || ""}`.trim()
    }

    const detail: JobDetail = {
      id: String(item.id),
      title: item.title,
      company: item.organisation?.name || null,
      companyUrl: item.organisation?.public_url ? `https://unstop.com/${item.organisation.public_url}` : null,
      location: locationStr,
      date: item.updated_at ? item.updated_at.split("T")[0] : null,
      deadline: item.end_date ? item.end_date.split("T")[0] : null,
      url: item.seo_url || (item.public_url ? `https://unstop.com/${item.public_url}` : `https://unstop.com/jobs/${item.id}`),
      description: stripHtml(item.details || ""),
      type: item.jobDetail?.timing || item.jobDetail?.type || null,
      salary: salaryStr,
    }

    if (opts.format === "json") {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    } else {
      process.stdout.write(
        `# ${detail.title}\n\n` +
        `**Company:** ${detail.company || "Unknown"}\n` +
        `**Location:** ${detail.location || "Remote"}\n` +
        `**Date Posted:** ${detail.date || "Unknown"}\n` +
        `**Deadline:** ${detail.deadline || "Open"}\n` +
        `**URL:** ${detail.url}\n\n` +
        `---\n\n${detail.description || "No description provided."}\n`
      )
    }
    return 0
  } catch (err: any) {
    writeError(err.message || String(err), "FETCH_FAILED")
    return 1
  }
}
