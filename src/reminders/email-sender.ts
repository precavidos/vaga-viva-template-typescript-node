import { Injectable, Logger } from '@nestjs/common';

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface EmailSender {
  send(to: string, subject: string, body: string): Promise<void>;
}

@Injectable()
export class LoggingEmailSender implements EmailSender {
  private readonly logger = new Logger(LoggingEmailSender.name);

  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`E-mail para ${to}: ${subject} - ${body}`);
  }
}
