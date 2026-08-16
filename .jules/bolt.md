## 2026-08-16 - Fetching full tables for in-memory aggregation
**Learning:** A known performance anti-pattern in the codebase is fetching full tables for in-memory aggregation (e.g., using `.filter().length`).
**Action:** Always offload computation to the database using Drizzle ORM's native SQL aggregation functions (`count()`, conditional `SUM(CASE WHEN...)`, and `.groupBy()`).
