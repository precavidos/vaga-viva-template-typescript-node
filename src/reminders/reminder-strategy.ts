import type { Reminder, ReminderChannel } from './reminder.js';

/** Token da lista de estratégias de lembrete (`ReminderStrategy[]`). */
export const REMINDER_STRATEGIES = Symbol('REMINDER_STRATEGIES');

export interface ReminderStrategy {
  readonly channel: ReminderChannel;
  send(reminder: Reminder): Promise<void>;
}
