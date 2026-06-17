## 2024-05-18 - Avoid loading full DB tables into memory
**Learning:** Fetching full tables from the database and applying `.filter()` in JavaScript is a major performance bottleneck, as it consumes unnecessary memory and network bandwidth. Drizzle ORM provides query builder methods that should be utilized.
**Action:** Always push query filters down to the database using `where` clauses (with `eq`, `and`, etc.) instead of filtering in-memory.
