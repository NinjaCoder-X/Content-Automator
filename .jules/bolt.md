## 2024-06-11 - Database Aggregations

**Learning:** Fetching full tables for in-memory aggregation (e.g. `db.select().from(table)` followed by `.filter().length`) is a major performance anti-pattern. Drizzle ORM returns `null` for conditional aggregations if no rows match unless `coalesce` is used.

**Action:** Always offload computation to the database using Drizzle ORM's native SQL aggregation functions (`count()`, conditional `sum(case when...)`, and `.groupBy()`). When using conditional aggregations in Drizzle, always wrap the result in `coalesce(..., 0)` to prevent returning `null` when no rows match, ensuring accurate type matching for expected integer counts.
