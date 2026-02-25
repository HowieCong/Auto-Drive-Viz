import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

export default async function (req, res) {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for client access
  await app.init();

  const instance = app.getHttpAdapter().getInstance();
  return instance(req, res);
}