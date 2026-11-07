import type { DateTime } from 'luxon';

export const REMINDER_CHANNELS = ['EMAIL', 'SMS'] as const;

export type ReminderChannel = (typeof REMINDER_CHANNELS)[number];

export interface Reminder {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  professionalName: string;
  start: DateTime;
}
