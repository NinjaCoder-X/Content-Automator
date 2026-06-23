## 2024-06-23 - Offload Aggregations to Database
**Learning:** Fetching full tables into memory and using Javascript `.filter().length` is a major performance anti-pattern, especially as the database grows.
**Action:** Always offload counting and grouping to the database level using Drizzle ORM's native `count()`, `sql` conditional `sum()`, and `groupBy()` functions.
