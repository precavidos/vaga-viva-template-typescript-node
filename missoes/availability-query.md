# Missão `availability-query`: consulta de horários livres

Calcule, com uma consulta SQL (`prisma.$queryRaw`), os horários livres de um profissional em um dia.

Testes: `test/missions/availability-query.spec.ts`. Para rodar só esta missão: `npm test -- missions/availability-query`.

## Endpoint

`GET /professionals/{id}/availability?date=2030-03-04`

`200 OK` com a lista dos intervalos livres do dia, em ordem:

```json
[
  {"start": "2030-03-04T08:00:00", "end": "2030-03-04T09:00:00"},
  {"start": "2030-03-04T10:00:00", "end": "2030-03-04T18:00:00"}
]
```

## Regras

- O dia vai do horário de abertura ao de fechamento (`CLINIC_OPENS_AT` e `CLINIC_CLOSES_AT`, das 08:00 às 18:00, nos dias de `CLINIC_OPENING_DAYS`, de segunda a sexta, no fuso `CLINIC_TIME_ZONE`).
- Um intervalo livre é um trecho do dia sem consulta do profissional. Consultas vêm da tabela `appointments` (`starts_at` + `duration_minutes`).
- Consultas de outros profissionais e de outros dias não contam.
- Não há intervalos vazios: consultas encostadas não geram intervalo entre elas, e não há intervalo antes de uma consulta que começa na abertura nem depois de uma que termina no fechamento.
- Dia sem atendimento (sábado e domingo) devolve `[]`.
- Os testes conferem o resultado, não o texto do SQL.
