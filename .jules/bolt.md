## 2024-06-30 - Database-Level Aggregation

**Learning:** The application codebase exhibited a significant performance anti-pattern by fetching entire tables into memory via Drizzle ORM and then using JavaScript `.filter().length` or object iteration to compute counts, conditional aggregates, and groupings. This pattern scales extremely poorly, causing severe memory bloat and slow execution times as database tables grow.

**Action:** Whenever possible, use Drizzle ORM's SQL primitives (`count()`, `sql`, `.groupBy()`) to offload aggregate computations (e.g. counting total rows, computing grouped statistics, or conditional sums) directly to PostgreSQL. This drastically reduces the data transferred over the network and minimizes Node.js memory consumption.
