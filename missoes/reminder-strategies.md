# Missão `reminder-strategies`: lembretes por e-mail e SMS

Envie lembretes de consulta por canais diferentes, aplicando um padrão de projeto com providers do NestJS.

Testes: `test/missions/reminder-strategies.spec.ts`. Para rodar só esta missão: `npm test -- missions/reminder-strategies`.

## O que o código inicial já traz

Pasta `src/reminders`:

- `EmailSender` e `SmsSender`, injetáveis pelos tokens `EMAIL_SENDER` e `SMS_SENDER`: quem de fato envia. As implementações do código inicial só escrevem no log; nos testes, elas são trocadas por versões que guardam o que foi enviado.
- `ReminderChannel`: os canais, `EMAIL` e `SMS` (`REMINDER_CHANNELS`).
- `ReminderStrategy`: o contrato de um canal de lembrete.
- `REMINDER_STRATEGIES`: o token da lista de estratégias (`ReminderStrategy[]`), registrado em `RemindersModule`.
- `Reminder`: os dados de um lembrete.

## Contrato

- Cada canal tem a sua implementação de `ReminderStrategy`, uma classe por canal. A lista injetada por `REMINDER_STRATEGIES` traz uma estratégia para cada canal.
- `POST /appointments/{id}/reminders?channel=EMAIL` ou `?channel=SMS` envia o lembrete da consulta `{id}` pelo canal pedido e responde `202 Accepted`.
- E-mail: enviado por `EmailSender` para o e-mail do paciente, com assunto.
- SMS: enviado por `SmsSender` para o telefone do paciente.
- O texto traz o nome do profissional, a data no formato `dd/MM/aaaa` e a hora no formato `HH:mm`. Exemplo: `Lembrete: consulta com Dr. Rafael Moura em 04/03/2030 às 10:15.`
- Um lembrete por um canal não envia nada pelo outro.
