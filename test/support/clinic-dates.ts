import { DateTime } from 'luxon';

export const CLINIC_ZONE = 'America/Sao_Paulo';

export const MONDAY = 1;
export const TUESDAY = 2;
export const WEDNESDAY = 3;
export const THURSDAY = 4;
export const FRIDAY = 5;
export const SATURDAY = 6;
export const SUNDAY = 7;

/**
 * Datas relativas ao relógio real, no fuso da clínica. Datas no formato `AAAA-MM-DD` e datas e horas locais no
 * formato `AAAA-MM-DDTHH:mm:ss`, sem fuso.
 */
function today(): DateTime {
  return DateTime.now().setZone(CLINIC_ZONE).startOf('day');
}

/** Primeiro dia da semana pedido (1 = segunda, 7 = domingo) que esteja pelo menos 7 dias no futuro. */
export function futureDate(weekday: number): string {
  const base = today().plus({ days: 7 });
  return base.plus({ days: (weekday - base.weekday + 7) % 7 }).toISODate()!;
}

/** Dia da semana pedido, pelo menos 7 dias no passado. */
export function pastDate(weekday: number): string {
  const base = today().minus({ days: 7 });
  return base.minus({ days: (base.weekday - weekday + 7) % 7 }).toISODate()!;
}

export function plusDays(date: string, days: number): string {
  return DateTime.fromISO(date, { zone: 'utc' }).plus({ days }).toISODate()!;
}

export function at(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function plusMinutes(dateTime: string, minutes: number): string {
  return DateTime.fromISO(dateTime, { zone: 'utc' }).plus({ minutes }).toFormat("yyyy-MM-dd'T'HH:mm:ss");
}

/**
 * Normaliza uma data e hora da resposta da API para `AAAA-MM-DDTHH:mm:ss`, para comparar com o valor esperado. Devolve
 * o valor original quando ele não é uma data e hora ISO, para o teste falhar com uma mensagem clara.
 */
export function localDateTime(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const parsed = DateTime.fromISO(value, { zone: 'utc', setZone: true });
  return parsed.isValid ? parsed.toFormat("yyyy-MM-dd'T'HH:mm:ss") : value;
}
