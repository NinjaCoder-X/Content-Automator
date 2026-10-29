## 2023-10-28 - In-memory array filtering vs Database queries
**Learning:** The application is loading full tables into memory and applying JS aggregations and filtering (`.filter().length`, loops). This can lead to significant memory use and slow API responses when tables grow large, a known performance anti-pattern.
**Action:** Push query filters down to the database using Drizzle ORM's native SQL aggregation functions (`count()`, conditional `SUM(CASE WHEN...)`, and `.groupBy()`). Offloading computation to DB avoids N+1 problems and bloated process memory.
