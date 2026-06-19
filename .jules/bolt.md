## 2024-05-24 - Database Query Optimization
**Learning:** The backend was fetching full tables into memory and applying javascript `.filter()` for list endpoints, which scales poorly (O(n) memory and processing) as data grows. Drizzle ORM supports pushing these filters down to the database using `where` and `and`/`eq`.
**Action:** Always push query filters down to the database level using SQL WHERE clauses instead of filtering in-memory.
