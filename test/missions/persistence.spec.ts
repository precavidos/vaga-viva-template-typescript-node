import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expectStatus } from '../support/api.js';
import { describeMission, PROJECT_ROOT } from '../support/missions.js';
import { createPatient, newPatient, type PatientData } from '../support/patients.js';
import { useTestApp } from '../support/test-app.js';

const INITIAL_MIGRATION = '20261106000000_init';

describeMission('persistence', 'pacientes no banco de dados', () => {
  const ctx = useTestApp();

  async function expectPatientsTable(): Promise<void> {
    expect(
      await ctx.db.tableExists('patients'),
      'esperava a tabela patients no PostgreSQL, criada por uma migração nova em prisma/migrations',
    ).toBe(true);
  }

  it('cria a tabela patients com uma migração do Prisma, a partir de um modelo Patient no schema.prisma', async () => {
    await expectPatientsTable();
    expect(await ctx.db.columns('patients'), 'esperava as colunas id, name, email, phone e birth_date na tabela patients').toEqual(
      expect.arrayContaining(['id', 'name', 'email', 'phone', 'birth_date']),
    );
    const [row] = await ctx.db.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL AND migration_name <> $1',
      [INITIAL_MIGRATION],
    );
    expect(row?.count, `esperava uma migração nova do Prisma em prisma/migrations, além da ${INITIAL_MIGRATION}`).toBeGreaterThan(0);
    const schemaFile = path.join(PROJECT_ROOT, 'prisma', 'schema.prisma');
    const schema = existsSync(schemaFile) ? readFileSync(schemaFile, 'utf8') : '';
    expect(schema, 'esperava em prisma/schema.prisma um modelo Patient ligado à tabela patients').toMatch(
      /model\s+Patient\s*\{[^}]*@@map\(\s*"patients"\s*\)/,
    );
  });

  it('grava na tabela patients o paciente cadastrado pela API', async () => {
    await expectPatientsTable();
    const patient = newPatient();

    const id = await createPatient(ctx.api, patient);

    const rows = await ctx.db.query(
      'SELECT name, email, phone, birth_date::text AS birth_date FROM patients WHERE id = $1',
      [id],
    );
    expect(rows, `esperava encontrar na tabela patients a linha com id ${id}`).toHaveLength(1);
    expect(rows[0], 'esperava os dados do paciente nas colunas da tabela patients').toEqual({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      birth_date: patient.birthDate,
    });
  });

  it('lê do banco: um paciente inserido direto na tabela aparece na API', async () => {
    await expectPatientsTable();
    const [row] = await ctx.db.query<{ id: number }>(
      `INSERT INTO patients (name, email, phone, birth_date)
       VALUES ('Paciente Do Banco', 'banco@example.com', '+55 11 90000-9999', DATE '1970-12-01')
       RETURNING id`,
    );

    const response = await ctx.api.get(`/patients/${row!.id}`);

    expectStatus(response, 200, 'esperava status 200 ao buscar pela API um paciente gravado no banco');
    expect(response.json('name'), 'esperava o nome que está no banco').toBe('Paciente Do Banco');
    expect(response.json('birthDate'), 'esperava a data de nascimento que está no banco').toBe('1970-12-01');
  });

  it('altera e remove o paciente no banco quando a API altera e remove', async () => {
    await expectPatientsTable();
    const id = await createPatient(ctx.api);
    const changed: PatientData = {
      name: 'Nome Novo No Banco',
      email: `novo${id}@example.com`,
      phone: '+55 31 97777-0000',
      birthDate: '2001-07-07',
    };

    await ctx.api.put(`/patients/${id}`, changed);
    const [updated] = await ctx.db.query<{ name: string }>('SELECT name FROM patients WHERE id = $1', [id]);
    await ctx.api.delete(`/patients/${id}`);
    const [remaining] = await ctx.db.query<{ count: number }>('SELECT count(*)::int AS count FROM patients WHERE id = $1', [id]);

    expect(updated?.name, 'esperava o nome alterado pela API na tabela patients').toBe(changed.name);
    expect(remaining?.count, 'esperava que o paciente removido pela API saísse da tabela patients').toBe(0);
  });
});
