## 2024-06-18 - Database query filter optimization
**Learning:** Found an anti-pattern in the API layer where entire database tables were fetched into memory to apply `.filter()` on the results for query parameters.
**Action:** Always push query filters down to the database using Drizzle's `where` and `and` clauses to minimize memory usage, reduce latency, and avoid OOM risks for large datasets.
