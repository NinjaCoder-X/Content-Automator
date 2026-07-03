## 2023-10-25 - [Drizzle In-Memory Aggregation Anti-Pattern]
**Learning:** Fetching full tables to perform `.filter().length` in memory is a critical anti-pattern that crashes the server due to O(N) memory usage as tables grow.
**Action:** Always offload counts to the database using `count()`, `.groupBy()`, and conditional aggregations like `sql<number>\`coalesce(cast(sum(case when ... then 1 else 0 end) as integer), 0)\`` to maintain O(1) memory footprint.

## 2023-10-25 - [Drizzle In-Memory Filter Anti-Pattern]
**Learning:** Fetching full tables and using `.filter()` for querying is inefficient and wastes database/network resources.
**Action:** Always push query filters down to the database using `where` clauses with `eq`, `and`, etc.
