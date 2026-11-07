import { DateTime } from 'luxon';
import { REMINDER_CHANNELS } from '../../src/reminders/reminder.js';
import { REMINDER_STRATEGIES, type ReminderStrategy } from '../../src/reminders/reminder-strategy.js';
import { expectStatus } from '../support/api.js';
import { at, futureDate, MONDAY } from '../support/clinic-dates.js';
import { describeMission } from '../support/missions.js';
import { createPatient, newPatient, type PatientData } from '../support/patients.js';
import { useTestApp } from '../support/test-app.js';

const PROFESSIONAL_NAME = 'Dr. Rafael Moura';

describeMission('reminder-strategies', 'lembretes por e-mail e SMS', () => {
  const ctx = useTestApp();
  const monday = futureDate(MONDAY);
  const expectedDate = DateTime.fromISO(monday).toFormat('dd/MM/yyyy');
  let patient: PatientData;
  let appointmentId: number;

  beforeEach(async () => {
    patient = newPatient();
    const patientId = await createPatient(ctx.api, patient);
    const professionalId = await ctx.fixtures.professional(PROFESSIONAL_NAME, 'Cardiologia');
    appointmentId = await ctx.fixtures.appointment(professionalId, patientId, at(monday, '10:15'), 30);
  });

  it('envia o lembrete por e-mail para o e-mail do paciente', async () => {
    const response = await ctx.api.post(`/appointments/${appointmentId}/reminders?channel=EMAIL`);

    expectStatus(response, 202, 'esperava status 202 em POST /appointments/{id}/reminders?channel=EMAIL');
    expect(ctx.emails.sent, 'esperava exatamente um e-mail enviado pelo EmailSender').toHaveLength(1);
    const email = ctx.emails.sent[0]!;
    expect(email.to, 'esperava o e-mail enviado para o endereço do paciente').toBe(patient.email);
    expect(email.subject.trim(), 'esperava um assunto no e-mail').not.toBe('');
    for (const part of [PROFESSIONAL_NAME, expectedDate, '10:15']) {
      expect(email.body, `esperava no texto do e-mail o profissional, a data (dd/MM/aaaa) e a hora (HH:mm): '${part}'`).toContain(part);
    }
    expect(ctx.sms.sent, 'esperava que o lembrete por e-mail não enviasse SMS').toHaveLength(0);
  });

  it('envia o lembrete por SMS para o telefone do paciente', async () => {
    const response = await ctx.api.post(`/appointments/${appointmentId}/reminders?channel=SMS`);

    expectStatus(response, 202, 'esperava status 202 em POST /appointments/{id}/reminders?channel=SMS');
    expect(ctx.sms.sent, 'esperava exatamente um SMS enviado pelo SmsSender').toHaveLength(1);
    const message = ctx.sms.sent[0]!;
    expect(message.phone, 'esperava o SMS enviado para o telefone do paciente').toBe(patient.phone);
    for (const part of [PROFESSIONAL_NAME, expectedDate, '10:15']) {
      expect(message.text, `esperava no SMS o profissional, a data (dd/MM/aaaa) e a hora (HH:mm): '${part}'`).toContain(part);
    }
    expect(ctx.emails.sent, 'esperava que o lembrete por SMS não enviasse e-mail').toHaveLength(0);
  });

  it('tem uma estratégia (ReminderStrategy) para cada canal', () => {
    const strategies = ctx.app.get<symbol, ReminderStrategy[]>(REMINDER_STRATEGIES, { strict: false });

    expect(
      strategies.map((strategy) => strategy.channel).sort(),
      'esperava em REMINDER_STRATEGIES uma ReminderStrategy para cada canal (EMAIL e SMS)',
    ).toEqual([...REMINDER_CHANNELS].sort());
    expect(
      new Set(strategies.map((strategy) => strategy.constructor)).size,
      'esperava uma classe diferente para cada canal',
    ).toBe(strategies.length);
  });
});
