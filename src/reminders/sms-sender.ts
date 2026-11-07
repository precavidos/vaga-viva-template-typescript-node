import { Injectable, Logger } from '@nestjs/common';

export const SMS_SENDER = Symbol('SMS_SENDER');

export interface SmsSender {
  send(phone: string, text: string): Promise<void>;
}

@Injectable()
export class LoggingSmsSender implements SmsSender {
  private readonly logger = new Logger(LoggingSmsSender.name);

  async send(phone: string, text: string): Promise<void> {
    this.logger.log(`SMS para ${phone}: ${text}`);
  }
}
