import { Global, Module } from '@nestjs/common';
import { EMAIL_SENDER, LoggingEmailSender } from './email-sender.js';
import { REMINDER_STRATEGIES, type ReminderStrategy } from './reminder-strategy.js';
import { LoggingSmsSender, SMS_SENDER } from './sms-sender.js';

const strategies: ReminderStrategy[] = [];

@Global()
@Module({
  providers: [
    { provide: EMAIL_SENDER, useClass: LoggingEmailSender },
    { provide: SMS_SENDER, useClass: LoggingSmsSender },
    { provide: REMINDER_STRATEGIES, useValue: strategies },
  ],
  exports: [EMAIL_SENDER, SMS_SENDER, REMINDER_STRATEGIES],
})
export class RemindersModule {}
