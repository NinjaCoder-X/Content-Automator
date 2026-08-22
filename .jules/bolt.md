## 2025-02-12 - Database Aggregation Optimization
**Learning:** The `/stats` endpoint was fetching full tables into memory (`db.select().from(topicsTable)`) and using array `.filter().length` for calculations. This is a severe OOM risk and major performance bottleneck on large datasets.
**Action:** Always offload aggregation to the database using `count()`, `sum(case when ...)`, and `groupBy()`. Ensure to wrap conditional sums in `coalesce(..., 0)` to maintain expected integer return types.
