import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.FRONTEND_URL
    ?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return Array.from(
    new Set([
      ...(configuredOrigins ?? []),
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ]),
  );
}

export function configureApp(app: INestApplication): void {
  app.use(cookieParser());

  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
