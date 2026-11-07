# Vaga Viva: modelo TypeScript/Node

Repositório-modelo do arquétipo `typescript-node` do Vaga Viva: a API de um sistema fictício de agendamento de clínica, com pacientes, profissionais e consultas.

O projeto começa incompleto. Cada missão do seu plano tem testes automatizados que falham até você implementá-la. O contrato de cada missão está em `missoes/`.

## Tecnologias

Node.js 22, TypeScript, NestJS, Prisma, PostgreSQL 17, Luxon, Jest, Supertest e Testcontainers.

## Pré-requisitos

- Node.js 22 (com o npm).
- Docker em execução: os testes sobem um PostgreSQL com Testcontainers.

O `npm ci` baixa o *schema engine* do Prisma (usado pelas migrações) de `binaries.prisma.sh`, além dos pacotes do registro do npm.

## Comandos

| Para | Rode |
| --- | --- |
| instalar as dependências | `npm ci` |
| rodar todos os testes | `npm test` |
| rodar os testes de uma missão | `npm test -- missions/<id-da-missão>`, por exemplo `npm test -- missions/patients-api` |
| conferir os tipos | `npx tsc --noEmit` |
| aplicar as migrações | `npx prisma migrate deploy`, com um PostgreSQL em `DATABASE_URL` |
| subir a aplicação | `npm run build` e depois `npm start` |

Para subir um PostgreSQL local:

```sh
docker run --rm -p 5432:5432 -e POSTGRES_DB=clinic -e POSTGRES_USER=clinic -e POSTGRES_PASSWORD=clinic postgres:17-alpine
```

A aplicação escuta na porta `8080` e responde `{"status":"ok"}` em `http://localhost:8080/health`.

## Configuração

Tudo vem de variáveis de ambiente, lidas pelo `@nestjs/config`. Os valores padrão estão abaixo.

| Variável | Padrão |
| --- | --- |
| `DATABASE_URL` | `postgresql://clinic:clinic@localhost:5432/clinic` |
| `PORT` | `8080` |
| `CLINIC_TIME_ZONE` | `America/Sao_Paulo` |
| `CLINIC_OPENING_DAYS` | `MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY` |
| `CLINIC_OPENS_AT` | `08:00` |
| `CLINIC_CLOSES_AT` | `18:00` |

Nos testes, `DATABASE_URL` aponta para o PostgreSQL do Testcontainers, e `CLINIC_SECURITY_USERS_FILE` aponta para `test/config/security-users.json` (veja a missão `api-security`).

## Seu plano: `.vaga-viva/plan.json`

O Vaga Viva cria o arquivo `.vaga-viva/plan.json` no seu repositório com as missões que você escolheu:

```json
{
  "archetype": "typescript-node",
  "domain": "clinic-scheduling",
  "missions": ["patients-api", "persistence", "scheduling-rules", "pagination", "availability-query", "containerization"]
}
```

Os testes das missões fora do plano aparecem como ignorados (*skipped*), com o motivo no nome, e não como falhas. Sem esse arquivo, os testes de todas as missões rodam. Os testes que não pertencem a nenhuma missão sempre rodam.

O workflow `.github/workflows/vaga-viva.yml` roda `npm ci` e `npm test` a cada push na `main` e a cada pull request, e guarda o relatório dos testes (`reports/junit.xml`). Ele é do Vaga Viva: não o altere.

## Missões

| Missão | Contrato |
| --- | --- |
| `patients-api` | [Cadastro de pacientes](missoes/patients-api.md) |
| `persistence` | [Pacientes no banco de dados](missoes/persistence.md) |
| `scheduling-rules` | [Regras de agendamento](missoes/scheduling-rules.md) |
| `input-validation` | [Validação e mensagens de erro](missoes/input-validation.md) |
| `bug-hunt` | [Caça ao bug](missoes/bug-hunt.md) |
| `pagination` | [Listagem paginada de consultas](missoes/pagination.md) |
| `ci-pipeline` | [Pipeline de integração contínua](missoes/ci-pipeline.md) |
| `availability-query` | [Consulta de horários livres](missoes/availability-query.md) |
| `containerization` | [Aplicação em contêiner](missoes/containerization.md) |
| `reminder-strategies` | [Lembretes por e-mail e SMS](missoes/reminder-strategies.md) |
| `api-security` | [Proteção da API](missoes/api-security.md) |

Os testes de cada missão ficam em `test/missions/<id>.spec.ts`. Leia os testes e as mensagens de falha: elas dizem o que ainda falta.

## Estrutura

```
prisma/
  schema.prisma     modelos do Prisma
  migrations/       migrações
src/
  main.ts           sobe a aplicação
  app.module.ts     módulo raiz
  app.setup.ts      configuração da aplicação, usada também pelos testes
  appointments/     cálculo da duração das consultas
  clock/            relógio no fuso da clínica (token CLOCK)
  config/           horário de funcionamento e fuso (clinicConfig)
  health/           GET /health
  prisma/           PrismaService
  reminders/        contratos de envio de lembretes
test/
  missions/         testes das missões
  support/          infraestrutura dos testes (PostgreSQL, cliente HTTP, dados fictícios, plano)
  config/           usuários de teste
  vaga-viva/        testes da leitura do plano
```

O cliente do Prisma é gerado em `src/generated/prisma` pelo `npm ci` e antes de cada `npm test`. Depois de alterar o `schema.prisma`, rode `npx prisma generate` para atualizar os tipos no editor.

Todos os dados do projeto são fictícios.

## Licença

[MIT](LICENSE).
