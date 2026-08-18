## 2024-05-24 - Database Aggregation Anti-Pattern
**Learning:** The codebase has a performance anti-pattern of fetching full tables into memory to perform aggregations using `.filter().length`, which consumes significant backend memory and slows down requests for large datasets.
**Action:** Always offload computation to the database using Drizzle ORM's native SQL aggregation functions (`count()`, conditional `SUM(CASE WHEN...)`, and `.groupBy()`). Ensure conditional aggregations are wrapped in `coalesce(..., 0)` to return integers instead of null.
