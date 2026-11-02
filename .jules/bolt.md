## 2024-05-20 - In-memory Table Aggregation Anti-pattern
**Learning:** Found a performance bottleneck where full tables were being fetched for in-memory aggregations using `.filter().length`.
**Action:** Always offload computation to the database using Drizzle ORM's native SQL aggregation functions (`count()`, conditional `SUM(CASE WHEN...)`, and `.groupBy()`).
