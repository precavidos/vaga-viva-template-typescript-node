import { expectStatus } from '../support/api.js';
import { at, futureDate, MONDAY } from '../support/clinic-dates.js';
import { describeMission } from '../support/missions.js';
import { createPatient, newPatient } from '../support/patients.js';
import { useTestApp } from '../support/test-app.js';
import { PROFESSIONAL, RECEPTIONIST } from '../support/test-users.js';

describeMission('api-security', 'proteção da API', () => {
  const ctx = useTestApp();

  it('sem credenciais, recusa a API com 401 e mantém /health público', async () => {
    const anonymous = ctx.api.anonymous();

    const get = await anonymous.get('/patients/1');
    const post = await anonymous.post('/patients', newPatient());
    const health = await anonymous.get('/health');

    expectStatus(get, 401, 'esperava 401 em GET /patients/1 sem credenciais');
    expectStatus(post, 401, 'esperava 401 em POST /patients sem credenciais');
    expectStatus(health, 200, 'esperava /health público (200) sem credenciais');
  });

  it('recusa com 401 senha errada e usuário desconhecido', async () => {
    const wrongPassword = await ctx.api.withCredentials(RECEPTIONIST.username, 'senha-errada').get('/patients/1');
    const unknownUser = await ctx.api.withCredentials('ninguem', 'qualquer').get('/patients/1');

    expectStatus(wrongPassword, 401, 'esperava 401 com senha errada');
    expectStatus(unknownUser, 401, 'esperava 401 com usuário desconhecido');
  });

  it('o profissional consulta pacientes, mas não cadastra, altera nem remove', async () => {
    const id = await createPatient(ctx.api);
    const professional = ctx.api.as(PROFESSIONAL);

    const get = await professional.get(`/patients/${id}`);
    const post = await professional.post('/patients', newPatient());
    const put = await professional.put(`/patients/${id}`, newPatient());
    const deleted = await professional.delete(`/patients/${id}`);

    expectStatus(get, 200, 'esperava 200 quando o profissional consulta um paciente');
    expectStatus(post, 403, 'esperava 403 quando o profissional tenta cadastrar paciente');
    expectStatus(put, 403, 'esperava 403 quando o profissional tenta alterar paciente');
    expectStatus(deleted, 403, 'esperava 403 quando o profissional tenta remover paciente');
    expect(get.header('Set-Cookie'), 'esperava uma API sem sessão: nenhum cookie na resposta').toBeUndefined();
  });

  it('a recepcionista agenda consultas, o profissional não', async () => {
    const patientId = await createPatient(ctx.api);
    const professionalId = await ctx.fixtures.professional();
    const monday = futureDate(MONDAY);

    const denied = await ctx.api
      .as(PROFESSIONAL)
      .post('/appointments', { patientId, professionalId, start: at(monday, '10:00'), end: at(monday, '10:30') });
    const allowed = await ctx.api
      .as(RECEPTIONIST)
      .post('/appointments', { patientId, professionalId, start: at(monday, '11:00'), end: at(monday, '11:30') });

    expectStatus(denied, 403, 'esperava 403 quando o profissional tenta agendar');
    expectStatus(allowed, 201, 'esperava 201 quando a recepcionista agenda');
  });
});
