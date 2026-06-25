
## 2024-06-25 - [Offload list filtering to Database]
**Learning:** Found a major performance anti-pattern across multiple routes (e.g., scripts, topics, videos) where entire tables were being loaded into memory via `db.select().from(table)` and then filtered in JavaScript using `.filter()`. This incurs O(N) memory overhead for large arrays and unnecessary deserialization time for rows that will immediately be discarded.
**Action:** When filtering queries based on request parameters (like status, niche, or platform), always build the query array dynamically and use Drizzle's `.where(and(...filters))` to execute the filtration directly in the database.
