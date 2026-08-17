## 2024-05-24 - [Drizzle ORM Conditional Aggregation]
**Learning:** When using Drizzle ORM for conditional aggregations (e.g., `sql<number>cast(sum(case when ...))`), always wrap the result in `coalesce(..., 0)` to prevent returning `null` when no rows match, ensuring accurate type matching for expected integer counts.
**Action:** Use `coalesce` defensively in all `sql` raw aggregations.

## 2024-05-24 - [Avoid In-Memory Filtering on Large Datasets]
**Learning:** A known performance anti-pattern in the codebase is fetching full tables for in-memory aggregation (e.g., using `.filter().length`).
**Action:** Always offload computation to the database using Drizzle ORM's native SQL aggregation functions (`count()`, conditional `SUM(CASE WHEN...)`, and `.groupBy()`).
