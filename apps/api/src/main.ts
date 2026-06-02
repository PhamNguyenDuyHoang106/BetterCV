import { ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { Logger } from 'nestjs-pino';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';
import { SentryExceptionFilter } from './core/filters/sentry-exception.filter';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Disable the default NestJS logger; pino-http handles it
    bufferLogs: true,
  });

  // ── Use Pino as the global NestJS logger ──
  app.useLogger(app.get(Logger));

  // ── Initialize Sentry ──
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    const nodeEnv = process.env.NODE_ENV || 'development';
    Sentry.init({
      dsn: sentryDsn,
      environment: nodeEnv,
      release: process.env.npm_package_version || '0.1.0',
      // Sampling: 5% in production, 100% in dev
      tracesSampleRate: nodeEnv === 'production' ? 0.05 : 1.0,
      // Attach commit SHA for deployment tracking
      initialScope: {
        tags: {
          commitSha: process.env.COMMIT_SHA || 'unknown',
        },
      },
      // Scrub sensitive data before sending to Sentry
      beforeSend(event) {
        if (event.request?.data) {
          const data = event.request.data as Record<string, unknown>;
          const sensitiveKeys = [
            'jobDescription',
            'resumeText',
            'fullResumeText',
            'coverLetter',
            'personalStatement',
          ];
          for (const key of sensitiveKeys) {
            if (key in data) {
              data[key] = '[REDACTED]';
            }
          }
        }
        // Strip authorization header
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      },
    });
  }

  // CORS — allow frontend origin
  app.enableCors({
    origin: process.env.APP_PUBLIC_URL ?? 'http://localhost:3000',
    credentials: true,
    exposedHeaders: ['x-request-id'],
  });

  // Stripe webhook needs raw body — must be registered BEFORE global pipes
  app.use('/api/billing/webhook', bodyParser.raw({ type: 'application/json' }));

  // Global pipes, filters, interceptors
  const reflector = app.get(Reflector);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new SentryExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(reflector));

  app.setGlobalPrefix('api');

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`🚀 API running on http://localhost:${port}/api`);
}

bootstrap();
