## 2024-05-18 - Avoid in-memory aggregation with Drizzle ORM
**Learning:** The codebase previously fetched full tables (like topics, scripts, and videos) and filtered them in memory (e.g. `topics.filter(t => ...).length`), which causes severe performance bottlenecks as tables grow.
**Action:** Offload calculations to the database using Drizzle ORM's native aggregations like `count()`, `sum(case when ... then 1 else 0 end)`, and `.groupBy()`.
