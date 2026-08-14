## 2025-02-18 - [In-memory array .filter().length performance anti-pattern]
**Learning:** The codebase has a performance anti-pattern of fetching full database tables into application memory just to calculate lengths and statistics (e.g. `.filter().length` in `stats.ts`).
**Action:** Always offload computational queries and counts to the database using Drizzle ORM native database aggregations (`count()`, `sql` combined with `SUM(CASE WHEN...)`, and `.groupBy()`). Wrap `sum` calls in `coalesce` to default missing statistics to `0`.
