## 2026-07-07 - Database Fetch Anti-Pattern: Over-fetching and In-memory Processing
**Learning:** In Drizzle ORM backends, it's a common performance anti-pattern to select all rows (`db.select().from(table)`) and then use JS/Node arrays to filter (`.filter()`), reduce, or determine counts (`.length`). This causes massive memory overhead and data-transfer lag for large tables.
**Action:** Always push queries down to the database using Drizzle's `where()` combined with `and()`, `eq()`, `count()`, conditional `sql` aggregations (e.g. `sum(case when ...)`), and `.groupBy()`.
