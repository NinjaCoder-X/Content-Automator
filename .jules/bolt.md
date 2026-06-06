## 2025-02-14 - Move API filtering to DB
**Learning:** Found API endpoints fetching whole tables from the database and using JS `.filter()` to handle query parameters. This is a common pattern to look out for, especially on routes querying `topicsTable`, `scriptsTable`, and `videosTable`.
**Action:** Always verify if data filtering is happening in memory instead of via SQL. Push filtering down to the database using Drizzle's `where(and(...))` logic to save memory and CPU.
