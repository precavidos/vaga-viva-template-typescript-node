import { DateTime } from 'luxon';
import { expectStatus, type ApiResponse } from '../support/api.js';
import { describeMission } from '../support/missions.js';
import { createPatient, newPatient } from '../support/patients.js';
import { useTestApp } from '../support/test-app.js';

/** Trechos das mensagens padrão, em inglês, do NestJS, do class-validator e do parser de JSON. */
const ENGLISH_DEFAULT_MESSAGE = /\b(should|must|Bad Request|Unexpected|Expected|is not|invalid|required|failed)\b/i;

function expectPortuguese(message: unknown, description: string): void {
  expect(typeof message, description).toBe('string');
  expect(String(message).trim(), description).not.toBe('');
  expect(String(message), description).not.toMatch(ENGLISH_DEFAULT_MESSAGE);
}

function expectProblem(response: ApiResponse): void {
  expectStatus(response, 400, 'esperava status 400 para dados inválidos');
  expect(
    response.contentType,
    `esperava Content-Type application/problem+json (Problem Details, RFC 9457); ${response.describe()}`,
  ).toMatch(/^application\/problem\+json/);
  expect(response.json('status'), "esperava o campo 'status' igual a 400 no corpo do erro").toBe(400);
  expect(typeof response.json('title'), "esperava o campo 'title' no corpo do erro").toBe('string');
  expectPortuguese(response.json('detail'), `esperava o campo 'detail', em português, no corpo do erro; ${response.describe()}`);
}

function expectValidationProblem(response: ApiResponse, ...fields: string[]): void {
  expectProblem(response);
  const errors = response.json('errors');
  expect(
    Array.isArray(errors) && errors.length > 0,
    `esperava a lista 'errors' com um item {field, message} por campo inválido; ${response.describe()}`,
  ).toBe(true);
  const items = errors as Array<{ field?: unknown; message?: unknown }>;
  expect(items.map((error) => error.field), `esperava erros para os campos ${fields.join(', ')}; ${response.describe()}`).toEqual(
    expect.arrayContaining(fields),
  );
  for (const error of items) {
    expectPortuguese(error.message, `esperava uma mensagem clara, em português, para o campo ${String(error.field)}`);
  }
}

describeMission('input-validation', 'validação e mensagens de erro', () => {
  const ctx = useTestApp();

  it('recusa paciente sem nome com 400 e Problem Details apontando o campo', async () => {
    const response = await ctx.api.post('/patients', { ...newPatient(), name: ' ' });

    expectValidationProblem(response, 'name');
  });

  it('recusa e-mail inválido', async () => {
    const response = await ctx.api.post('/patients', { ...newPatient(), email: 'nao-e-um-email' });

    expectValidationProblem(response, 'email');
  });

  it('recusa data de nascimento no futuro', async () => {
    const nextYear = DateTime.now().plus({ years: 1 }).toISODate();

    const response = await ctx.api.post('/patients', { ...newPatient(), birthDate: nextYear });

    expectValidationProblem(response, 'birthDate');
  });

  it('aponta todos os campos obrigatórios que faltam de uma vez', async () => {
    const response = await ctx.api.post('/patients', {});

    expectValidationProblem(response, 'name', 'email', 'phone', 'birthDate');
  });

  it('valida também a alteração de um paciente', async () => {
    const id = await createPatient(ctx.api);

    const response = await ctx.api.put(`/patients/${id}`, { ...newPatient(), name: '' });

    expectValidationProblem(response, 'name');
  });

  it('recusa JSON malformado com 400 e Problem Details', async () => {
    const response = await ctx.api.post('/patients', '{"name": ');

    expectProblem(response);
  });
});
