---
name: unstop-search
version: 1.0.0
description: >
  Search live job and internship listings across tech, software, data science, AI/ML,
  and engineering on Unstop (unstop.com) via their public search API. Especially strong
  for internships, early-career tech roles, hackathons, and fresher positions in India
  and remote. Trigger phrases: unstop, unstop jobs, unstop internships, find internships,
  tech internships india, college internships, fresher jobs india, machine learning intern,
  python intern unstop.
context: fork
enabled: true
allowed-tools: Bash(bun run .agents/skills/unstop-search/cli/src/cli.ts *)
---

# Unstop Search Skill

Search live job and internship listings from **[Unstop](https://unstop.com)** (formerly Dare2Compete) — India's premier platform for college students, graduates, and early-career tech talent.

Queries Unstop's public REST API. No authentication or API keys required, zero runtime dependencies — runs with plain `bun`.

## Scope

- **High-signal early-career tech:** Internships, graduate engineer roles, fresher software developers, data science and AI/ML positions.
- **Geographic focus:** India (Bengaluru, Hyderabad, Pune, Delhi-NCR, Mumbai, Chennai) plus Remote/Online listings.

## Commands

### Search listings

```bash
bun run .agents/skills/unstop-search/cli/src/cli.ts search [flags]
```

#### Flags
- `--query, -q <text>` — keywords (role title, skills, technologies).
- `--location, -l <text>` — filter by city (e.g. `Bengaluru`) or `Remote`.
- `--opportunity <type>` — `jobs` | `internships` | `all`. (Auto-inferred: if query contains "intern", defaults to `internships`, otherwise `jobs`).
- `--jobage <days>` — filter postings updated within N days.
- `--page <n>` — 1-indexed page number (default: 1).
- `--limit, -n <n>` — result count cap (default: 20).
- `--format json|table|plain` — default `json`.

### View Posting Details

```bash
bun run .agents/skills/unstop-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

## Examples

```bash
bun run .agents/skills/unstop-search/cli/src/cli.ts search -q "machine learning intern" -l "Bengaluru" --format table
bun run .agents/skills/unstop-search/cli/src/cli.ts search -q "python developer" --jobage 14 --format json
bun run .agents/skills/unstop-search/cli/src/cli.ts detail 1770195 --format plain
```
