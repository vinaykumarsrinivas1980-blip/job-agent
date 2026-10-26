---
name: indeed-search
version: 1.0.0
description: >
  Search jobs on Indeed (in.indeed.com for India, www.indeed.com globally) via public
  listings. Fallback site queries are also available in search-queries.md when Indeed's
  anti-bot security check is active. Trigger phrases: indeed, indeed jobs, search indeed,
  jobs on indeed, indeed vacancies.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/indeed-search/cli/src/cli.ts *)
---

# Indeed Search Skill

Search live job listings from **[Indeed](https://in.indeed.com)** (India and Global).

Uses system curl with browser headers to query Indeed's public job search pages.

> ⚠️ **Personal use only:** Automated queries are sensitive to volume on Indeed. If Cloudflare security checks trigger, use the `site:in.indeed.com/jobs` fallback queries in `search-queries.md`.

## Commands

### Search listings

```bash
bun run .agents/skills/indeed-search/cli/src/cli.ts search [flags]
```

#### Flags
- `--query, -q <text>` — Keywords (role, title, or skills).
- `--location, -l <text>` — Location (e.g. `Bengaluru`, `Remote`).
- `--jobage <days>` — Posted within N days (e.g. 7, 14, 30).
- `--page <n>` — 1-indexed page number (default: 1).
- `--limit, -n <n>` — Result cap (default: 15).
- `--domain <domain>` — `in.indeed.com` (default for India) or `www.indeed.com`.
- `--format json|table|plain` — default `json`.

### View Posting Details

```bash
bun run .agents/skills/indeed-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

## Examples

```bash
bun run .agents/skills/indeed-search/cli/src/cli.ts search -q "machine learning intern" -l "Bengaluru" --format table
bun run .agents/skills/indeed-search/cli/src/cli.ts search -q "python developer" -l "Remote" --jobage 14 --format json
bun run .agents/skills/indeed-search/cli/src/cli.ts detail 21a839df0d862d1d --format plain
```
