import { Global, Module } from '@nestjs/common';
import { DateTime } from 'luxon';
import { clinicConfig, type ClinicConfig } from '../config/clinic.config.js';
import { CLOCK, type Clock } from './clock.js';

@Global()
@Module({
  providers: [
    {
      provide: CLOCK,
      inject: [clinicConfig.KEY],
      useFactory: (config: ClinicConfig): Clock => ({
        now: () => DateTime.now().setZone(config.timeZone),
      }),
    },
  ],
  exports: [CLOCK],
})
export class ClockModule {}
