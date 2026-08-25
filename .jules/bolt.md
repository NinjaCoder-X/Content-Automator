
## 2026-08-25 - [Drizzle ORM Conditional Aggregations Edge Case]
**Learning:** When offloading computations to the database in Drizzle ORM, using conditional aggregations like `sql<number>\`cast(sum(case when ...)) \`` will return `null` if no rows match the criteria, rather than 0. This can cause type mismatches when integer counts are expected.
**Action:** Always wrap conditional `sum()` or similar aggregations in `coalesce(..., 0)` to guarantee a number is returned even on empty result sets.
