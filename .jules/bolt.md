## 2025-02-18 - [In-memory processing anti-pattern]
**Learning:** Found a recurring anti-pattern where whole database tables are loaded into memory and then `.filter()` is used in JavaScript to apply conditionals or counting/aggregation. This occurs in `stats.ts`, `videos.ts`, `scripts.ts`, `topics.ts`.
**Action:** Always offload filtering and aggregations to the database layer (using `where` with `eq`, `and`, and `count()`, `sql` sum case combinations) in Drizzle ORM to prevent O(n) memory/bandwidth issues on data fetches.
