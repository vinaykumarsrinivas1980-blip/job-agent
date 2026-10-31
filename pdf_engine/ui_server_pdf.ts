#!/usr/bin/env bun
/**
 * AI Job Search & Instant PDF Hub
 * 
 * Runs side-by-side without touching the core system.
 * Automatically generates and downloads tailored PDF resumes & cover letters:
 * - Resume_VinayKumar_<Company>.pdf
 * - CoverLetter_VinayKumar_<Company>.pdf
 */

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const PORT = 3001
const ROOT = join(import.meta.dir, "..")
const PDF_DIR = join(ROOT, "exported_pdfs")

interface SearchQuery {
  q: string
  location?: string
  platforms: string[]
  jobage?: number
}

interface JobResult {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  url: string
  snippet?: string | null
  platform: string
}

async function runCliSearch(skillName: string, args: string[]): Promise<JobResult[]> {
  const cliPath = join(ROOT, `.agents/skills/${skillName}/cli/src/cli.ts`)
  if (!existsSync(cliPath)) return []

  try {
    const proc = Bun.spawn(["bun", "run", cliPath, "search", ...args, "--format", "json"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const stdout = await new Response(proc.stdout).text()
    const exitCode = await proc.exited
    if (exitCode !== 0 || !stdout.trim()) return []

    const data = JSON.parse(stdout)
    const results = data.results || []
    return results.map((r: any) => ({
      id: String(r.id || ""),
      title: r.title || "Untitled",
      company: r.company || "Unknown Company",
      location: r.location || "Remote",
      date: r.date || null,
      url: r.url || "",
      snippet: r.snippet || null,
      platform: skillName.replace("-search", ""),
    }))
  } catch (err) {
    return []
  }
}

async function executeSearch(query: SearchQuery): Promise<JobResult[]> {
  const tasks: Promise<JobResult[]>[] = []

  // 1. Unstop Search
  if (query.platforms.includes("unstop")) {
    const args: string[] = ["-q", query.q]
    if (query.location) args.push("-l", query.location)
    if (query.jobage) args.push("--jobage", String(query.jobage))
    args.push("-n", "25")
    tasks.push(runCliSearch("unstop-search", args))
  }

  // 2. LinkedIn Search
  if (query.platforms.includes("linkedin")) {
    const args: string[] = ["-q", query.q]
    const loc = query.location || "Bengaluru, Karnataka, India"
    args.push("-l", loc)
    if (query.jobage) args.push("--jobage", String(query.jobage))
    args.push("-n", "25")
    tasks.push(runCliSearch("linkedin-search", args))
  }

  // 3. Freehire Search
  if (query.platforms.includes("freehire")) {
    const args: string[] = ["-q", query.q]
    if (query.location) args.push("-l", query.location)
    args.push("-n", "25")
    tasks.push(runCliSearch("freehire-search", args))
  }

  // 4. Indeed Search
  if (query.platforms.includes("indeed")) {
    const args: string[] = ["-q", query.q]
    if (query.location) args.push("-l", query.location)
    args.push("-n", "20")
    tasks.push(runCliSearch("indeed-search", args))
  }

  const resultsNested = await Promise.allSettled(tasks)
  const combined: JobResult[] = []

  for (const res of resultsNested) {
    if (res.status === "fulfilled") {
      combined.push(...res.value)
    }
  }

  // Always merge cached collected_jobs.json if matching query keywords
  const collectedPath = join(ROOT, "collected_jobs.json")
  if (existsSync(collectedPath)) {
    try {
      const cached = JSON.parse(readFileSync(collectedPath, "utf8"))
      const queryTerms = query.q.toLowerCase().split(/\s+/).filter(Boolean)
      const existingUrls = new Set(combined.map((c) => c.url))

      for (const item of cached) {
        if (!existingUrls.has(item.url)) {
          const textMatch = `${item.title} ${item.company || ""}`.toLowerCase()
          const matches = queryTerms.length === 0 || queryTerms.some((t: string) => textMatch.includes(t))
          if (matches) {
            combined.push({
              id: String(item.id || ""),
              title: item.title || "Untitled",
              company: item.company || "Unknown Company",
              location: item.location || "Bengaluru, Karnataka, India",
              date: item.date || null,
              url: item.url || "",
              snippet: item.snippet || item.title,
              platform: (item.source_portal || "linkedin").replace("-search", ""),
            })
            existingUrls.add(item.url)
          }
        }
      }
    } catch {}
  }

  const INDIAN_KEYWORDS = [
    "india", "bengaluru", "bangalore", "karnataka", "hyderabad", "telangana",
    "pune", "mumbai", "maharashtra", "delhi", "noida", "gurgaon", "gurugram",
    "chennai", "tamil nadu", "kolkata", "ahmedabad", "gujarat", "surat",
    "kochi", "kerala", "indore", "jaipur", "chandigarh", "mysore", "mangalore",
    "bhopal", "lucknow", "nagpur", "coimbatore", "visakhapatnam", "vizag",
    "thiruvananthapuram", "trivandrum", "bhubaneswar", "faridabad", "ghaziabad",
  ]

  const FOREIGN_EXCLUSIONS = [
    "france", "paris", "united states", "usa", "germany", "berlin",
    "united kingdom", "london", "canada", "toronto", "australia", "sydney",
    "netherlands", "amsterdam", "singapore", "ireland", "dublin",
    "switzerland", "zurich", "poland", "warsaw", "brazil", "japan", "tokyo",
    "spain", "madrid", "italy", "rome", "sweden", "denmark", "copenhagen",
    "austria", "hungary", "budapest", "romania", "czech", "prague",
  ]

  const indianJobsOnly = combined.filter((j) => {
    const loc = (j.location || "").toLowerCase()
    if (FOREIGN_EXCLUSIONS.some((f) => loc.includes(f))) return false
    return INDIAN_KEYWORDS.some((ind) => loc.includes(ind))
  })

  indianJobsOnly.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })

  return indianJobsOnly
}

function getTrackerData() {
  const trackerPath = join(ROOT, "job_search_tracker.csv")
  const seenPath = join(ROOT, "job_scraper/seen_jobs.json")
  let trackedJobs: any[] = []
  let seenCount = 0

  if (existsSync(trackerPath)) {
    const csv = readFileSync(trackerPath, "utf8")
    const lines = csv.trim().split("\n").filter(Boolean)
    if (lines.length > 1) {
      const headers = lines[0].split(",").map((h) => h.trim())
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",")
        const row: Record<string, string> = {}
        headers.forEach((h, idx) => {
          row[h] = parts[idx]?.trim() || ""
        })

        // Check if PDF exists in exported_pdfs
        const cleanCo = (row.company || "").replace(/[^\w\-_]/g, "_")
        const resumeFile = `Resume_VinayKumar_${cleanCo}.pdf`
        const coverFile = `CoverLetter_VinayKumar_${cleanCo}.pdf`

        row.has_resume_pdf = existsSync(join(PDF_DIR, resumeFile)) ? resumeFile : ""
        row.has_cover_pdf = existsSync(join(PDF_DIR, coverFile)) ? coverFile : ""

        trackedJobs.push(row)
      }
    }
  }

  if (existsSync(seenPath)) {
    try {
      const seenData = JSON.parse(readFileSync(seenPath, "utf8"))
      seenCount = Object.keys(seenData.seen || {}).length
    } catch {}
  }

  return { trackedJobs, seenCount }
}

async function generatePdfForCompany(company: string, role: string, snippet: string = "", location: string = "") {
  const scriptPath = join(ROOT, "pdf_engine", "pdf_generator.py")
  const args = ["python", scriptPath, company, role]
  if (snippet) args.push(snippet)

  const proc = Bun.spawn(args, {
    stdout: "pipe",
    stderr: "pipe",
    cwd: ROOT,
  })
  const stdout = await new Response(proc.stdout).text()
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    throw new Error(`PDF generation failed: ${stdout}`)
  }

  const cleanCo = company.replace(/[^\w\-_]/g, "_")
  return {
    resume_file: `Resume_VinayKumar_${cleanCo}.pdf`,
    cover_file: `CoverLetter_VinayKumar_${cleanCo}.pdf`,
  }
}

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Job Search Hub & Instant PDF Generator</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-border: #1f293d;
      --text-main: #f9fafb;
      --text-muted: #94a3b8;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --success: #10b981;
      --success-hover: #059669;
      --badge-unstop: #ec4899;
      --badge-linkedin: #0a66c2;
      --badge-indeed: #2557a7;
      --badge-freehire: #10b981;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      line-height: 1.5;
      padding-bottom: 80px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }

    header {
      padding: 32px 0 24px;
      border-bottom: 1px solid var(--card-border);
      background: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .header-title h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-title p {
      color: var(--text-muted);
      font-size: 14px;
      margin-top: 4px;
    }

    .tag-live {
      background: rgba(16, 185, 129, 0.15);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .tag-live::before {
      content: '';
      width: 7px;
      height: 7px;
      background-color: var(--success);
      border-radius: 50%;
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.2); }
      100% { opacity: 1; transform: scale(1); }
    }

    .search-panel {
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      margin-top: 28px;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
    }

    .search-grid {
      display: grid;
      grid-template-columns: 2fr 1fr auto;
      gap: 16px;
    }

    .input-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 6px;
    }

    .input-field {
      width: 100%;
      background: #090d16;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 12px 16px;
      color: var(--text-main);
      font-size: 15px;
      outline: none;
      transition: all 0.2s;
    }

    .input-field:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    .btn-search {
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 0 28px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.2s;
      height: 46px;
      margin-top: 25px;
    }

    .btn-search:hover { background: var(--accent-hover); }

    .platform-checkboxes {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--card-border);
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: var(--text-muted);
      cursor: pointer;
      user-select: none;
    }

    .job-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }

    .job-card {
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.2s, border-color 0.2s;
    }

    .job-card:hover {
      transform: translateY(-2px);
      border-color: #374151;
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }

    .job-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
    }

    .platform-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-unstop { background: rgba(236, 72, 153, 0.15); color: var(--badge-unstop); }
    .badge-linkedin { background: rgba(10, 102, 194, 0.15); color: #38bdf8; }
    .badge-indeed { background: rgba(37, 87, 167, 0.15); color: #60a5fa; }
    .badge-freehire { background: rgba(16, 185, 129, 0.15); color: #34d399; }

    .company-info {
      font-size: 14px;
      color: #e2e8f0;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }

    .meta-tag {
      font-size: 12px;
      color: var(--text-muted);
      background: #090d16;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #1f2937;
    }

    .snippet {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 16px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 14px;
      border-top: 1px solid var(--card-border);
    }

    .action-row {
      display: flex;
      gap: 8px;
    }

    .btn-apply-portal {
      flex: 1;
      background: #1f293d;
      color: #fff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 9px 12px;
      border-radius: 8px;
      text-align: center;
      transition: background 0.2s;
    }

    .btn-apply-portal:hover { background: #2b3952; }

    .btn-generate-pdf {
      flex: 1;
      background: var(--success);
      color: #fff;
      border: none;
      font-size: 13px;
      font-weight: 600;
      padding: 9px 12px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.2s;
    }

    .btn-generate-pdf:hover { background: var(--success-hover); }

    .btn-cover-pdf {
      background: #475569;
      color: #fff;
      border: none;
      font-size: 13px;
      font-weight: 600;
      padding: 9px 12px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background 0.2s;
    }

    .btn-cover-pdf:hover { background: #334155; }

    /* Tracker Table */
    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin: 40px 0 16px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tracker-table {
      width: 100%;
      border-collapse: collapse;
      background-color: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
    }

    .tracker-table th, .tracker-table td {
      padding: 14px 16px;
      text-align: left;
      font-size: 14px;
      border-bottom: 1px solid var(--card-border);
    }

    .tracker-table th {
      background: #090d16;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .btn-dl {
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid #334155;
      padding: 4px 8px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-right: 6px;
    }
    .btn-dl:hover { background: #334155; color: #fff; }

    .notification {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: #fff;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      display: none;
      z-index: 100;
    }
  </style>
</head>
<body>
  <header>
    <div class="container header-content">
      <div class="header-title">
        <h1>AI Job Search Hub <span class="tag-live">Direct PDF Generator</span></h1>
        <p>Targeting AI/ML, Python, and Embedded roles for <strong>Vinay Kumar S</strong></p>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="search-panel">
      <div class="search-grid">
        <div class="input-group">
          <label for="query">Target Roles / Keywords</label>
          <input type="text" id="query" class="input-field" value="AI ML Intern" placeholder="e.g. AI ML Intern, Python Developer, Robotics">
        </div>
        <div class="input-group">
          <label for="location">Location</label>
          <input type="text" id="location" class="input-field" value="Bengaluru" placeholder="e.g. Bengaluru, Remote, India">
        </div>
        <button id="searchBtn" class="btn-search" onclick="doSearch()">
          <span>🔍</span>
          <span>Search Jobs</span>
        </button>
      </div>

      <div class="platform-checkboxes">
        <span style="font-size: 13px; font-weight: 600; color: var(--text-muted); align-self: center;">Portals:</span>
        <label class="checkbox-label"><input type="checkbox" id="chk-unstop" checked> Unstop</label>
        <label class="checkbox-label"><input type="checkbox" id="chk-linkedin" checked> LinkedIn</label>
        <label class="checkbox-label"><input type="checkbox" id="chk-indeed" checked> Indeed</label>
        <label class="checkbox-label"><input type="checkbox" id="chk-freehire" checked> FreeHire</label>
      </div>
    </div>

    <div style="margin-top: 24px; display: flex; justify-content: space-between; align-items: center;">
      <h2 style="font-size: 18px; font-weight: 700;">Live Positions</h2>
      <span id="resultsCount" style="font-size: 14px; color: var(--text-muted);">Loading initial positions...</span>
    </div>

    <div id="jobGrid" class="job-grid"></div>

    <h2 class="section-title">📊 Tracked Applications & Ready PDFs</h2>
    <table class="tracker-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Company</th>
          <th>Role</th>
          <th>Status</th>
          <th>Fit Score</th>
          <th>Ready Uploadable PDFs</th>
        </tr>
      </thead>
      <tbody id="trackerBody">
        <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading tracker...</td></tr>
      </tbody>
    </table>
  </main>

  <div id="toast" class="notification">PDF Generated Successfully!</div>

  <script>
    async function doSearch() {
      const q = document.getElementById('query').value.trim();
      const loc = document.getElementById('location').value.trim();
      const platforms = [];
      if (document.getElementById('chk-unstop').checked) platforms.push('unstop');
      if (document.getElementById('chk-linkedin').checked) platforms.push('linkedin');
      if (document.getElementById('chk-indeed').checked) platforms.push('indeed');
      if (document.getElementById('chk-freehire').checked) platforms.push('freehire');

      const grid = document.getElementById('jobGrid');
      const countEl = document.getElementById('resultsCount');
      countEl.innerText = 'Searching portals...';
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Fetching live listings...</div>';

      try {
        const res = await fetch(\`/api/search?q=\${encodeURIComponent(q)}&location=\${encodeURIComponent(loc)}&platforms=\${platforms.join(',')}\`);
        const data = await res.json();
        const results = data.results || [];
        countEl.innerText = \`Found \${results.length} positions\`;

        if (results.length === 0) {
          grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">No positions found. Try broadening keywords.</div>';
          return;
        }

        grid.innerHTML = results.map(j => \`
          <div class="job-card">
            <div>
              <div class="card-top">
                <h3 class="job-title">\${escapeHtml(j.title)}</h3>
                <span class="platform-badge badge-\${j.platform}">\${j.platform}</span>
              </div>
              <div class="company-info">🏢 \${escapeHtml(j.company || 'Unknown')}</div>
              <div class="meta-tags">
                <span class="meta-tag">📍 \${escapeHtml(j.location || 'Remote')}</span>
                \${j.date ? \`<span class="meta-tag">📅 \${j.date}</span>\` : ''}
              </div>
              \${j.snippet ? \`<div class="snippet">\${escapeHtml(j.snippet)}</div>\` : ''}
            </div>
            <div class="card-actions">
              <a href="\${j.url}" target="_blank" rel="noopener noreferrer" class="btn-apply-portal">1. View on Portal ↗</a>
              <div class="action-row">
                <button class="btn-generate-pdf" onclick="generatePdf('\${escapeAttr(j.company)}', '\${escapeAttr(j.title)}', '\${escapeAttr(j.snippet || \'\')}', '\${escapeAttr(j.location || \'\')}')">
                  <span>📄</span> 2. Get PDF Resume
                </button>
                <button class="btn-cover-pdf" onclick="generateCover('\${escapeAttr(j.company)}', '\${escapeAttr(j.title)}', '\${escapeAttr(j.snippet || \'\')}', '\${escapeAttr(j.location || \'\')}')">
                  <span>✉</span> Cover Letter
                </button>
              </div>
            </div>
          </div>
        \`).join('');
      } catch (err) {
        countEl.innerText = 'Search failed';
        grid.innerHTML = '<div style="grid-column: 1/-1; color: #ef4444; text-align: center;">Error fetching jobs.</div>';
      }
    }

    async function generatePdf(company, role, snippet, location) {
      showToast('Generating tailored Resume for ' + company + '...');
      try {
        const params = new URLSearchParams({
          company: company || 'Company',
          role: role || 'Intern',
          snippet: snippet || '',
          location: location || 'Bengaluru, India',
        });
        const res = await fetch('/api/export-pdf?' + params.toString());
        const data = await res.json();
        if (data.resume_file) {
          showToast('Downloaded: ' + data.resume_file);
          window.open('/exported_pdfs/' + data.resume_file, '_blank');
          loadTracker();
        } else {
          alert('Could not generate PDF: ' + (data.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Generation failed: ' + e.message);
      }
    }

    async function generateCover(company, role, snippet, location) {
      showToast('Generating tailored Cover Letter for ' + company + '...');
      try {
        const params = new URLSearchParams({
          company: company || 'Company',
          role: role || 'Intern',
          snippet: snippet || '',
          location: location || 'Bengaluru, India',
        });
        const res = await fetch('/api/export-pdf?' + params.toString());
        const data = await res.json();
        if (data.cover_file) {
          showToast('Downloaded: ' + data.cover_file);
          window.open('/exported_pdfs/' + data.cover_file, '_blank');
          loadTracker();
        } else {
          alert('Could not generate Cover Letter: ' + (data.error || 'Unknown error'));
        }
      } catch (e) {
        alert('Generation failed: ' + e.message);
      }
    }

    async function loadTracker() {
      try {
        const res = await fetch('/api/tracker');
        const data = await res.json();
        const body = document.getElementById('trackerBody');
        if (data.trackedJobs.length === 0) {
          body.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No tracked applications yet.</td></tr>';
          return;
        }

        body.innerHTML = data.trackedJobs.map(j => \`
          <tr>
            <td>\${j.date || '—'}</td>
            <td><strong>\${j.company || '—'}</strong></td>
            <td>\${j.role || '—'}</td>
            <td><span style="background: rgba(59,130,246,0.15); color: #60a5fa; padding: 2px 8px; border-radius: 4px; font-size: 12px;">\${j.status || 'Drafted'}</span></td>
            <td>\${j.fit_rating || '—'}</td>
            <td>
              \${j.has_resume_pdf ? \`<a href="/exported_pdfs/\${j.has_resume_pdf}" target="_blank" class="btn-dl">📄 \${j.has_resume_pdf}</a>\` : \`<button onclick="generatePdf('\${escapeAttr(j.company)}', '\${escapeAttr(j.role)}')" class="btn-dl">➕ Create Resume PDF</button>\`}
              \${j.has_cover_pdf ? \`<a href="/exported_pdfs/\${j.has_cover_pdf}" target="_blank" class="btn-dl">✉ \${j.has_cover_pdf}</a>\` : ''}
            </td>
          </tr>
        \`).join('');
      } catch (e) {
        console.error(e);
      }
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.innerText = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3500);
    }

    function escapeHtml(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function escapeAttr(s) {
      return String(s || '').replace(/'/g, "\\\\'").replace(/"/g, '&quot;');
    }

    window.addEventListener('DOMContentLoaded', () => {
      doSearch();
      loadTracker();
    });
  </script>
</body>
</html>
`

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)

    // Route: Static Dashboard Page
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML_PAGE, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      })
    }

    // Route: Live Search
    if (url.pathname === "/api/search") {
      const q = url.searchParams.get("q") || "AI ML"
      const location = url.searchParams.get("location") || "Bengaluru"
      const platforms = (url.searchParams.get("platforms") || "unstop,linkedin,indeed,freehire").split(",")
      const results = await executeSearch({ q, location, platforms })
      return new Response(JSON.stringify({ results }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Route: Tracker
    if (url.pathname === "/api/tracker") {
      const data = getTrackerData()
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Route: Export PDF
    if (url.pathname === "/api/export-pdf") {
      const company = url.searchParams.get("company") || "Company"
      const role = url.searchParams.get("role") || "Intern"
      const snippet = url.searchParams.get("snippet") || ""
      const location = url.searchParams.get("location") || "Bengaluru, India"
      try {
        const res = await generatePdfForCompany(company, role, snippet, location)
        return new Response(JSON.stringify(res), {
          headers: { "Content-Type": "application/json" },
        })
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
      }
    }

    // Route: Serve PDF file
    if (url.pathname.startsWith("/exported_pdfs/")) {
      const filename = url.pathname.replace("/exported_pdfs/", "")
      const filePath = join(PDF_DIR, filename)
      if (existsSync(filePath)) {
        const fileContent = readFileSync(filePath)
        return new Response(fileContent, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="${filename}"`,
          },
        })
      }
      return new Response("PDF not found", { status: 404 })
    }

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`\n======================================================`)
console.log(`🚀 AI Job Search & Instant PDF Server is running!`)
console.log(`👉 Open: http://localhost:${server.port}`)
console.log(`📁 Exported PDFs folder: ${PDF_DIR}`)
console.log(`======================================================\n`)
