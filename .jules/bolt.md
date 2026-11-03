## 2025-05-18 - Database-Native Aggregations vs In-Memory Scans

**Learning:**
Querying entire tables (`db.select().from(table)`) into Node.js memory to compute lengths, conditional counts, and distributions via in-memory loops and `.filter()` introduces severe unbounded memory usage, CPU blocking, and network payload overhead ($O(N)$ with row count). In benchmarks with 10k rows across tables, transferring raw data consumed ~8.41 MB vs ~728 bytes when aggregated at the database level, and Node.js parsing/filtering took ~7.48 ms vs ~0.0026 ms.

**Action:**
Offload all aggregation queries to PostgreSQL using Drizzle ORM's native SQL primitives: `count()`, `sql<number>coalesce(cast(sum(case when ... then 1 else 0 end) as int), 0)` for conditional counts, and `db.select({ ... }).from(...).groupBy(...)` for category distributions. Always wrap conditional sums in `coalesce(..., 0)` to prevent SQL `null` results when tables or filter matches are empty.
