# Missão `persistence`: pacientes no banco de dados

Guarde os pacientes no PostgreSQL com o Prisma e crie o esquema com uma migração.

Testes: `test/missions/persistence.spec.ts`. Para rodar só esta missão: `npm test -- missions/persistence`.

## Contrato

- A API de pacientes (missão `patients-api`) continua igual, mas lê e grava no banco.
- Um modelo `Patient` em `prisma/schema.prisma`, ligado à tabela `patients` (`@@map("patients")`).
- Tabela `patients`, criada por uma **migração nova** em `prisma/migrations` (não altere a migração `20261106000000_init`):

| Coluna | Conteúdo |
| --- | --- |
| `id` | identificador numérico, gerado pelo banco quando o `INSERT` não informa o valor |
| `name` | nome |
| `email` | e-mail |
| `phone` | telefone |
| `birth_date` | data de nascimento, tipo `DATE` |

- Quem cria e altera o esquema são as migrações do Prisma. Os testes aplicam as migrações com `prisma migrate deploy` antes de rodar; `prisma db push` não serve, porque não gera migração.
- Um paciente inserido direto na tabela, por SQL, precisa aparecer em `GET /patients/{id}`. Alterar e remover pela API precisa alterar e remover a linha da tabela.

A coluna `appointments.patient_id` fica **sem** chave estrangeira para `patients`: os testes de outras missões inserem consultas com pacientes que não estão na tabela.
