import { expectStatus, type ApiResponse } from '../support/api.js';
import { at, futureDate, localDateTime, MONDAY, plusMinutes, THURSDAY, TUESDAY, WEDNESDAY } from '../support/clinic-dates.js';
import { describeMission } from '../support/missions.js';
import { useTestApp } from '../support/test-app.js';

const PATIENT_ID = 1;

describeMission('pagination', 'listagem paginada de consultas', () => {
  const ctx = useTestApp();
  const mon09 = at(futureDate(MONDAY), '09:00');
  const mon14 = at(futureDate(MONDAY), '14:00');
  const tue10 = at(futureDate(TUESDAY), '10:00');
  const wed08 = at(futureDate(WEDNESDAY), '08:00');
  const thu16 = at(futureDate(THURSDAY), '16:00');
  let professionalId: number;

  beforeEach(async () => {
    professionalId = await ctx.fixtures.professional();
    const otherProfessionalId = await ctx.fixtures.professional('Dr. Rafael Moura', 'Cardiologia');
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, tue10, 30);
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, thu16, 60);
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, mon14, 30);
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, wed08, 45);
    await ctx.fixtures.appointment(professionalId, PATIENT_ID, mon09, 30);
    await ctx.fixtures.appointment(otherProfessionalId, PATIENT_ID, mon09, 30);
    await ctx.fixtures.appointment(otherProfessionalId, PATIENT_ID, tue10, 30);
  });

  async function list(query: string, professional: number): Promise<ApiResponse> {
    const response = await ctx.api.get(`/professionals/${professional}/appointments${query}`);
    expectStatus(response, 200, 'esperava status 200 em GET /professionals/{id}/appointments');
    return response;
  }

  function content(response: ApiResponse): Array<Record<string, unknown>> {
    const items = response.json('content');
    expect(Array.isArray(items), `esperava a lista 'content' na resposta; ${response.describe()}`).toBe(true);
    return items as Array<Record<string, unknown>>;
  }

  function starts(response: ApiResponse): unknown[] {
    return content(response).map((item) => localDateTime(item.start));
  }

  function expectPage(response: ApiResponse, number: number, size: number, totalElements: number, totalPages: number): void {
    expect(response.json('page.number'), `esperava page.number = ${number}`).toBe(number);
    expect(response.json('page.size'), `esperava page.size = ${size}`).toBe(size);
    expect(response.json('page.totalElements'), `esperava page.totalElements = ${totalElements}`).toBe(totalElements);
    expect(response.json('page.totalPages'), `esperava page.totalPages = ${totalPages}`).toBe(totalPages);
  }

  it('devolve a primeira página ordenada pela data de início', async () => {
    const response = await list('?page=0&size=2', professionalId);

    expect(starts(response), 'esperava as 2 primeiras consultas, em ordem crescente de início').toEqual([mon09, mon14]);
    expectPage(response, 0, 2, 5, 3);
  });

  it('devolve a última página com os dados de cada consulta', async () => {
    const response = await list('?page=2&size=2', professionalId);

    expect(starts(response), 'esperava só a última consulta na página 2').toEqual([thu16]);
    expect(typeof response.json('content[0].id'), "esperava o campo 'id' em cada consulta").toBe('number');
    expect(response.json('content[0].professionalId'), "esperava o campo 'professionalId' em cada consulta").toBe(professionalId);
    expect(response.json('content[0].patientId'), "esperava o campo 'patientId' em cada consulta").toBe(PATIENT_ID);
    expect(localDateTime(response.json('content[0].end')), "esperava o campo 'end' = início + duração em cada consulta").toBe(
      plusMinutes(thu16, 60),
    );
    expect(response.json('content[0].durationMinutes'), "esperava o campo 'durationMinutes' em cada consulta").toBe(60);
    expectPage(response, 2, 2, 5, 3);
  });

  it('lista só as consultas do profissional, com 20 itens por página por padrão', async () => {
    const response = await list('', professionalId);

    expect(starts(response), 'esperava as 5 consultas do profissional, sem as de outro profissional').toEqual([
      mon09,
      mon14,
      tue10,
      wed08,
      thu16,
    ]);
    expect(
      content(response).map((item) => item.professionalId),
      'esperava só consultas do profissional pedido',
    ).toEqual(Array(5).fill(professionalId));
    expectPage(response, 0, 20, 5, 1);
  });

  it('ordena da mais recente para a mais antiga com sort=start,desc', async () => {
    const response = await list('?page=0&size=3&sort=start,desc', professionalId);

    expect(starts(response), 'esperava as consultas em ordem decrescente de início').toEqual([thu16, wed08, tue10]);
    expectPage(response, 0, 3, 5, 2);
  });

  it('devolve uma página vazia para um profissional sem consultas', async () => {
    const withoutAppointments = await ctx.fixtures.professional('Dra. Beatriz Lins', 'Pediatria');

    const response = await list('?page=0&size=10', withoutAppointments);

    expect(content(response), "esperava a lista 'content' vazia").toEqual([]);
    expectPage(response, 0, 10, 0, 0);
  });
});
