import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

const app = configureApp(await NestFactory.create(AppModule));
await app.listen(Number(process.env.PORT ?? 8080));
