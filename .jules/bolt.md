## 2024-06-16 - [Push Query Filters to Database]
**Learning:** Found instances where large data tables were selected entirely from the database and filtered in-memory using JavaScript `.filter()`. This is an N+1/full-table-scan performance anti-pattern.
**Action:** Push filters down to the database using Drizzle ORM's `where`, `and`, and `eq` operators to drastically reduce data transfer payload sizes and API latency.
