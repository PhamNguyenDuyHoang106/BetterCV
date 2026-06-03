import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    // Bridge query events to Pino
    (this as any).$on('query', (e: any) => {
      const isProductionOrStaging =
        process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'staging';

      const params = isProductionOrStaging ? '[REDACTED]' : e.params;

      this.logger.log({
        msg: 'Prisma Query Executed',
        module: 'PrismaService',
        event: 'database_query',
        query: e.query,
        params,
        durationMs: e.duration,
      });
    });

    // Bridge info events
    (this as any).$on('info', (e: any) => {
      this.logger.log({
        msg: e.message,
        module: 'PrismaService',
        event: 'database_info',
      });
    });

    // Bridge warn events
    (this as any).$on('warn', (e: any) => {
      this.logger.warn({
        msg: e.message,
        module: 'PrismaService',
        event: 'database_warn',
      });
    });

    // Bridge error events
    (this as any).$on('error', (e: any) => {
      this.logger.error({
        msg: e.message,
        module: 'PrismaService',
        event: 'database_query_failed',
      });
    });

    try {
      await this.$connect();
      this.logger.log('Connected to database');
    } catch (err) {
      this.logger.error(
        `Failed to connect to database during bootstrap: ${(err as Error).message}`,
      );
      // Allow NestJS boot to continue so that health check endpoints can serve the actual down status
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }
}
