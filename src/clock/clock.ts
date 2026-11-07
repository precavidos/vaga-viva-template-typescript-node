import type { DateTime } from 'luxon';

export const CLOCK = Symbol('CLOCK');

/**
 * Relógio da aplicação: devolve o momento atual no fuso da clínica.
 */
export interface Clock {
  now(): DateTime;
}
