## 2024-05-18 - [Avoid fetching full tables for aggregations]
**Learning:** Using `.filter().length` after fetching entire tables causes out of memory issues for large tables and unnecessarily stresses the database and the network between DB and server.
**Action:** Use native Drizzle ORM queries to delegate computation and aggregations (e.g. `count()`, `sql<number>cast(sum(case when ... then 1 else 0 end) as integer)`, and `groupBy`) to the database. Wrap results in `coalesce(..., 0)` to guarantee numeric values.
