## 2025-05-18 - Bulk Insert vs N+1 Inserts in Drizzle ORM

**Learning:** Mapping multiple records to individual `db.insert().values().returning()` calls within `Promise.all` issues N separate SQL statements across database round trips. Passing an array of row objects directly to `db.insert().values([...])` produces a single multi-row `INSERT ... VALUES (...), (...) RETURNING ...` statement. However, calling `values([])` with an empty array in Drizzle ORM throws a SQL syntax error in PostgreSQL.

**Action:** Always batch multi-row inserts into a single `db.insert().values(rows)` query and guard against empty arrays by checking `rows.length === 0` prior to query execution.
