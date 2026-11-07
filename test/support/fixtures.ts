import type { Database } from './database.js';

/**
 * Dados inseridos direto no banco, nas tabelas que o código inicial já cria.
 */
export class Fixtures {
  constructor(private readonly db: Database) {}

  async professional(name = 'Dra. Helena Prado', specialty = 'Clínica geral'): Promise<number> {
    const [row] = await this.db.query<{ id: number }>(
      'INSERT INTO professionals (name, specialty) VALUES ($1, $2) RETURNING id',
      [name, specialty],
    );
    return row!.id;
  }

  /** `start` é uma data e hora local, no formato `AAAA-MM-DDTHH:mm:ss`. */
  async appointment(professionalId: number, patientId: number, start: string, durationMinutes: number): Promise<number> {
    const [row] = await this.db.query<{ id: number }>(
      `INSERT INTO appointments (professional_id, patient_id, starts_at, duration_minutes)
       VALUES ($1, $2, $3::timestamp, $4) RETURNING id`,
      [professionalId, patientId, start, durationMinutes],
    );
    return row!.id;
  }

  async countAppointments(): Promise<number> {
    const [row] = await this.db.query<{ count: number }>('SELECT count(*)::int AS count FROM appointments');
    return row!.count;
  }
}
