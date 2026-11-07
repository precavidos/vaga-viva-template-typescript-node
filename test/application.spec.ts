import { expectStatus } from './support/api.js';
import { useTestApp } from './support/test-app.js';

describe('Aplicação', () => {
  const ctx = useTestApp();

  it('sobe e responde em /health sem pedir credenciais', async () => {
    const response = await ctx.api.anonymous().get('/health');

    expectStatus(response, 200, 'esperava status 200 em GET /health');
    expect(response.body, `esperava {"status":"ok"}; ${response.describe()}`).toEqual({ status: 'ok' });
  });

  it('cria as tabelas de profissionais e consultas com a migração inicial', async () => {
    expect(await ctx.db.tableExists('professionals'), 'esperava a tabela professionals').toBe(true);
    expect(await ctx.db.tableExists('appointments'), 'esperava a tabela appointments').toBe(true);
    expect(await ctx.db.columns('appointments'), 'esperava as colunas da tabela appointments').toEqual(
      expect.arrayContaining(['id', 'professional_id', 'patient_id', 'starts_at', 'duration_minutes']),
    );
  });

  it('aceita consultas com pacientes que não estão cadastrados (appointments.patient_id sem chave estrangeira)', async () => {
    const professionalId = await ctx.fixtures.professional();

    await ctx.fixtures.appointment(professionalId, 999, '2030-03-04T10:00:00', 30);

    expect(await ctx.fixtures.countAppointments(), 'esperava a consulta gravada').toBe(1);
  });
});
