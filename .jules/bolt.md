## YYYY-MM-DD - [Title]
**Learning:** [Insight]
**Action:** [How to apply next time]
## 2024-05-18 - [In-memory Table Aggregation Bottleneck]
**Learning:** Fetching full tables and aggregating data in-memory for statistics (e.g., using `.filter().length` in JavaScript) introduces severe memory and CPU bottlenecks as the dataset grows.
**Action:** Refactor backend endpoints to use Drizzle ORM's native SQL aggregation functions (`count()`, `.groupBy()`) to offload computation to the database and retrieve only necessary scalar values.
