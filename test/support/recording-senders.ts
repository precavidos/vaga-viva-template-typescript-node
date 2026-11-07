import type { EmailSender } from '../../src/reminders/email-sender.js';
import type { SmsSender } from '../../src/reminders/sms-sender.js';

export interface SentEmail {
  to: string;
  subject: string;
  body: string;
}

export interface SentSms {
  phone: string;
  text: string;
}

/** Substitui o `EmailSender` nos testes e guarda o que foi enviado. */
export class RecordingEmailSender implements EmailSender {
  readonly sent: SentEmail[] = [];

  async send(to: string, subject: string, body: string): Promise<void> {
    this.sent.push({ to, subject, body });
  }

  clear(): void {
    this.sent.length = 0;
  }
}

/** Substitui o `SmsSender` nos testes e guarda o que foi enviado. */
export class RecordingSmsSender implements SmsSender {
  readonly sent: SentSms[] = [];

  async send(phone: string, text: string): Promise<void> {
    this.sent.push({ phone, text });
  }

  clear(): void {
    this.sent.length = 0;
  }
}
