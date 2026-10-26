# Unstop URL Reference

## Endpoints

### 1. Opportunity Search API
- **Endpoint:** `GET https://unstop.com/api/public/opportunity/search-result`
- **Auth:** None (Public)
- **Parameters:**
  - `opportunity`: `jobs` | `internships`
  - `searchTerm`: Query keyword (e.g. `python`, `machine learning`)
  - `page`: Page number (1-indexed)
  - `per_page`: Number of results per page (max recommended: 50)
- **Response Format:**
  ```json
  {
    "data": {
      "total": 612,
      "current_page": 1,
      "data": [
        {
          "id": 1770195,
          "title": "Machine Learning Internship",
          "public_url": "internships/...",
          "seo_url": "https://unstop.com/internships/...",
          "updated_at": "2026-10-14T...",
          "end_date": "2026-10-28T...",
          "region": "online",
          "details": "<p>HTML Description</p>",
          "organisation": { "name": "Zenotalent" },
          "jobDetail": { "locations": ["Bengaluru"], "timing": "full_time" }
        }
      ]
    }
  }
  ```

### 2. Posting Details
- Search endpoint with `searchTerm=<id>` returns full HTML details in the `details` field.
