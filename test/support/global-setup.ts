import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
export const POSTGRES_IMAGE = 'postgres:17-alpine';

export const SECURITY_USERS_FILE = 'test/config/security-users.json';

declare global {
  var __CLINIC_POSTGRES__: StartedPostgreSqlContainer | undefined;
}

/**
 * Sobe um PostgreSQL com Testcontainers, compartilhado por todos os testes, e aplica as migrações do Prisma.
 */
export default async function globalSetup(globalConfig: { rootDir: string }): Promise<void> {
  const container = await new PostgreSqlContainer(POSTGRES_IMAGE)
    .withDatabase('clinic')
    .withUsername('clinic')
    .withPassword('clinic')
    .start();
  globalThis.__CLINIC_POSTGRES__ = container;
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.CLINIC_SECURITY_USERS_FILE = SECURITY_USERS_FILE;

  const prismaCli = path.join(globalConfig.rootDir, 'node_modules', 'prisma', 'build', 'index.js');
  try {
    execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
      cwd: globalConfig.rootDir,
      env: process.env,
      stdio: 'pipe',
    });
  } catch (error) {
    const output = error instanceof Error && 'stderr' in error ? String(error.stderr) : String(error);
    throw new Error(`Não foi possível aplicar as migrações de prisma/migrations (prisma migrate deploy):\n${output}`);
  }
}
