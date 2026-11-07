import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

export const DEFAULT_DATABASE_URL = 'postgresql://clinic:clinic@localhost:5432/clinic';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(config: ConfigService) {
    super({ adapter: new PrismaPg({ connectionString: config.get<string>('DATABASE_URL', DEFAULT_DATABASE_URL) }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
