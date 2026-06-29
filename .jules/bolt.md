## 2024-10-31 - [Offload aggregations to database]
**Learning:** In-memory aggregations via fetching full tables and using `.filter().length` in JavaScript is a massive performance bottleneck as tables grow.
**Action:** Always offload computational aggregations to the database by leveraging Drizzle ORM's native aggregations like `count()`, `groupBy()`, and conditional aggregation (`sql<number>\`coalesce(cast(sum(case when ... then 1 else 0 end) as integer), 0)\``).
