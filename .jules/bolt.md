## 2024-10-30 - [Optimize stats API endpoints with Drizzle ORM]
**Learning:** Fetching full tables for in-memory aggregation is a major performance bottleneck, particularly for the /stats endpoint which touches topics, scripts, and videos. This uses O(n) memory per API call.
**Action:** Use SQL `count()`, conditional `sum()`, and `groupBy()` with `coalesce` wrapping in Drizzle to perform these aggregations efficiently at the DB level.
