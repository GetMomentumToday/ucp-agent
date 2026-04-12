import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

let cachedDb: BetterSQLite3Database<typeof schema> | undefined;

function getDbPath(): string {
  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'ucp-agent.db');
}

function migrate(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS threads (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'regular',
      title TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_threads_user_id ON threads(user_id);

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      thread_id TEXT NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      parent_id TEXT,
      format TEXT NOT NULL DEFAULT 'ai-sdk/v6',
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

    CREATE TABLE IF NOT EXISTS sessions (
      thread_id TEXT PRIMARY KEY REFERENCES threads(id) ON DELETE CASCADE,
      checkout_session_id TEXT,
      cart_id TEXT,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (cachedDb) return cachedDb;

  const sqlite = new Database(getDbPath());
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  migrate(sqlite);

  cachedDb = drizzle(sqlite, { schema });
  return cachedDb;
}

export function createTestDb(): BetterSQLite3Database<typeof schema> {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  migrate(sqlite);
  return drizzle(sqlite, { schema });
}
