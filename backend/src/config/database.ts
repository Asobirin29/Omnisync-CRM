import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

export interface QueryResult<T = any> {
  rows: T[];
  rowCount?: number;
}

export interface IQueryable {
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;
}

export interface IDatabase extends IQueryable {
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  transaction<T>(callback: (tx: IQueryable) => Promise<T>): Promise<T>;
}

class PostgresDatabase implements IDatabase {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({ connectionString });
  }

  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    const res = await this.pool.query(sql, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount ?? 0,
    };
  }

  async exec(sql: string): Promise<void> {
    await this.pool.query(sql);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async transaction<T>(callback: (tx: IQueryable) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const txQueryable: IQueryable = {
        query: async <K = any>(s: string, p?: any[]) => {
          const r = await client.query(s, p);
          return { rows: r.rows, rowCount: r.rowCount ?? 0 };
        }
      };
      const result = await callback(txQueryable);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

class PgliteDatabase implements IDatabase {
  private pglite!: PGlite;
  private isReady = false;
  private readyPromise: Promise<void>;

  constructor(dataDir: string) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.readyPromise = (async () => {
      this.pglite = new PGlite(dataDir);
      await this.pglite.waitReady;
      this.isReady = true;
    })();
  }

  private async ensureReady() {
    if (!this.isReady) {
      await this.readyPromise;
    }
  }

  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    await this.ensureReady();
    const res = await this.pglite.query<T>(sql, params);
    return {
      rows: res.rows,
      rowCount: res.affectedRows,
    };
  }

  async exec(sql: string): Promise<void> {
    await this.ensureReady();
    await this.pglite.exec(sql);
  }

  async close(): Promise<void> {
    await this.ensureReady();
    await this.pglite.close();
  }

  async transaction<T>(callback: (tx: IQueryable) => Promise<T>): Promise<T> {
    await this.ensureReady();
    return await this.pglite.transaction(async (tx) => {
      const txQueryable: IQueryable = {
        query: async <K = any>(s: string, p?: any[]) => {
          const r = await tx.query<K>(s, p);
          return { rows: r.rows, rowCount: r.affectedRows };
        }
      };
      return await callback(txQueryable);
    });
  }
}

// Singleton database instance
let dbInstance: IDatabase | null = null;

export function getDatabase(): IDatabase {
  if (dbInstance) {
    return dbInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim() !== '') {
    console.log('[Database] Connecting to PostgreSQL via DATABASE_URL...');
    dbInstance = new PostgresDatabase(databaseUrl);
  } else {
    const dataDir = path.resolve(process.cwd(), 'data', 'pglite_db');
    console.log(`[Database] Using embedded PostgreSQL (PGlite) at ${dataDir}`);
    dbInstance = new PgliteDatabase(dataDir);
  }

  return dbInstance;
}

export const db = {
  query: <T = any>(sql: string, params?: any[]) => getDatabase().query<T>(sql, params),
  exec: (sql: string) => getDatabase().exec(sql),
  close: () => getDatabase().close(),
  transaction: <T = any>(callback: (tx: IQueryable) => Promise<T>) => getDatabase().transaction<T>(callback),
};
