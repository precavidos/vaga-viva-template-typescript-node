import type { INestApplication } from '@nestjs/common';

/**
 * Configuração da aplicação usada tanto por `main.ts` quanto pelos testes (`test/support/test-app.ts`).
 */
export function configureApp(app: INestApplication): INestApplication {
  return app;
}
