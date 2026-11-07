import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { describeMission, PROJECT_ROOT } from '../support/missions.js';

const WORKFLOW = '.github/workflows/ci.yml';

type Step = Record<string, unknown>;

function loadWorkflow(): Record<string, unknown> {
  const file = path.join(PROJECT_ROOT, '.github', 'workflows', 'ci.yml');
  expect(existsSync(file), `esperava encontrar o arquivo ${WORKFLOW} na raiz do projeto`).toBe(true);
  let workflow: unknown;
  try {
    workflow = parse(readFileSync(file, 'utf8'));
  } catch (error) {
    workflow = undefined;
    expect(String(error), `esperava que ${WORKFLOW} fosse um YAML válido`).toBe('');
  }
  expect(
    workflow !== null && typeof workflow === 'object' && !Array.isArray(workflow),
    `esperava que ${WORKFLOW} fosse um YAML com as chaves 'on' e 'jobs'`,
  ).toBe(true);
  return workflow as Record<string, unknown>;
}

function events(on: unknown): string[] {
  if (typeof on === 'string') {
    return [on];
  }
  if (Array.isArray(on)) {
    return on.map(String);
  }
  if (on !== null && typeof on === 'object') {
    return Object.keys(on);
  }
  return [];
}

function steps(workflow: Record<string, unknown>): Step[] {
  const jobs = workflow.jobs;
  const all: Step[] = [];
  if (jobs !== null && typeof jobs === 'object') {
    for (const job of Object.values(jobs as Record<string, unknown>)) {
      const jobSteps = job !== null && typeof job === 'object' ? (job as { steps?: unknown }).steps : undefined;
      if (Array.isArray(jobSteps)) {
        all.push(...jobSteps.filter((step): step is Step => step !== null && typeof step === 'object'));
      }
    }
  }
  expect(all.length, `esperava ao menos um job com 'steps' em ${WORKFLOW}`).toBeGreaterThan(0);
  return all;
}

describeMission('ci-pipeline', 'pipeline de integração contínua', () => {
  it('o workflow ci.yml dispara a cada push e a cada pull request', () => {
    const workflow = loadWorkflow();

    expect(events(workflow.on), `esperava os eventos push e pull_request na chave 'on' de ${WORKFLOW}`).toEqual(
      expect.arrayContaining(['push', 'pull_request']),
    );
  });

  it('o workflow usa Node 22 com cache do npm', () => {
    const setupNode = steps(loadWorkflow()).filter((step) => String(step.uses ?? '').startsWith('actions/setup-node'));

    expect(setupNode.length, `esperava um passo com 'uses: actions/setup-node' em ${WORKFLOW}`).toBeGreaterThan(0);
    const configured = setupNode.some((step) => {
      const options = (step.with ?? {}) as Record<string, unknown>;
      return String(options['node-version'] ?? '').startsWith('22') && options.cache === 'npm';
    });
    expect(configured, 'esperava o actions/setup-node configurado com node-version 22 e cache npm').toBe(true);
  });

  it('o workflow roda npm ci e npm test', () => {
    const commands = steps(loadWorkflow())
      .map((step) => step.run)
      .filter((run): run is string => typeof run === 'string');

    expect(commands.some((command) => /\bnpm ci\b/.test(command)), `esperava um passo 'run' que execute npm ci em ${WORKFLOW}`).toBe(true);
    expect(
      commands.some((command) => /\bnpm (run )?test\b/.test(command)),
      `esperava um passo 'run' que execute npm test em ${WORKFLOW}`,
    ).toBe(true);
  });
});
