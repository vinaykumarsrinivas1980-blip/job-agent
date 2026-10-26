# Search Queries for Job Scraper

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`.

### Primary CLI Queries:
- **LinkedIn Search (Bengaluru & Remote):**
  - `bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "AI ML Intern" -l "Bengaluru, Karnataka, India" --jobage 14 --format table`
  - `bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Python Developer Intern" -l "Bengaluru, Karnataka, India" --jobage 14 --format table`
  - `bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "DevOps Intern" -l "Bengaluru, Karnataka, India" --jobage 14 --format table`
  - `bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Machine Learning Engineer" -l "Remote" --remote remote --jobage 14 --format table`
  - `bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Python Developer" -l "Remote" --remote remote --jobage 14 --format table`

- **Freehire Search (Tech & Remote):**
  - `bun run .agents/skills/freehire-search/cli/src/cli.ts search -q "python" --category backend --remote remote --limit 10 --format table`
  - `bun run .agents/skills/freehire-search/cli/src/cli.ts search -q "machine learning" --remote remote --limit 10 --format table`
  - `bun run .agents/skills/freehire-search/cli/src/cli.ts search -q "devops" --remote remote --limit 10 --format table`

- **Unstop Search (Internships & Early Career Tech):**
  - `bun run .agents/skills/unstop-search/cli/src/cli.ts search -q "AI ML Intern" -l "Bengaluru" --format table`
  - `bun run .agents/skills/unstop-search/cli/src/cli.ts search -q "Python Developer Intern" -l "Bengaluru" --format table`
  - `bun run .agents/skills/unstop-search/cli/src/cli.ts search -q "Machine Learning" --opportunity internships --format table`

- **Indeed Search (India & Global):**
  - `bun run .agents/skills/indeed-search/cli/src/cli.ts search -q "AI ML Intern" -l "Bengaluru" --format table`
  - `bun run .agents/skills/indeed-search/cli/src/cli.ts search -q "Python Developer" -l "Bengaluru" --jobage 14 --format table`

---

## WebSearch & `site:` Fallback Queries

### Target Location Scope
- **Ideal:** Bengaluru, Karnataka, India (Onsite, Hybrid, or Metro Commute)
- **Acceptable:** Remote (India-wide or Global)
- **Borderline:** Other Indian metros (Hyderabad, Pune, Chennai) if hybrid/flexible
- **Too Far:** Full on-site relocation outside Bengaluru without relocation assistance

---

## Query Categories

### Priority 1: AI / Machine Learning Engineering & Internships
These match your primary degree focus, Ollama/LLM robotics, and Scikit-learn projects.

```
site:linkedin.com/jobs "AI Intern" "Bengaluru"
site:linkedin.com/jobs "Machine Learning Intern" "Bengaluru"
site:wellfound.com/jobs "AI" OR "Machine Learning" "Bengaluru" OR "Remote"
site:unstop.com/jobs "Machine Learning"
site:in.indeed.com/jobs "Machine Learning Intern" "Bengaluru"
site:naukri.com "AI ML Intern" "Bangalore"
site:internshala.com "Machine Learning Intern" "Bangalore"
```

### Priority 2: Python Software Engineering & Automation
These match your core programming language, algorithms, REST APIs, and Raspberry Pi automation work.

```
site:linkedin.com/jobs "Python Developer Intern" "Bengaluru"
site:wellfound.com/jobs "Python" "Remote"
site:in.indeed.com/jobs "Python Developer Intern" "Bengaluru"
site:naukri.com "Python Intern" "Bangalore"
```

### Priority 3: DevOps & Cloud Infrastructure Internships
These match your hands-on Linux, Docker containerization, Jenkins CI/CD, and Git labs.

```
site:linkedin.com/jobs "DevOps Intern" "Bengaluru"
site:linkedin.com/jobs "Cloud Intern" "Docker" "Bengaluru" OR "Remote"
site:linkedin.com/jobs "Site Reliability Intern" "Linux" "Bengaluru"
site:naukri.com "DevOps Trainee" "Bangalore"
```

### Priority 4: Data Science & AI Research
These match your Cisco Data Science certification and Smart India Hackathon prototyping.

```
site:linkedin.com/jobs "Data Science Intern" "Python" "Bengaluru"
site:linkedin.com/jobs "AI Research Intern" "Bengaluru" OR "Remote"
```
