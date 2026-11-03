## 2025-03-08 - [Drizzle ORM Aggregations vs Full Table Fetch]
**Learning:** Fetching full tables to perform in-memory aggregation operations (e.g. `.filter().length`) is a major performance bottleneck for routes expecting fast analytical queries (like `/stats`) and should be avoided in this architecture.
**Action:** Always offload computational aggregations to the database utilizing Drizzle ORM native features (`count()`, conditional `sum()` within `sql` templates, and `.groupBy()`). Wrap conditional aggregates with `coalesce` to prevent `null` responses when zero rows match.
