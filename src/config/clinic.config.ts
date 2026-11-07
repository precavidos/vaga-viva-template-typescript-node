import { registerAs, type ConfigType } from '@nestjs/config';

export const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/**
 * Horário de funcionamento e fuso da clínica, lidos das variáveis de ambiente.
 */
export const clinicConfig = registerAs('clinic', () => ({
  timeZone: process.env.CLINIC_TIME_ZONE ?? 'America/Sao_Paulo',
  openingDays: parseWeekdays(process.env.CLINIC_OPENING_DAYS ?? 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY'),
  opensAt: process.env.CLINIC_OPENS_AT ?? '08:00',
  closesAt: process.env.CLINIC_CLOSES_AT ?? '18:00',
}));

export type ClinicConfig = ConfigType<typeof clinicConfig>;

function parseWeekdays(value: string): Weekday[] {
  return value.split(',').map((day) => {
    const weekday = day.trim().toUpperCase();
    if (!WEEKDAYS.includes(weekday as Weekday)) {
      throw new Error(`CLINIC_OPENING_DAYS: dia da semana desconhecido '${day}'. Use ${WEEKDAYS.join(', ')}.`);
    }
    return weekday as Weekday;
  });
}
