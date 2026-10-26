# Indeed URL Reference

## Endpoints

### 1. Job Search
- **URL:** `https://in.indeed.com/jobs` (or `https://www.indeed.com/jobs`)
- **Method:** GET
- **Parameters:**
  - `q`: Search keywords (e.g. `python developer`)
  - `l`: Location (e.g. `Bengaluru, Karnataka`)
  - `fromage`: Posting age in days (e.g. `14`)
  - `start`: Pagination offset (`(page - 1) * 10`)

### 2. Job Detail
- **URL:** `https://in.indeed.com/viewjob?jk=<jobkey>`
- **Method:** GET
- **Note:** Viewjob endpoints often require browser cookies or session context.
