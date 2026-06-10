## 2024-10-24 - Database Filter Pushdown
**Learning:** In Drizzle ORM backends, pulling entire tables into memory and applying JavaScript `.filter()` causes significant memory overhead and data transfer bloat, acting similarly to an N+1 issue for wide tables.
**Action:** Always push query parameters down into the database via `where(and(...conditions))` instead of doing in-memory filtering.
