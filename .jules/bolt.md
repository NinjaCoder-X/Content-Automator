## 2025-06-13 - [Push list filters to database]
**Learning:** Found an anti-pattern in the codebase where entire tables (scripts, topics, videos) were fetched from the database and then filtered in-memory using JavaScript's `.filter()`. This is a severe performance and memory bottleneck for large datasets and undermines the purpose of using a database.
**Action:** Push query filters down to the database using Drizzle ORM's `where` clauses with `eq` and `and`. Always evaluate if filtering can be done at the database level rather than in-memory.
