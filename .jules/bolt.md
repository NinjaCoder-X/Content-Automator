## 2025-03-05 - [API Filtering Anti-Pattern]
**Learning:** Returning all rows from Drizzle and filtering in-memory using JS `.filter()` scales poorly and bounds app performance by memory size, leading to high latency and crashes for large data sets.
**Action:** Always map filter query parameters to Drizzle `where()` clauses utilizing SQL capabilities to only pull required rows into memory.
