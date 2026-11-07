# Missão `ci-pipeline`: pipeline de integração contínua

Rode a instalação e os testes a cada push com GitHub Actions.

Testes: `test/missions/ci-pipeline.spec.ts`. Para rodar só esta missão: `npm test -- missions/ci-pipeline`.

## Contrato

Crie o arquivo `.github/workflows/ci.yml`. Os testes leem esse YAML e conferem que:

- ele dispara nos eventos `push` e `pull_request`;
- um passo usa `actions/setup-node` com `node-version: 22` e `cache: npm`;
- um passo roda `npm ci` e um passo roda `npm test`.

O arquivo `.github/workflows/vaga-viva.yml` é do Vaga Viva e não faz parte da missão. Não o altere nem o use como resposta.
