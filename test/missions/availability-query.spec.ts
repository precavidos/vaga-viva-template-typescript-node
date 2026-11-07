import { expectStatus } from '../support/api.js';
import { at, futureDate, localDateTime, MONDAY, plusDays, SATURDAY, SUNDAY } from '../support/clinic-dates.js';
import { describeMission } from '../support/missions.js';
import { useTestApp } from '../support/test-app.js';

const PATIENT_ID = 1;

interface Slot {
  start: unknown;
  end: unknown;
}

function slot(date: string, start: string, end: string): Slot {
  return { start: at(date, start), end: at(date, end) };
}

describeMission('availability-query', 'consulta de horários livres', () => {
  const ctx = useTestApp();
  const monday = futureDate(MONDAY);
  let professionalId: number;

  beforeEach(async () => {
    professionalId = await ctx.fixtures.professional();
  });

  async function availability(professional: number, date: string): Promise<Slot[]> {
    const response = await ctx.api.get(`/professionals/${professional}/availability?date=${date}`);
    expectStatus(response, 200, `esperava status 200 em GET /professionals/{id}/availability?date=${date}`);
    expect(Array.isArray(response.body), `esperava uma lista JSON de intervalos {start, end}; ${response.describe()}`).toBe(true);
    return (response.body as Array<Record<string, unknown>>).map((item) => ({
      start: localDateTime(item.start),
      end: localDateTime(item.end),
    }));
  }

  it('um dia útil sem consultas fica livre das 08:00 às 18:00', async () => {
    const free = await availability(professionalId, monday);

    expect(free, 'esperava um único intervalo livre das 08:00 às 18:00').toEqual([slot(monday, '08:00', '18:00')]);
  });

  it('devolve os intervalos entre as consultas, em ordem', async () => {
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, at(monday, '13:00'), 90);
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, at(monday, '09:00'), 60);

    const free = await availability(professionalId, monday);

    expect(free, 'esperava os intervalos livres 08:00-09:00, 10:00-13:00 e 14:30-18:00').toEqual([
      slot(monday, '08:00', '09:00'),
      slot(monday, '10:00', '13:00'),
      slot(monday, '14:30', '18:00'),
    ]);
  });

  it('ignora consultas de outros profissionais e de outros dias', async () => {
    const otherProfessionalId = await ctx.fixtures.professional('Dr. Rafael Moura', 'Cardiologia');
    await ctx.fixtures.appointment(otherProfessionalId, PATIENT_ID, at(monday, '10:00'), 60);
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, at(plusDays(monday, 1), '10:00'), 60);
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, at(monday, '15:00'), 30);

    const free = await availability(professionalId, monday);

    expect(free, 'esperava só a consulta das 15:00 do próprio profissional, nesse dia, ocupando a agenda').toEqual([
      slot(monday, '08:00', '15:00'),
      slot(monday, '15:30', '18:00'),
    ]);
  });

  it('não devolve intervalos vazios entre consultas encostadas nem nas pontas do dia', async () => {
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, at(monday, '08:00'), 60);
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, at(monday, '09:00'), 60);
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, at(monday, '17:00'), 60);

    const free = await availability(professionalId, monday);

    expect(free, 'esperava só o intervalo livre das 10:00 às 17:00').toEqual([slot(monday, '10:00', '17:00')]);
  });

  it('não há horários livres no fim de semana', async () => {
    expect(await availability(professionalId, futureDate(SATURDAY)), 'esperava lista vazia no sábado').toEqual([]);
    expect(await availability(professionalId, futureDate(SUNDAY)), 'esperava lista vazia no domingo').toEqual([]);
  });
});
