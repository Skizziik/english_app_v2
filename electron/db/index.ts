import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { dbPath, resourcesDir } from '../lib/paths';
import * as schema from './schema';
import { runMigrations } from './migrate';
import { seedIfEmpty } from './seed';

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _sqlite: Database.Database | null = null;

export function db(): BetterSQLite3Database<typeof schema> {
  if (!_db) throw new Error('Database not initialised. Call initDatabase() first.');
  return _db;
}

export function sqlite(): Database.Database {
  if (!_sqlite) throw new Error('Database not initialised.');
  return _sqlite;
}

export async function initDatabase(): Promise<void> {
  const file = dbPath();
  const isNew = !fs.existsSync(file);
  _sqlite = new Database(file);
  _sqlite.pragma('journal_mode = WAL');
  _sqlite.pragma('foreign_keys = ON');
  _db = drizzle(_sqlite, { schema });

  runMigrations(_sqlite);

  if (isNew) {
    console.log('[db] fresh database created at', file);
  }
  try {
    await seedIfEmpty(_db, _sqlite, resourcesDir());
  } catch (err) {
    console.error('[db] seed failed', err);
  }
}

export { schema };
