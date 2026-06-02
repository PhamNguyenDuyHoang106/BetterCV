import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        return {
          pinoHttp: {
            // ── Request ID: reuse pino-http native mechanism ──
            genReqId(req: IncomingMessage, res: ServerResponse) {
              // Node.js headers can be string | string[] | undefined
              const raw = req.headers['x-request-id'];
              let reqId: string;

              if (Array.isArray(raw)) {
                reqId = raw[0];
              } else if (typeof raw === 'string' && raw.length > 0) {
                reqId = raw;
              } else {
                reqId = randomUUID();
              }

              // Echo the request ID in the response header immediately
              res.setHeader('x-request-id', reqId);
              return reqId;
            },

            // ── Echo the request ID back in response headers ──
            customProps(req: IncomingMessage) {
              return {
                requestId: (req as any).id,
              };
            },

            // ── Redact sensitive data from logs ──
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                '*.jobDescription',
                '*.resumeText',
                '*.fullResumeText',
              ],
              censor: '[REDACTED]',
            },

            // ── Transport: pretty-print in dev, JSON in production ──
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    singleLine: false,
                    translateTime: 'SYS:HH:MM:ss.l',
                    ignore: 'pid,hostname',
                  },
                },

            // ── Log level ──
            level: isProduction ? 'info' : 'debug',

            // ── Suppress logging for health endpoints to reduce noise ──
            autoLogging: {
              ignore(req: IncomingMessage) {
                const url = req.url || '';
                return url.startsWith('/api/health');
              },
            },
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
