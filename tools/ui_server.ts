#!/usr/bin/env bun
/**
 * Interactive Job Search Dashboard & Local Web UI
 * 
 * Run with:
 *   bun run tools/ui_server.ts
 * 
 * Opens an interactive local web app at http://localhost:3000 where you can:
 * - Search across Unstop, LinkedIn, Freehire, and Indeed with one click.
 * - Filter by location, freshness, and platform.
 * - View detailed job cards with direct portal links.
 * - One-click copy for the Claude `/apply <url>` command.
 * - Inspect your application tracker and seen jobs without terminal commands.
 */

import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const PORT = 3000
const ROOT = join(import.meta.dir, "..")

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
      snippet: r.snippet || r.description || null,
      platform: skillName.replace("-search", ""),
    }))
  } catch (err) {
    console.error(`[Search Error] ${skillName}:`, err)
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
    if (query.jobage) args.push("--jobage", String(query.jobage))
    args.push("-n", "25")
    tasks.push(runCliSearch("freehire-search", args))
  }

  // 4. Indeed Search
  if (query.platforms.includes("indeed")) {
    const args: string[] = ["-q", query.q]
    if (query.location) args.push("-l", query.location)
    if (query.jobage) args.push("--jobage", String(query.jobage))
    args.push("-n", "20")
    tasks.push(runCliSearch("indeed-search", args))
  }

  const resultArrays = await Promise.allSettled(tasks)
  const combined: JobResult[] = []

  for (const res of resultArrays) {
    if (res.status === "fulfilled") {
      combined.push(...res.value)
    }
  }

  // Sort by recency (newest date first)
  combined.sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })

  return combined
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

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Job Search Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --card-border: #1f2937;
      --text-main: #f9fafb;
      --text-muted: #9ca3af;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --badge-unstop: #ec4899;
      --badge-linkedin: #0a66c2;
      --badge-indeed: #2557a7;
      --badge-freehire: #10b981;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.5;
      padding-bottom: 60px;
    }

    header {
      background: linear-gradient(180deg, #131b2e 0%, #0b0f19 100%);
      border-bottom: 1px solid var(--card-border);
      padding: 24px 32px;
      position: sticky;
      top: 0;
      z-index: 50;
      backdrop-filter: blur(10px);
    }

    .header-content {
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      font-size: 28px;
    }

    .brand h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .brand p {
      font-size: 13px;
      color: var(--text-muted);
    }

    .nav-tabs {
      display: flex;
      gap: 8px;
      background: #1f2937;
      padding: 4px;
      border-radius: 8px;
    }

    .nav-tab {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-tab.active {
      background: var(--accent);
      color: white;
    }

    .container {
      max-width: 1300px;
      margin: 28px auto;
      padding: 0 32px;
    }

    .search-panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      margin-bottom: 32px;
    }

    .search-row {
      display: grid;
      grid-template-columns: 2fr 1.5fr auto;
      gap: 16px;
      margin-bottom: 18px;
    }

    @media (max-width: 860px) {
      .search-row { grid-template-columns: 1fr; }
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-group label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }

    .input-control {
      background: #090d16;
      border: 1px solid #2d3748;
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .input-control:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .btn-search {
      align-self: flex-end;
      background: var(--accent);
      color: white;
      border: none;
      padding: 12px 28px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
      height: 44px;
    }

    .btn-search:hover {
      background: var(--accent-hover);
    }

    .filter-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      padding-top: 14px;
      border-top: 1px solid var(--card-border);
    }

    .platform-checkboxes {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px;
    }

    .platform-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-muted);
    }

    .chip-check {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #1e2638;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      user-select: none;
    }

    .chip-check input {
      accent-color: var(--accent);
      cursor: pointer;
    }

    .quick-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }

    .quick-tag {
      background: rgba(59, 130, 246, 0.1);
      color: #93c5fd;
      border: 1px solid rgba(59, 130, 246, 0.2);
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 100px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .quick-tag:hover {
      background: rgba(59, 130, 246, 0.25);
      border-color: #3b82f6;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .results-count {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 20px;
    }

    @media (max-width: 640px) {
      .results-grid { grid-template-columns: 1fr; }
    }

    .job-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: transform 0.15s, border-color 0.15s;
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
      margin-bottom: 12px;
    }

    .job-title {
      font-size: 16px;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.3;
    }

    .platform-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .badge-unstop { background: rgba(236, 72, 153, 0.2); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4); }
    .badge-linkedin { background: rgba(10, 102, 194, 0.2); color: #60a5fa; border: 1px solid rgba(10, 102, 194, 0.4); }
    .badge-indeed { background: rgba(37, 87, 167, 0.2); color: #93c5fd; border: 1px solid rgba(37, 87, 167, 0.4); }
    .badge-freehire { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }

    .company-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #e5e7eb;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 14px;
    }

    .meta-tag {
      background: #1f2937;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .snippet {
      font-size: 13px;
      color: #9ca3af;
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      line-height: 1.45;
    }

    .card-actions {
      display: flex;
      gap: 10px;
      padding-top: 14px;
      border-top: 1px solid #1f2937;
    }

    .btn-apply-portal {
      flex: 1;
      text-align: center;
      background: #2563eb;
      color: white;
      text-decoration: none;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.15s;
    }

    .btn-apply-portal:hover {
      background: #1d4ed8;
    }

    .btn-copy-command {
      background: #1f2937;
      color: #d1d5db;
      border: 1px solid #374151;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s;
    }

    .btn-copy-command:hover {
      background: #374151;
      color: white;
    }

    .btn-copy-command.copied {
      background: #065f46;
      color: #6ee7b7;
      border-color: #059669;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--text-muted);
    }

    .empty-state p {
      font-size: 15px;
      margin-top: 8px;
    }

    .tracker-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
    }

    .tracker-table th, .tracker-table td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--card-border);
      font-size: 13px;
    }

    .tracker-table th {
      background: #111827;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
    }

    .status-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 100px;
      display: inline-block;
    }

    .status-applied { background: rgba(59, 130, 246, 0.2); color: #93c5fd; }
    .status-interview { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; }
    .status-drafted { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
  </style>
</head>
<body>

  <header>
    <div class="header-content">
      <div class="brand">
        <span class="brand-icon">⚡</span>
        <div>
          <h1>AI Job Search Hub</h1>
          <p>Local interactive search across Unstop, LinkedIn, Indeed & Freehire</p>
        </div>
      </div>
      <div class="nav-tabs">
        <button class="nav-tab active" onclick="switchTab('search')">Search Jobs</button>
        <button class="nav-tab" onclick="switchTab('tracker')">Application Tracker</button>
      </div>
    </div>
  </header>

  <main class="container">
    
    <!-- SEARCH TAB -->
    <div id="tab-search">
      <div class="search-panel">
        <div class="search-row">
          <div class="input-group">
            <label for="qInput">Job Title / Skills</label>
            <input type="text" id="qInput" class="input-control" placeholder="e.g. AI ML Intern, Python Developer..." value="AI ML Intern">
          </div>
          <div class="input-group">
            <label for="locInput">Location</label>
            <input type="text" id="locInput" class="input-control" placeholder="e.g. Bengaluru, Remote..." value="Bengaluru, Karnataka">
          </div>
          <button id="btnSearch" class="btn-search" onclick="doSearch()">
            <span id="searchIcon">🔍</span>
            <span id="searchText">Search Jobs</span>
          </button>
        </div>

        <div class="quick-tags">
          <span style="font-size: 12px; color: var(--text-muted); align-self: center;">Quick Picks:</span>
          <span class="quick-tag" onclick="setQuery('AI ML Intern')">AI ML Intern</span>
          <span class="quick-tag" onclick="setQuery('Python Developer Intern')">Python Developer Intern</span>
          <span class="quick-tag" onclick="setQuery('Machine Learning Engineer')">Machine Learning</span>
          <span class="quick-tag" onclick="setQuery('DevOps Intern')">DevOps Intern</span>
          <span class="quick-tag" onclick="setQuery('Data Science Intern')">Data Science</span>
        </div>

        <div class="filter-row">
          <div class="platform-checkboxes">
            <span class="platform-label">Platforms:</span>
            <label class="chip-check">
              <input type="checkbox" id="checkUnstop" checked value="unstop"> Unstop
            </label>
            <label class="chip-check">
              <input type="checkbox" id="checkLinkedin" checked value="linkedin"> LinkedIn
            </label>
            <label class="chip-check">
              <input type="checkbox" id="checkIndeed" checked value="indeed"> Indeed
            </label>
            <label class="chip-check">
              <input type="checkbox" id="checkFreehire" checked value="freehire"> Freehire
            </label>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <label for="ageSelect" style="font-size: 12px; color: var(--text-muted); font-weight: 500;">Freshness:</label>
            <select id="ageSelect" class="input-control" style="padding: 6px 12px; height: 34px;">
              <option value="14" selected>Past 14 Days</option>
              <option value="7">Past 7 Days</option>
              <option value="30">Past 30 Days</option>
              <option value="0">All Time</option>
            </select>
          </div>
        </div>
      </div>

      <div class="results-header">
        <div class="results-count" id="resultsCount">Ready to search</div>
      </div>

      <div class="results-grid" id="resultsGrid">
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div style="font-size: 40px; margin-bottom: 12px;">🎯</div>
          <h3>Click "Search Jobs" to search live opportunities</h3>
          <p>Scrapes live listings from Unstop, LinkedIn, Indeed, and Freehire concurrently.</p>
        </div>
      </div>
    </div>

    <!-- TRACKER TAB -->
    <div id="tab-tracker" style="display: none;">
      <div class="search-panel">
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Application Tracker</h2>
        <p style="color: var(--text-muted); font-size: 13px;" id="trackerSummary">Loading tracker data...</p>
        <div style="overflow-x: auto;">
          <table class="tracker-table" id="trackerTable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Company</th>
                <th>Role</th>
                <th>Status</th>
                <th>Fit</th>
                <th>Channel</th>
              </tr>
            </thead>
            <tbody id="trackerBody">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No tracked applications yet.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

  </main>

  <script>
    function setQuery(q) {
      document.getElementById('qInput').value = q;
      doSearch();
    }

    function switchTab(tab) {
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      if (tab === 'search') {
        document.querySelector('.nav-tab:nth-child(1)').classList.add('active');
        document.getElementById('tab-search').style.display = 'block';
        document.getElementById('tab-tracker').style.display = 'none';
      } else {
        document.querySelector('.nav-tab:nth-child(2)').classList.add('active');
        document.getElementById('tab-search').style.display = 'none';
        document.getElementById('tab-tracker').style.display = 'block';
        loadTracker();
      }
    }

    async function doSearch() {
      const q = document.getElementById('qInput').value.trim();
      const loc = document.getElementById('locInput').value.trim();
      const jobage = document.getElementById('ageSelect').value;

      const platforms = [];
      if (document.getElementById('checkUnstop').checked) platforms.push('unstop');
      if (document.getElementById('checkLinkedin').checked) platforms.push('linkedin');
      if (document.getElementById('checkIndeed').checked) platforms.push('indeed');
      if (document.getElementById('checkFreehire').checked) platforms.push('freehire');

      if (!q) {
        alert('Please enter a role or skill to search');
        return;
      }

      const btn = document.getElementById('btnSearch');
      const icon = document.getElementById('searchIcon');
      const text = document.getElementById('searchText');
      const countEl = document.getElementById('resultsCount');
      const grid = document.getElementById('resultsGrid');

      btn.disabled = true;
      icon.innerHTML = '<span class="spinner"></span>';
      text.innerText = 'Searching...';
      countEl.innerText = 'Searching portals across live APIs...';

      try {
        const params = new URLSearchParams({
          q,
          location: loc,
          platforms: platforms.join(','),
          jobage,
        });

        const res = await fetch('/api/search?' + params.toString());
        const data = await res.json();
        const results = data.results || [];

        countEl.innerText = 'Found ' + results.length + ' matching position' + (results.length === 1 ? '' : 's');

        if (results.length === 0) {
          grid.innerHTML = \`
            <div class="empty-state" style="grid-column: 1 / -1;">
              <div style="font-size: 40px; margin-bottom: 12px;">🔍</div>
              <h3>No positions found for this query</h3>
              <p>Try broadening your query keywords or adjusting location.</p>
            </div>
          \`;
          return;
        }

        grid.innerHTML = results.map(job => {
          const badgeClass = 'badge-' + (job.platform || 'unstop');
          return \`
            <div class="job-card">
              <div>
                <div class="card-top">
                  <h3 class="job-title">\${escapeHtml(job.title)}</h3>
                  <span class="platform-badge \${badgeClass}">\${job.platform}</span>
                </div>
                <div class="company-info">🏢 \${escapeHtml(job.company || 'Unknown')}</div>
                <div class="meta-tags">
                  <span class="meta-tag">📍 \${escapeHtml(job.location || 'Remote')}</span>
                  \${job.date ? \`<span class="meta-tag">📅 \${job.date}</span>\` : ''}
                </div>
                \${job.snippet ? \`<div class="snippet">\${escapeHtml(job.snippet)}</div>\` : ''}
              </div>

              <div class="card-actions">
                <a href="\${job.url}" target="_blank" rel="noopener noreferrer" class="btn-apply-portal">View on Portal ↗</a>
                <button class="btn-copy-command" onclick="copyApplyCommand(this, '\${escapeHtml(job.url)}')">
                  <span>📋</span>
                  <span>/apply</span>
                </button>
              </div>
            </div>
          \`;
        }).join('');

      } catch (err) {
        countEl.innerText = 'Search failed';
        grid.innerHTML = \`<div class="empty-state" style="grid-column: 1 / -1; color: #ef4444;">Error: \${err.message}</div>\`;
      } finally {
        btn.disabled = false;
        icon.innerText = '🔍';
        text.innerText = 'Search Jobs';
      }
    }

    function copyApplyCommand(btn, url) {
      const cmd = '/apply ' + url;
      navigator.clipboard.writeText(cmd).then(() => {
        const orig = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = '<span>✓</span><span>Copied!</span>';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = orig;
        }, 2000);
      });
    }

    async function loadTracker() {
      try {
        const res = await fetch('/api/tracker');
        const data = await res.json();
        const summary = document.getElementById('trackerSummary');
        const body = document.getElementById('trackerBody');

        summary.innerText = \`\${data.trackedJobs.length} application(s) tracked. \${data.seenCount} historical positions in deduplication index.\`;

        if (data.trackedJobs.length === 0) {
          body.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No tracked applications recorded in job_search_tracker.csv yet.</td></tr>';
          return;
        }

        body.innerHTML = data.trackedJobs.map(j => \`
          <tr>
            <td>\${j.date || '—'}</td>
            <td><strong>\${j.company || '—'}</strong></td>
            <td>\${j.role || '—'}</td>
            <td><span class="status-pill status-\${(j.status || 'applied').toLowerCase()}">\${j.status || 'Applied'}</span></td>
            <td>\${j.fit_rating || '—'}</td>
            <td>\${j.channel || 'Portal'}</td>
          </tr>
        \`).join('');
      } catch (err) {
        console.error(err);
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
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

    // Route: API Live Search
    if (url.pathname === "/api/search") {
      const q = url.searchParams.get("q") || ""
      const location = url.searchParams.get("location") || undefined
      const platforms = (url.searchParams.get("platforms") || "unstop,linkedin,indeed,freehire").split(",")
      const jobage = parseInt(url.searchParams.get("jobage") || "14", 10)

      const results = await executeSearch({
        q,
        location,
        platforms,
        jobage: isNaN(jobage) ? 14 : jobage,
      })

      return new Response(JSON.stringify({ results, count: results.length }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    // Route: API Tracker Data
    if (url.pathname === "/api/tracker") {
      const data = getTrackerData()
      return new Response(JSON.stringify(data), {
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response("Not Found", { status: 404 })
  },
})

console.log(`\n======================================================`)
console.log(`🚀 AI Job Search Interactive Dashboard is live!`)
console.log(`👉 Open: http://localhost:${server.port}`)
console.log(`Press Ctrl+C to stop.`)
console.log(`======================================================\n`)
