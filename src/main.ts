import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ZodValidationPipe } from './common/zod-validation.pipe';

function trustedProxyHops(): number {
  const configured = process.env.TRUST_PROXY_HOPS;
  if (!configured) return 0;

  const hops = Number(configured);
  if (!Number.isInteger(hops) || hops < 0) {
    // Refusing to start beats starting with rate limiting quietly disabled.
    throw new Error(
      `TRUST_PROXY_HOPS must be a non-negative integer, got "${configured}"`,
    );
  }
  return hops;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const hops = trustedProxyHops();
  if (hops > 0) app.set('trust proxy', hops);

  app.use(cookieParser());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(new ZodValidationPipe());
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
