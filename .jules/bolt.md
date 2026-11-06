## 2025-03-08 - [Drizzle ORM Aggregations vs Full Table Fetch]
**Learning:** Fetching full tables to perform in-memory aggregation operations (e.g. `.filter().length`) is a major performance bottleneck for routes expecting fast analytical queries (like `/stats`) and should be avoided in this architecture.
**Action:** Always offload computational aggregations to the database utilizing Drizzle ORM native features (`count()`, conditional `sum()` within `sql` templates, and `.groupBy()`). Wrap conditional aggregates with `coalesce` to prevent `null` responses when zero rows match.

## 2026-11-06 - [Push Query Filters to Database]
**Learning:** Selecting entire database tables into Node.js memory and using JavaScript `Array.prototype.filter()` is an anti-pattern that wastes database network bandwidth and Node.js heap memory, degrading performance as tables grow.
**Action:** Push query parameters directly into Drizzle ORM `.where(conditions.length > 0 ? and(...conditions) : undefined)` clauses using `eq` so that PostgreSQL performs index-assisted filtering and transmits only relevant records.
