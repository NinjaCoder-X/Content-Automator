## 2024-06-28 - Backend Pagination/Aggregation Anti-pattern
**Learning:** Found a major performance anti-pattern in `stats.ts` where full tables (topics, scripts, videos) were fetched from the database into memory just to calculate counts and grouping (`.filter().length` and loops over arrays). This causes severe N+1 memory issues as the data scales.
**Action:** Always offload counting and grouping to the database layer by using Drizzle ORM's native SQL aggregation functions (`count()`, `groupBy`, and conditional `SUM(CASE WHEN...)`) to only fetch the reduced integer outputs.
