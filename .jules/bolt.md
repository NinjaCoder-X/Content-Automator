## 2024-06-11 - In-Memory Database Filtering Anti-Pattern
**Learning:** Found an anti-pattern in the codebase where API endpoints were fetching entire database tables (`topics`, `scripts`, `videos`) into memory and using `Array.prototype.filter()` to apply query parameters. This causes unnecessary database load and memory usage as the tables grow.
**Action:** When building or optimizing API endpoints using Drizzle ORM, always construct an array of conditions and push them down to the database using `where()` and `and()` clauses instead of applying `.filter()` in JavaScript.
