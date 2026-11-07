import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClockModule } from './clock/clock.module.js';
import { clinicConfig } from './config/clinic.config.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RemindersModule } from './reminders/reminders.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [clinicConfig] }),
    PrismaModule,
    ClockModule,
    RemindersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
