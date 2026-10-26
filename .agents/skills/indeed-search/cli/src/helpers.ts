import { execFileSync } from "node:child_process"
import { readFileSync, unlinkSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"
const ACCEPT = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
const ACCEPT_LANG = "en-GB,en;q=0.9"

/** Fetch HTML using curl with standard browser headers to match site expectations */
export async function fetchIndeedHtml(url: string): Promise<string> {
  const curlCmd = process.platform === "win32" ? "curl.exe" : "curl"
  const tempFile = join(tmpdir(), `indeed_fetch_${Date.now()}_${Math.random().toString(36).slice(2)}.html`)
  const args = [
    "-sS",
    "--max-time", "30",
    "--compressed",
    "-A", BROWSER_UA,
    "-H", `Accept: ${ACCEPT}`,
    "-H", `Accept-Language: ${ACCEPT_LANG}`,
    "-o", tempFile,
    "--", url,
  ]

  try {
    execFileSync(curlCmd, args)
    const content = readFileSync(tempFile, "utf8")
    return content
  } catch (err: any) {
    throw new Error(`Failed to fetch Indeed page: ${err.message || String(err)}`)
  } finally {
    try {
      unlinkSync(tempFile)
    } catch {}
  }
}

export function stripHtml(html: string): string {
  if (!html) return ""
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  date: string | null
  url: string
  snippet?: string | null
}

export interface JobDetail extends JobCard {
  description: string | null
}

export function parseIndeedResults(html: string): JobCard[] {
  // Method 1: parse window.mosaic.providerData["mosaic-provider-jobcards"]
  const needle = 'window.mosaic.providerData["mosaic-provider-jobcards"]='
  const idx = html.indexOf(needle)
  if (idx !== -1) {
    let braceCount = 0
    let inString = false
    let escape = false
    let endIdx = -1
    const start = idx + needle.length
    for (let i = start; i < html.length; i++) {
      const ch = html[i]
      if (escape) {
        escape = false
        continue
      }
      if (ch === "\\") {
        escape = true
        continue
      }
      if (ch === '"') {
        inString = !inString
        continue
      }
      if (!inString) {
        if (ch === "{") braceCount++
        else if (ch === "}") {
          braceCount--
          if (braceCount === 0) {
            endIdx = i + 1
            break
          }
        }
      }
    }
    if (endIdx !== -1) {
      try {
        const jsonStr = html.slice(start, endIdx)
        const data = JSON.parse(jsonStr)
        const rawResults = data?.metaData?.mosaicProviderJobCardsModel?.results || []
        if (rawResults.length > 0) {
          return rawResults.map((r: any) => {
            let dateStr: string | null = null
            if (r.pubDate) {
              dateStr = new Date(r.pubDate).toISOString().split("T")[0]
            } else if (r.createDate) {
              dateStr = new Date(r.createDate).toISOString().split("T")[0]
            } else if (r.formattedRelativeTime) {
              dateStr = r.formattedRelativeTime
            }

            const jk = r.jobkey || ""
            return {
              id: jk,
              title: r.displayTitle || r.normTitle || "Untitled Role",
              company: r.company || null,
              companyUrl: r.companyOverviewLink ? `https://in.indeed.com${r.companyOverviewLink}` : null,
              location: r.formattedLocation || null,
              date: dateStr,
              url: `https://in.indeed.com/viewjob?jk=${jk}`,
              snippet: r.snippet ? stripHtml(r.snippet) : null,
            }
          })
        }
      } catch {
        // Fall through to regex
      }
    }
  }

  // Method 2: regex fallback on HTML card markup
  const cards: JobCard[] = []
  const cardRegex = /data-jk="([a-f0-9]+)"[\s\S]*?<span title="([^"]+)"[\s\S]*?data-testid="company-name"[^>]*>([^<]+)<[\s\S]*?data-testid="text-location"[^>]*>([^<]+)</g
  let m: RegExpExecArray | null
  while ((m = cardRegex.exec(html)) !== null) {
    cards.push({
      id: m[1],
      title: m[2].trim(),
      company: m[3].trim(),
      companyUrl: null,
      location: m[4].trim(),
      date: new Date().toISOString().split("T")[0],
      url: `https://in.indeed.com/viewjob?jk=${m[1]}`,
    })
  }
  return cards
}
