import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';
import { EMAIL_SENDER } from '../../src/reminders/email-sender.js';
import { SMS_SENDER } from '../../src/reminders/sms-sender.js';
import { Api } from './api.js';
import { Database } from './database.js';
import { Fixtures } from './fixtures.js';
import { RecordingEmailSender, RecordingSmsSender } from './recording-senders.js';

export interface TestContext {
  readonly app: INestApplication;
  readonly api: Api;
  readonly db: Database;
  readonly fixtures: Fixtures;
  readonly emails: RecordingEmailSender;
  readonly sms: RecordingSmsSender;
}

/**
 * Sobe a aplicação uma vez por arquivo de teste, com os envios de e-mail e SMS trocados por fakes. Antes de cada
 * teste, todas as tabelas são esvaziadas.
 */
export function useTestApp(): TestContext {
  const emails = new RecordingEmailSender();
  const sms = new RecordingSmsSender();
  let app: INestApplication | undefined;
  let db: Database | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EMAIL_SENDER)
      .useValue(emails)
      .overrideProvider(SMS_SENDER)
      .useValue(sms)
      .compile();
    app = configureApp(moduleRef.createNestApplication({ logger: ['error', 'warn'] }));
    await app.init();
    db = new Database();
  });

  beforeEach(async () => {
    await required(db).reset();
    emails.clear();
    sms.clear();
  });

  afterAll(async () => {
    await app?.close();
    await db?.close();
  });

  return {
    get app() {
      return required(app);
    },
    get api() {
      return new Api(required(app).getHttpServer());
    },
    get db() {
      return required(db);
    },
    get fixtures() {
      return new Fixtures(required(db));
    },
    emails,
    sms,
  };
}

function required<T>(value: T | undefined): T {
  if (value === undefined) {
    throw new Error('A aplicação de teste ainda não subiu (useTestApp precisa ser chamado dentro do describe).');
  }
  return value;
}
