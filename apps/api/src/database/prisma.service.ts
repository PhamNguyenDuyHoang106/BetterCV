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

  async onModuleInit() {
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
