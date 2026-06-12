## 2024-06-12 - Drizzle ORM Memory Issues
**Learning:** Selecting entire tables (`db.select().from(table)`) and applying `.filter()` in Node.js memory instead of pushing logic to the database using `where()` leads to performance issues (O(N) data transfer and excessive memory usage).
**Action:** Always use `.where()` queries in Drizzle for filtering instead of loading all rows into memory and filtering with JavaScript.
