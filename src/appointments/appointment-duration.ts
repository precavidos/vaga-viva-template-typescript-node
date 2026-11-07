import type { DateTime } from 'luxon';

/**
 * Duração, em minutos, entre o início e o fim de uma consulta.
 */
export function appointmentDuration(start: DateTime, end: DateTime): number {
  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  return endMinutes - startMinutes;
}
