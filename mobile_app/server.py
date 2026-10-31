"""AI Job Search & Instant Resume Hub - Mobile Cloud Server.

Runs 24/7 in the cloud (Render, Railway, Fly.io, etc.) without needing a PC.
Provides a mobile-optimized PWA with live search and 1-click tailored PDF downloads.
"""

import os
import re
import sys
import json
import urllib.parse
from datetime import date
from pathlib import Path
from typing import Dict, List, Optional

import requests
import uvicorn
from starlette.applications import Starlette
from starlette.responses import HTMLResponse, JSONResponse, Response, FileResponse
from starlette.routing import Route, Mount
from starlette.staticfiles import StaticFiles

# Setup paths
APP_DIR = Path(__file__).resolve().parent
ROOT_DIR = APP_DIR.parent
OUTPUT_DIR = APP_DIR / "exported_pdfs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Add parent to path for tailor_engine and pdf_generator if available
sys.path.insert(0, str(ROOT_DIR))
try:
    from pdf_engine.tailor_engine import (
        generate_cover_letter_markdown,
        generate_cv_markdown,
    )
    from pdf_engine.pdf_generator import (
        build_resume_pdf,
        build_cover_letter_pdf,
    )
except ImportError:
    # Fallback to local import if deployed standalone
    from tailor_engine import generate_cover_letter_markdown, generate_cv_markdown
    from pdf_generator import build_resume_pdf, build_cover_letter_pdf


# --- JOB SEARCH ENGINES (Pure Python, Zero External CLI Dependency) ---

def search_unstop(query: str, location: str = "") -> List[Dict]:
    """Search Unstop public opportunity API."""
    try:
        url = "https://unstop.com/api/public/opportunity/search-result"
        params = {
            "opportunity": "internships" if "intern" in query.lower() else "jobs",
            "searchTerm": query,
            "page": 1,
            "per_page": 20,
        }
        headers = {"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"}
        resp = requests.get(url, params=params, headers=headers, timeout=8)
        if resp.status_code == 200:
            data = resp.json().get("data", {}).get("data", [])
            results = []
            for item in data:
                org = item.get("organisation", {}) or {}
                results.append({
                    "id": str(item.get("id", "")),
                    "title": item.get("title") or "Opportunity",
                    "company": org.get("name") or "Company",
                    "location": item.get("region") or location or "India",
                    "date": str(item.get("updated_at") or "")[:10],
                    "url": item.get("public_url") or item.get("seo_url") or f"https://unstop.com/o/{item.get('id')}",
                    "snippet": f"Internship/Job at {org.get('name', 'Company')}",
                    "platform": "unstop",
                })
            return results
    except Exception as e:
        print("[Unstop Error]:", e)
    return []


def search_freehire(query: str, location: str = "") -> List[Dict]:
    """Search FreeHire aggregator API."""
    try:
        url = "https://freehire.me/api/v1/jobs"
        params = {"q": query, "limit": 20}
        headers = {"User-Agent": "Mozilla/5.0 (Mobile; AIJobSearch/1.0)"}
        resp = requests.get(url, params=params, headers=headers, timeout=8)
        if resp.status_code == 200:
            data = resp.json().get("data", [])
            results = []
            for item in data:
                results.append({
                    "id": str(item.get("id", "")),
                    "title": item.get("title") or "Position",
                    "company": item.get("company") or "Tech Company",
                    "location": item.get("location") or "Remote",
                    "date": str(item.get("created_at") or "")[:10],
                    "url": item.get("url") or item.get("apply_url") or "https://freehire.me",
                    "snippet": item.get("summary") or item.get("title"),
                    "platform": "freehire",
                })
            return results
    except Exception as e:
        print("[FreeHire Error]:", e)
    return []


def load_cached_jobs(query: str) -> List[Dict]:
    """Loads bundled verified listings from collected_jobs.json."""
    for p in [ROOT_DIR / "collected_jobs.json", APP_DIR / "collected_jobs.json"]:
        if p.exists():
            try:
                cached = json.loads(p.read_text(encoding="utf-8"))
                q_terms = query.lower().split()
                matches = []
                for j in cached:
                    text = f"{j.get('title', '')} {j.get('company', '')}".lower()
                    if not q_terms or any(t in text for t in q_terms):
                        matches.append({
                            "id": str(j.get("id", "")),
                            "title": j.get("title", ""),
                            "company": j.get("company", ""),
                            "location": j.get("location", "Bengaluru, India"),
                            "date": j.get("date", ""),
                            "url": j.get("url", ""),
                            "snippet": j.get("title", ""),
                            "platform": (j.get("source_portal") or "linkedin").replace("-search", ""),
                        })
                return matches
            except Exception:
                pass
    return []


# --- PDF GENERATOR API ---

def generate_mobile_pdf(company: str, role: str, snippet: str = "", location: str = "Bengaluru, India") -> Dict[str, str]:
    clean_company = re.sub(r"[^\w\-_]", "", company.replace(" ", "_")) or "Company"
    clean_role = re.sub(r"[^\w\-_]", "", (role or "Intern").replace(" ", "_").replace("/", "_"))

    resume_name = f"Resume_VinayKumar_{clean_company}.pdf"
    cover_name = f"CoverLetter_VinayKumar_{clean_company}.pdf"

    resume_path = OUTPUT_DIR / resume_name
    cover_path = OUTPUT_DIR / cover_name

    # Generate tailored markdown
    cv_md = generate_cv_markdown(company, role, snippet)
    cover_md = generate_cover_letter_markdown(company, role, snippet, location)

    # Compile to PDF
    build_resume_pdf(cv_md, resume_path)
    build_cover_letter_pdf(cover_md, cover_path)

    return {
        "resume_file": resume_name,
        "cover_file": cover_name,
    }


# --- MOBILE-FIRST PWA TEMPLATE ---

HTML_MOBILE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Vinay Kumar S | AI Job Hub</title>
  <meta name="theme-color" content="#090d16">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="AI Job Hub">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card: #111827;
      --border: #1f293d;
      --accent: #3b82f6;
      --success: #10b981;
      --text: #f9fafb;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      padding: env(safe-area-inset-top, 16px) 16px 80px;
      max-width: 600px;
      margin: 0 auto;
    }
    header {
      padding: 16px 0 20px;
      text-align: center;
    }
    .brand {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #60a5fa, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subhead {
      font-size: 13px;
      color: var(--muted);
      margin-top: 4px;
    }
    .search-box {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .input-field {
      width: 100%;
      background: #05070d;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 14px;
      color: #fff;
      font-size: 16px;
      outline: none;
      margin-bottom: 12px;
    }
    .input-field:focus { border-color: var(--accent); }
    .btn-search {
      width: 100%;
      background: var(--accent);
      color: #fff;
      border: none;
      border-radius: 12px;
      padding: 14px;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-search:active { transform: scale(0.98); }
    .job-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 18px;
      margin-bottom: 16px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .job-title {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      line-height: 1.3;
    }
    .company {
      font-size: 14px;
      color: #38bdf8;
      font-weight: 600;
      margin-top: 4px;
    }
    .meta {
      font-size: 12px;
      color: var(--muted);
      margin: 8px 0 16px;
      display: flex;
      gap: 12px;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .btn-portal {
      background: #1e293b;
      color: #fff;
      text-decoration: none;
      text-align: center;
      padding: 12px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      display: block;
    }
    .btn-pdf {
      background: var(--success);
      color: #fff;
      border: none;
      border-radius: 10px;
      padding: 12px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .btn-pdf:active { transform: scale(0.98); }
    .btn-cover {
      background: #334155;
      color: #e2e8f0;
      border: none;
      border-radius: 10px;
      padding: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .toast {
      position: fixed;
      bottom: 24px;
      left: 16px;
      right: 16px;
      background: var(--success);
      color: #fff;
      padding: 14px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      text-align: center;
      display: none;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 1000;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">AI Job Hub • Mobile</div>
    <div class="subhead">Vinay Kumar S | Instant Tailored PDFs</div>
  </header>

  <div class="search-box">
    <input type="text" id="query" class="input-field" value="AI ML" placeholder="Target role (e.g. AI ML, Python)">
    <button class="btn-search" onclick="searchJobs()">🔍 Search Positions</button>
  </div>

  <div id="resultsCount" style="font-size: 13px; color: var(--muted); margin-bottom: 12px; font-weight: 600;">Showing live positions...</div>
  <div id="jobsList"></div>

  <div id="toast" class="toast">Generating PDF...</div>

  <script>
    async function searchJobs() {
      const q = document.getElementById('query').value.trim();
      const list = document.getElementById('jobsList');
      const countEl = document.getElementById('resultsCount');
      countEl.innerText = 'Searching across portals...';
      list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">Fetching live listings...</div>';

      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(q));
        const data = await res.json();
        const results = data.results || [];
        countEl.innerText = results.length + ' positions found';

        if (results.length === 0) {
          list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--muted);">No jobs found. Try different keywords.</div>';
          return;
        }

        list.innerHTML = results.map(j => `
          <div class="job-card">
            <div class="job-title">${escapeHtml(j.title)}</div>
            <div class="company">🏢 ${escapeHtml(j.company || 'Tech Company')}</div>
            <div class="meta">
              <span>📍 ${escapeHtml(j.location || 'Bengaluru')}</span>
              ${j.date ? `<span>📅 ${j.date}</span>` : ''}
            </div>
            <div class="actions">
              <a href="${j.url}" target="_blank" rel="noopener noreferrer" class="btn-portal">1. Apply on Portal ↗</a>
              <button class="btn-pdf" onclick="getResume('${escapeAttr(j.company)}', '${escapeAttr(j.title)}')">
                <span>📄</span> 2. Download Tailored Resume
              </button>
              <button class="btn-cover" onclick="getCover('${escapeAttr(j.company)}', '${escapeAttr(j.title)}')">
                <span>✉</span> Download Cover Letter
              </button>
            </div>
          </div>
        `).join('');
      } catch (err) {
        countEl.innerText = 'Search failed';
        list.innerHTML = '<div style="color: #ef4444; text-align: center;">Error fetching jobs.</div>';
      }
    }

    async function getResume(company, role) {
      showToast('Generating customized Resume for ' + company + '...');
      try {
        const res = await fetch('/api/export-pdf?company=' + encodeURIComponent(company) + '&role=' + encodeURIComponent(role));
        const data = await res.json();
        if (data.resume_file) {
          showToast('Downloaded: ' + data.resume_file);
          window.location.href = '/exported_pdfs/' + data.resume_file;
        }
      } catch (e) {
        alert('Generation failed: ' + e.message);
      }
    }

    async function getCover(company, role) {
      showToast('Generating Cover Letter for ' + company + '...');
      try {
        const res = await fetch('/api/export-pdf?company=' + encodeURIComponent(company) + '&role=' + encodeURIComponent(role));
        const data = await res.json();
        if (data.cover_file) {
          showToast('Downloaded: ' + data.cover_file);
          window.location.href = '/exported_pdfs/' + data.cover_file;
        }
      } catch (e) {
        alert('Generation failed: ' + e.message);
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

    window.addEventListener('DOMContentLoaded', searchJobs);
  </script>
</body>
</html>
"""


# --- ROUTE HANDLERS ---

async def homepage(request):
    return HTMLResponse(HTML_MOBILE)


async def api_search(request):
    q = request.query_params.get("q", "AI ML")
    loc = request.query_params.get("location", "Bengaluru")

    # Combine live search from Unstop, FreeHire, and cached listings
    unstop_jobs = search_unstop(q, loc)
    freehire_jobs = search_freehire(q, loc)
    cached_jobs = load_cached_jobs(q)

    seen_urls = set()
    combined = []

    for j in (unstop_jobs + freehire_jobs + cached_jobs):
        u = j.get("url")
        if u and u not in seen_urls:
            seen_urls.add(u)
            combined.append(j)

    combined.sort(key=lambda x: x.get("date") or "", reverse=True)
    return JSONResponse({"results": combined})


async def api_export_pdf(request):
    company = request.query_params.get("company", "Company")
    role = request.query_params.get("role", "Intern")
    snippet = request.query_params.get("snippet", "")
    loc = request.query_params.get("location", "Bengaluru, India")

    try:
        res = generate_mobile_pdf(company, role, snippet, loc)
        return JSONResponse(res)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)


async def serve_pdf(request):
    filename = request.path_params.get("filename", "")
    target = OUTPUT_DIR / filename
    if target.exists():
        return FileResponse(
            str(target),
            media_type="application/pdf",
            filename=filename,
        )
    return Response("Not Found", status_code=404)


routes = [
    Route("/", homepage),
    Route("/api/search", api_search),
    Route("/api/export-pdf", api_export_pdf),
    Route("/exported_pdfs/{filename}", serve_pdf),
]

app = Starlette(debug=False, routes=routes)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    print("======================================================")
    print(f"[*] AI Job Hub Mobile Cloud Server running on port {port}")
    print("======================================================")
    uvicorn.run(app, host="0.0.0.0", port=port)
