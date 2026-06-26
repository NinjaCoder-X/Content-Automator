## 2025-06-26 - Avoid In-Memory Filtering and Aggregations with Promise.all
**Learning:** Fetching full tables into memory via `db.select().from(table)` to perform aggregations using `.length` or `.filter(..).length` is a severe performance bottleneck and N+1 memory problem. It requires instantiating complete tables as JS arrays which explodes memory.
**Action:** Always offload computations directly to the database using Drizzle ORM's native SQL aggregation functions such as `count()`, `sql` conditional `SUM(CASE WHEN...)`, and `.groupBy()`.
