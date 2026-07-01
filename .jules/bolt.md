
## 2024-05-24 - Avoiding In-Memory Array Filtering
**Learning:** This codebase had a pattern of pulling entire database tables (via `db.select().from(...)`) and then applying `.filter()` in JavaScript to narrow the results. This is a severe anti-pattern for performance as it consumes excessive database network bandwidth and Node.js memory.
**Action:** Always inspect `.filter()` usage when Drizzle ORM arrays are returned. Instead, construct dynamic `.where(and(...conditions))` clauses to let the PostgreSQL database engine perform the filtering.
