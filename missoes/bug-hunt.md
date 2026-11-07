# Missão `bug-hunt`: caça ao bug

Encontre e corrija um defeito escondido no cálculo da duração das consultas.

Testes: `test/missions/bug-hunt.spec.ts`. Para rodar só esta missão: `npm test -- missions/bug-hunt`.

## Contrato

- O cálculo fica em `appointmentDuration(start, end)`, em `src/appointments/appointment-duration.ts`, que devolve a duração em minutos entre dois `DateTime` do Luxon.
- O resultado precisa estar certo para qualquer par de datas em que `end` vem depois de `start`, inclusive em dias diferentes.
- Mantenha a assinatura da função: outras partes do sistema a usam.
- Os testes da missão mostram os casos em que o resultado sai errado. Antes de corrigir, entenda por quê.
