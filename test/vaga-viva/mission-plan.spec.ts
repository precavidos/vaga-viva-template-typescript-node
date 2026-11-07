import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { missionSkipReason } from '../support/missions.js';

describe('Plano do Vaga Viva (.vaga-viva/plan.json)', () => {
  let projectRoot: string;

  beforeEach(() => {
    projectRoot = mkdtempSync(path.join(tmpdir(), 'vaga-viva-plan-'));
  });

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true });
  });

  function writePlan(json: string): void {
    mkdirSync(path.join(projectRoot, '.vaga-viva'), { recursive: true });
    writeFileSync(path.join(projectRoot, '.vaga-viva', 'plan.json'), json);
  }

  it('sem o arquivo de plano, todas as missões rodam', () => {
    expect(missionSkipReason('pagination', projectRoot), 'esperava a missão ativa sem plan.json').toBeUndefined();
  });

  it('ignora, com o motivo, as missões fora do plano', () => {
    writePlan('{"archetype": "typescript-node", "domain": "clinic-scheduling", "missions": ["patients-api", "persistence"]}');

    expect(missionSkipReason('pagination', projectRoot), 'esperava o motivo da desativação').toBe(
      "Missão 'pagination' fora do seu plano (.vaga-viva/plan.json)",
    );
  });

  it('mantém ativas as missões do plano', () => {
    writePlan('{"missions": ["patients-api"]}');

    expect(missionSkipReason('patients-api', projectRoot), 'esperava patients-api ativa').toBeUndefined();
  });

  it('recusa um arquivo de plano malformado com mensagem clara', () => {
    writePlan('{"missions": "patients-api"}');

    expect(() => missionSkipReason('patients-api', projectRoot)).toThrow(
      'O arquivo .vaga-viva/plan.json precisa ter a lista "missions" com os ids das missões',
    );
  });

  it('recusa um arquivo de plano que não é JSON', () => {
    writePlan('{"missions": [');

    expect(() => missionSkipReason('patients-api', projectRoot)).toThrow('Não foi possível ler .vaga-viva/plan.json');
  });
});
