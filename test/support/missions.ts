import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MISSIONS = [
  'patients-api',
  'persistence',
  'scheduling-rules',
  'input-validation',
  'bug-hunt',
  'pagination',
  'ci-pipeline',
  'availability-query',
  'containerization',
  'reminder-strategies',
  'api-security',
] as const;

export type MissionId = (typeof MISSIONS)[number];

/** Caminho do plano, sempre escrito com `/` nas mensagens. */
export const PLAN_FILE = '.vaga-viva/plan.json';

export const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));

/**
 * Lê as missões de `.vaga-viva/plan.json`. Devolve `undefined` quando o arquivo não existe: nesse caso, todas as
 * missões rodam.
 */
export function plannedMissions(projectRoot: string = PROJECT_ROOT): Set<string> | undefined {
  const file = path.join(projectRoot, '.vaga-viva', 'plan.json');
  if (!existsSync(file)) {
    return undefined;
  }
  let plan: unknown;
  try {
    plan = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Não foi possível ler ${PLAN_FILE}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const missions = plan !== null && typeof plan === 'object' ? (plan as { missions?: unknown }).missions : undefined;
  if (!Array.isArray(missions) || !missions.every((mission) => typeof mission === 'string')) {
    throw new Error(`O arquivo ${PLAN_FILE} precisa ter a lista "missions" com os ids das missões`);
  }
  return new Set(missions);
}

/** Motivo para ignorar a missão, ou `undefined` quando ela deve rodar. */
export function missionSkipReason(id: MissionId, projectRoot: string = PROJECT_ROOT): string | undefined {
  const planned = plannedMissions(projectRoot);
  if (planned === undefined || planned.has(id)) {
    return undefined;
  }
  return `Missão '${id}' fora do seu plano (${PLAN_FILE})`;
}

/**
 * Declara os testes de uma missão. Quando a missão está fora do plano, o grupo é ignorado (`describe.skip`), com o
 * motivo no nome.
 */
export function describeMission(id: MissionId, title: string, tests: () => void): void {
  const name = `Missão ${id}: ${title}`;
  const reason = missionSkipReason(id);
  if (reason === undefined) {
    describe(name, tests);
  } else {
    describe.skip(`${reason} — ${name}`, tests);
  }
}
