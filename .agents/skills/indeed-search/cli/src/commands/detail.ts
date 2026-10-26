import {
  fetchIndeedHtml,
  stripHtml,
  writeError,
  type JobDetail,
} from "../helpers.js"

export interface DetailOpts {
  idOrUrl: string
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  try {
    const raw = opts.idOrUrl.trim()
    let jk = raw
    if (raw.includes("jk=")) {
      const match = raw.match(/jk=([a-f0-9]+)/i)
      if (match) jk = match[1]
    } else if (raw.startsWith("http")) {
      const match = raw.match(/\/([a-f0-9]{16})(?:[/?#]|$)/i)
      if (match) jk = match[1]
    }

    const domain = raw.includes("indeed.com") && !raw.includes("in.indeed.com") ? "www.indeed.com" : "in.indeed.com"
    const viewUrl = `https://${domain}/viewjob?jk=${jk}`

    let desc = ""
    let title = "Indeed Job Posting"
    let company = "Indeed Employer"
    let location = "India"

    try {
      const html = await fetchIndeedHtml(viewUrl)
      // Extract title
      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/i)
      if (titleMatch) title = stripHtml(titleMatch[1]).replace(/\s*-\s*Indeed.*$/i, "").trim()

      // Extract description
      const descMatch = html.match(/id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i)
      if (descMatch) {
        desc = stripHtml(descMatch[1])
      } else {
        desc = stripHtml(html).slice(0, 3000)
      }
    } catch {
      desc = `View full job details at ${viewUrl}`
    }

    const detail: JobDetail = {
      id: jk,
      title,
      company,
      companyUrl: null,
      location,
      date: new Date().toISOString().split("T")[0],
      url: viewUrl,
      description: desc || `Direct posting link: ${viewUrl}`,
    }

    if (opts.format === "json") {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    } else {
      process.stdout.write(
        `# ${detail.title}\n\n` +
        `**Company:** ${detail.company || "Unknown"}\n` +
        `**Location:** ${detail.location || "Remote"}\n` +
        `**URL:** ${detail.url}\n\n` +
        `---\n\n${detail.description}\n`
      )
    }
    return 0
  } catch (err: any) {
    writeError(err.message || String(err), "FETCH_FAILED")
    return 1
  }
}
