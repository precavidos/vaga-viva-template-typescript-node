import { expectStatus } from '../support/api.js';
import { describeMission } from '../support/missions.js';
import { createPatient, newPatient, type PatientData } from '../support/patients.js';
import { useTestApp } from '../support/test-app.js';

describeMission('patients-api', 'cadastro de pacientes', () => {
  const ctx = useTestApp();

  it('cadastra um paciente e devolve 201, o cabeçalho Location e os dados com o id', async () => {
    const patient = newPatient();

    const response = await ctx.api.post('/patients', patient);

    expectStatus(response, 201, 'esperava status 201 em POST /patients');
    const id = response.json('id');
    expect(typeof id, `esperava o campo 'id' numérico na resposta; ${response.describe()}`).toBe('number');
    expect(response.header('Location') ?? '', 'esperava o cabeçalho Location apontando para /patients/{id}').toMatch(
      new RegExp(`/patients/${String(id)}$`),
    );
    expect(response.json('name'), "esperava o campo 'name' na resposta").toBe(patient.name);
    expect(response.json('email'), "esperava o campo 'email' na resposta").toBe(patient.email);
    expect(response.json('phone'), "esperava o campo 'phone' na resposta").toBe(patient.phone);
    expect(response.json('birthDate'), "esperava o campo 'birthDate' (AAAA-MM-DD) na resposta").toBe(patient.birthDate);
  });

  it('busca um paciente cadastrado pelo id', async () => {
    const patient = newPatient();
    const id = await createPatient(ctx.api, patient);

    const response = await ctx.api.get(`/patients/${id}`);

    expectStatus(response, 200, `esperava status 200 em GET /patients/${id}`);
    expect(response.json('id'), 'esperava o mesmo id na resposta').toBe(id);
    expect(response.json('name'), 'esperava o nome cadastrado').toBe(patient.name);
    expect(response.json('email'), 'esperava o e-mail cadastrado').toBe(patient.email);
  });

  it('altera os dados de um paciente', async () => {
    const id = await createPatient(ctx.api);
    const changed: PatientData = {
      name: 'Paciente Alterado',
      email: `alterado${id}@example.com`,
      phone: '+55 21 98888-0000',
      birthDate: '1985-01-30',
    };

    const update = await ctx.api.put(`/patients/${id}`, changed);

    expectStatus(update, 200, `esperava status 200 em PUT /patients/${id}`);
    expect(update.json('name'), 'esperava o nome novo na resposta do PUT').toBe(changed.name);
    const found = await ctx.api.get(`/patients/${id}`);
    expect(found.json('name'), `esperava o nome novo ao buscar o paciente; ${found.describe()}`).toBe(changed.name);
    expect(found.json('email'), 'esperava o e-mail novo ao buscar o paciente').toBe(changed.email);
    expect(found.json('phone'), 'esperava o telefone novo ao buscar o paciente').toBe(changed.phone);
    expect(found.json('birthDate'), 'esperava a data de nascimento nova ao buscar o paciente').toBe(changed.birthDate);
  });

  it('remove um paciente, que deixa de ser encontrado', async () => {
    const id = await createPatient(ctx.api);

    const deleted = await ctx.api.delete(`/patients/${id}`);

    expectStatus(deleted, 204, `esperava status 204 em DELETE /patients/${id}`);
    const found = await ctx.api.get(`/patients/${id}`);
    expectStatus(found, 404, 'esperava status 404 ao buscar um paciente removido');
  });

  it('responde 404 ao alterar ou remover um paciente que não existe', async () => {
    const id = await createPatient(ctx.api);
    await ctx.api.delete(`/patients/${id}`);

    const update = await ctx.api.put(`/patients/${id}`, newPatient());
    const deleted = await ctx.api.delete(`/patients/${id}`);

    expectStatus(update, 404, 'esperava status 404 ao alterar um paciente removido');
    expectStatus(deleted, 404, 'esperava status 404 ao remover de novo um paciente');
  });
});
