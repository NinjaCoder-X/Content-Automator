import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "app.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  _db = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      plan_renews_at INTEGER,
      stripe_customer_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      niche TEXT NOT NULL,
      platform TEXT NOT NULL,
      topic TEXT NOT NULL,
      hook TEXT NOT NULL,
      script TEXT NOT NULL,
      loop_ending TEXT NOT NULL,
      breakdown TEXT NOT NULL,        -- JSON array of scenes
      caption TEXT NOT NULL,
      hashtags TEXT NOT NULL,         -- JSON array
      score INTEGER NOT NULL DEFAULT 0,
      score_breakdown TEXT NOT NULL,  -- JSON object
      watermarked INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS generations_user_idx
      ON generations(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS planner_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      day_offset INTEGER NOT NULL,
      niche TEXT NOT NULL,
      platform TEXT NOT NULL,
      hook TEXT NOT NULL,
      angle TEXT NOT NULL,
      cta TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS planner_user_idx
      ON planner_items(user_id, day_offset);

    CREATE TABLE IF NOT EXISTS usage_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,            -- 'generate' | 'planner' | 'export'
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS usage_user_idx
      ON usage_events(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
  `);
}

export type UserRow = {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  plan: string;
  plan_renews_at: number | null;
  stripe_customer_id: string | null;
  created_at: number;
  updated_at: number;
};

export type GenerationRow = {
  id: number;
  user_id: number;
  niche: string;
  platform: string;
  topic: string;
  hook: string;
  script: string;
  loop_ending: string;
  breakdown: string;
  caption: string;
  hashtags: string;
  score: number;
  score_breakdown: string;
  watermarked: number;
  created_at: number;
};

export type PlannerRow = {
  id: number;
  user_id: number;
  day_offset: number;
  niche: string;
  platform: string;
  hook: string;
  angle: string;
  cta: string;
  done: number;
  created_at: number;
};

export type UsageRow = {
  id: number;
  user_id: number;
  kind: string;
  metadata: string;
  created_at: number;
};
