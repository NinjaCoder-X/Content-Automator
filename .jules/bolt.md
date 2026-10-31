
## 2023-11-01 - Offloading Table Stats to Database Aggregation
**Learning:** Codebase occasionally fetches full database tables (`.select().from(table)`) into memory and performs filtering using JavaScript `array.filter(..).length`. This is a severe O(N) performance bottleneck when tables grow large, unnecessarily wasting app memory.
**Action:** When computing counts or conditional counts (like `status = 'approved'`), always use Drizzle ORM's native SQL aggregations such as `count()`, `.groupBy()`, or conditional sums via `sql<number>\`coalesce(cast(sum(case when ... then 1 else 0 end) as int), 0)\``. Using `coalesce` is crucial to guarantee exact type preservation matching `number` for counts when 0 rows match.
