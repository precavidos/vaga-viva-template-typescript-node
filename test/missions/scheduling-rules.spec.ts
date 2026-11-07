import { expectStatus, type ApiResponse } from '../support/api.js';
import { at, futureDate, localDateTime, MONDAY, pastDate, SATURDAY } from '../support/clinic-dates.js';
import { describeMission } from '../support/missions.js';
import { createPatient } from '../support/patients.js';
import { useTestApp } from '../support/test-app.js';

describeMission('scheduling-rules', 'regras de agendamento', () => {
  const ctx = useTestApp();
  const monday = futureDate(MONDAY);
  let patientId: number;
  let professionalId: number;

  beforeEach(async () => {
    patientId = await createPatient(ctx.api);
    professionalId = await ctx.fixtures.professional();
  });

  function schedule(professional: number, start: string, end: string): Promise<ApiResponse> {
    return ctx.api.post('/appointments', { patientId, professionalId: professional, start, end });
  }

  it('agenda uma consulta dentro do horário de funcionamento', async () => {
    const start = at(monday, '10:00');
    const end = at(monday, '10:30');

    const response = await schedule(professionalId, start, end);

    expectStatus(response, 201, 'esperava status 201 em POST /appointments');
    const id = response.json('id');
    expect(typeof id, `esperava o campo 'id' numérico na resposta; ${response.describe()}`).toBe('number');
    expect(response.json('professionalId'), "esperava o campo 'professionalId' na resposta").toBe(professionalId);
    expect(response.json('patientId'), "esperava o campo 'patientId' na resposta").toBe(patientId);
    expect(localDateTime(response.json('start')), "esperava o campo 'start' na resposta").toBe(start);
    expect(localDateTime(response.json('end')), "esperava o campo 'end' na resposta").toBe(end);
    const rows = await ctx.db.query(
      'SELECT professional_id, patient_id, starts_at::text AS starts_at, duration_minutes FROM appointments WHERE id = $1',
      [id],
    );
    expect(rows[0], 'esperava a consulta gravada na tabela appointments com duração de 30 minutos').toEqual({
      professional_id: professionalId,
      patient_id: patientId,
      starts_at: `${monday} 10:00:00`,
      duration_minutes: 30,
    });
  });

  it('recusa com 422 uma consulta no passado', async () => {
    const pastMonday = pastDate(MONDAY);

    const response = await schedule(professionalId, at(pastMonday, '10:00'), at(pastMonday, '10:30'));

    expectStatus(response, 422, 'esperava recusar consulta no passado com status 422');
    expect(await ctx.fixtures.countAppointments(), 'esperava que a consulta recusada não fosse gravada').toBe(0);
  });

  it('recusa com 422 consultas fora do horário de funcionamento', async () => {
    const saturday = futureDate(SATURDAY);

    const beforeOpening = await schedule(professionalId, at(monday, '07:30'), at(monday, '08:30'));
    const afterClosing = await schedule(professionalId, at(monday, '17:30'), at(monday, '18:30'));
    const onSaturday = await schedule(professionalId, at(saturday, '10:00'), at(saturday, '10:30'));

    expectStatus(beforeOpening, 422, 'esperava recusar com 422 consulta que começa antes das 08:00');
    expectStatus(afterClosing, 422, 'esperava recusar com 422 consulta que termina depois das 18:00');
    expectStatus(onSaturday, 422, 'esperava recusar com 422 consulta no sábado');
    expect(await ctx.fixtures.countAppointments(), 'esperava que as consultas recusadas não fossem gravadas').toBe(0);
  });

  it('aceita consultas que começam na abertura e terminam no fechamento', async () => {
    const atOpening = await schedule(professionalId, at(monday, '08:00'), at(monday, '08:30'));
    const atClosing = await schedule(professionalId, at(monday, '17:30'), at(monday, '18:00'));

    expectStatus(atOpening, 201, 'esperava aceitar consulta das 08:00 às 08:30');
    expectStatus(atClosing, 201, 'esperava aceitar consulta das 17:30 às 18:00');
  });

  it('recusa com 409 uma consulta que se sobrepõe a outra do mesmo profissional', async () => {
    await ctx.fixtures.appointment(professionalId, patientId, at(monday, '10:00'), 60);

    const overlapsEnd = await schedule(professionalId, at(monday, '10:30'), at(monday, '11:30'));
    const overlapsStart = await schedule(professionalId, at(monday, '09:30'), at(monday, '10:30'));
    const contains = await schedule(professionalId, at(monday, '09:00'), at(monday, '12:00'));

    expectStatus(overlapsEnd, 409, 'esperava recusar com 409 consulta das 10:30 às 11:30 sobre outra das 10:00 às 11:00');
    expectStatus(overlapsStart, 409, 'esperava recusar com 409 consulta das 09:30 às 10:30 sobre outra das 10:00 às 11:00');
    expectStatus(contains, 409, 'esperava recusar com 409 consulta das 09:00 às 12:00 sobre outra das 10:00 às 11:00');
    expect(await ctx.fixtures.countAppointments(), 'esperava que só a consulta original estivesse gravada').toBe(1);
  });

  it('aceita consultas encostadas e consultas no mesmo horário com outro profissional', async () => {
    const otherProfessionalId = await ctx.fixtures.professional('Dr. Rafael Moura', 'Cardiologia');
    await ctx.fixtures.appointment(professionalId, patientId, at(monday, '10:00'), 60);

    const after = await schedule(professionalId, at(monday, '11:00'), at(monday, '11:30'));
    const before = await schedule(professionalId, at(monday, '09:00'), at(monday, '10:00'));
    const other = await schedule(otherProfessionalId, at(monday, '10:00'), at(monday, '11:00'));

    expectStatus(after, 201, 'esperava aceitar consulta que começa às 11:00, quando a anterior termina');
    expectStatus(before, 201, 'esperava aceitar consulta que termina às 10:00, quando a próxima começa');
    expectStatus(other, 201, 'esperava aceitar consulta no mesmo horário com outro profissional');
  });
});
