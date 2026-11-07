import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, Network, Wait } from 'testcontainers';
import { parse } from 'yaml';
import { describeMission, PROJECT_ROOT } from '../support/missions.js';
import { POSTGRES_IMAGE } from '../support/global-setup.js';

const TEN_MINUTES = 10 * 60 * 1000;
const COMPOSE = 'compose.yaml';

type Service = Record<string, unknown>;

function services(): Record<string, Service> {
  const file = path.join(PROJECT_ROOT, 'compose.yaml');
  expect(existsSync(file), `esperava encontrar o arquivo ${COMPOSE} na raiz do projeto`).toBe(true);
  let compose: unknown;
  try {
    compose = parse(readFileSync(file, 'utf8'));
  } catch (error) {
    expect(String(error), `esperava que ${COMPOSE} fosse um YAML válido`).toBe('');
  }
  const all = compose !== null && typeof compose === 'object' ? (compose as { services?: unknown }).services : undefined;
  expect(all !== null && typeof all === 'object', `esperava a chave 'services' em ${COMPOSE}`).toBe(true);
  return all as Record<string, Service>;
}

function appService(all: Record<string, Service>): [string, Service] | undefined {
  return Object.entries(all).find(([, service]) => service !== null && typeof service === 'object' && 'build' in service);
}

function databaseService(all: Record<string, Service>): [string, Service] | undefined {
  return Object.entries(all).find(
    ([, service]) =>
      service !== null && typeof service === 'object' && /^(docker\.io\/)?(library\/)?postgres:17/.test(String(service.image ?? '')),
  );
}

function environment(service: Service): Record<string, string> {
  const value = service.environment;
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value.map((item) => {
        const [key, ...rest] = String(item).split('=');
        return [key, rest.join('=')];
      }),
    );
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, String(val)]));
  }
  return {};
}

describeMission('containerization', 'aplicação em contêiner', () => {
  it(
    'a imagem do Dockerfile sobe e responde em /health conectada ao PostgreSQL',
    async () => {
      expect(existsSync(path.join(PROJECT_ROOT, 'Dockerfile')), 'esperava encontrar o arquivo Dockerfile na raiz do projeto').toBe(true);

      let failure: string | undefined;
      let body = '';
      const network = await new Network().start();
      try {
        const database = await new PostgreSqlContainer(POSTGRES_IMAGE)
          .withNetwork(network)
          .withNetworkAliases('db')
          .withDatabase('clinic')
          .withUsername('clinic')
          .withPassword('clinic')
          .start();
        try {
          const image = await GenericContainer.fromDockerfile(PROJECT_ROOT, 'Dockerfile').build('vaga-viva-clinic-test', {
            deleteOnExit: false,
          });
          const app = await image
            .withNetwork(network)
            .withEnvironment({ DATABASE_URL: 'postgresql://clinic:clinic@db:5432/clinic' })
            .withExposedPorts(8080)
            .withWaitStrategy(Wait.forHttp('/health', 8080).forStatusCode(200))
            .withStartupTimeout(3 * 60 * 1000)
            .start();
          try {
            body = await (await fetch(`http://${app.getHost()}:${app.getMappedPort(8080)}/health`)).text();
          } finally {
            await app.stop();
          }
        } catch (error) {
          failure = error instanceof Error ? error.message : String(error);
        } finally {
          await database.stop();
        }
      } finally {
        await network.stop();
      }

      expect(
        failure,
        'esperava construir a imagem do Dockerfile e ver a aplicação responder 200 em /health na porta 8080, usando a variável DATABASE_URL',
      ).toBeUndefined();
      expect(body, 'esperava {"status":"ok"} em /health dentro do contêiner').toContain('"ok"');
    },
    TEN_MINUTES,
  );

  it('o compose.yaml declara a aplicação, construída do Dockerfile, e o PostgreSQL 17', () => {
    const all = services();

    expect(appService(all), `esperava em ${COMPOSE} um serviço com 'build' para a aplicação`).toBeDefined();
    expect(
      databaseService(all),
      `esperava em ${COMPOSE} um serviço com 'image: postgres:17' (ou uma variante, como postgres:17-alpine)`,
    ).toBeDefined();
  });

  it('o compose.yaml publica a porta 8080 e liga a aplicação ao banco pelo nome do serviço', () => {
    const all = services();
    const app = appService(all)?.[1] ?? {};
    const databaseName = databaseService(all)?.[0] ?? '?';
    const ports = Array.isArray(app.ports) ? app.ports.map((port) => JSON.stringify(port)) : [];

    expect(ports.some((port) => port.includes('8080')), "esperava a porta 8080 da aplicação em 'ports'").toBe(true);
    expect(
      environment(app).DATABASE_URL ?? '',
      `esperava DATABASE_URL apontando para o serviço do banco ('${databaseName}'), como postgresql://clinic:clinic@${databaseName}:5432/clinic`,
    ).toContain(`@${databaseName}:`);
  });
});
