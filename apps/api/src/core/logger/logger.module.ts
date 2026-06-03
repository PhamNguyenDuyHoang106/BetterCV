import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';
import { hostname } from 'os';
import { RequestContextStore } from '../context/request-context.store';

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

            // ── Mixin: Inject requestId and hashes dynamically from context store ──
            mixin() {
              const store = RequestContextStore.getStore();
              if (store) {
                const props: Record<string, any> = {
                  requestId: store.requestId,
                };
                if (store.userHash) props.userHash = store.userHash;
                if (store.tenantHash) props.tenantHash = store.tenantHash;
                if (store.ipHash) props.ipHash = store.ipHash;
                return props;
              }
              return {};
            },

            // ── Echo the request ID back in response headers ──
            customProps(req: IncomingMessage) {
              return {
                requestId: (req as any).id,
              };
            },

            // ── Base metadata from CI/CD ──
            base: {
              pid: process.pid,
              hostname: hostname(),
              service: config.get<string>('SERVICE_NAME', 'bettercv-api'),
              environment: config.get<string>('NODE_ENV', 'development'),
              version: config.get<string>(
                'APP_VERSION',
                process.env.npm_package_version || '0.1.0',
              ),
              deploymentId: config.get<string>('DEPLOYMENT_ID', 'local-dev'),
              gitSha: config.get<string>('GIT_SHA', 'local'),
            },

            // ── Redact sensitive data from logs ──
            redact: {
              paths: [
                // HTTP headers
                'req.headers.authorization',
                'req.headers.cookie',
                // Request body fields (CV content)
                '*.jobDescription',
                '*.resumeText',
                '*.fullResumeText',
                '*.coverLetter',
                '*.personalStatement',
                // Auth & PII fields
                '*.email',
                '*.password',
                '*.passwordHash',
                '*.accessToken',
                '*.refreshToken',
                '*.phone',
                // Nested user object
                '*.user.email',
                '*.user.phone',
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
