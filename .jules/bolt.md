## 2024-05-30 - Database aggregation over memory aggregation
**Learning:** Found a major bottleneck in the `api-server`'s `/stats` endpoint where the entire table of topics, scripts, and videos were loaded into application memory to perform counts and aggregations using JavaScript loops and `.filter()`. This is an N+1 equivalent and an anti-pattern.
**Action:** Use Drizzle ORM's database aggregation functions like `count()` and `groupBy()` directly in queries to offload computation to the database and reduce memory usage.
