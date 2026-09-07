import { NestFactory } from '@nestjs/core';
import { configureApp } from './app-bootstrap.js';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
