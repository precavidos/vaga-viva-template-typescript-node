import pg from 'pg';

/**
 * Acesso direto ao PostgreSQL dos testes, para fixtures e conferências em SQL.
 */
export class Database {
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });

  async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  async tableExists(table: string): Promise<boolean> {
    const [row] = await this.query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables
                      WHERE table_schema = current_schema() AND table_name = $1) AS exists`,
      [table],
    );
    return row?.exists === true;
  }

  async columns(table: string): Promise<string[]> {
    const rows = await this.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = $1`,
      [table],
    );
    return rows.map((row) => row.column_name);
  }

  /** Esvazia todas as tabelas, menos o histórico de migrações do Prisma. */
  async reset(): Promise<void> {
    const rows = await this.query<{ name: string }>(
      `SELECT quote_ident(tablename) AS name FROM pg_tables
       WHERE schemaname = current_schema() AND tablename <> '_prisma_migrations'`,
    );
    if (rows.length > 0) {
      await this.pool.query(`TRUNCATE TABLE ${rows.map((row) => row.name).join(', ')} RESTART IDENTITY CASCADE`);
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
