## 2024-03-24 - Database Query Filtering Anti-Pattern
**Learning:** Found multiple instances where entire database tables (scripts, topics, videos) were being fetched into memory and then filtered using JavaScript's `.filter()` array method. This approach wastes database bandwidth and consumes excessive Node.js memory.
**Action:** Push query filters down to the database using Drizzle ORM's `where` and `and` clauses to significantly improve route performance and scalability.
