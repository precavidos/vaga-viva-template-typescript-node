import { expectStatus, type Api } from './api.js';

export interface PatientData {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
}

let sequence = 0;

/** Paciente fictício, com e-mail em example.com. */
export function newPatient(): PatientData {
  sequence += 1;
  return {
    name: `Paciente Teste ${sequence}`,
    email: `paciente${sequence}@example.com`,
    phone: `+55 11 90000-${String(sequence % 10000).padStart(4, '0')}`,
    birthDate: '1990-05-17',
  };
}

/** Cadastra um paciente pela API da missão patients-api e devolve o id. */
export async function createPatient(api: Api, patient: PatientData = newPatient()): Promise<number> {
  const response = await api.post('/patients', patient);
  expectStatus(response, 201, 'esperava status 201 ao cadastrar um paciente em POST /patients (missão patients-api)');
  const id = response.json('id');
  expect(typeof id, `esperava o campo 'id' numérico na resposta de POST /patients; ${response.describe()}`).toBe('number');
  return id as number;
}
