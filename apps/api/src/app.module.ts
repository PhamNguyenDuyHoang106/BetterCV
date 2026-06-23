import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogInterceptor } from './core/interceptors/audit-log.interceptor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database';
import { CustomThrottlerGuard } from './core/guards';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CvModule } from './modules/cv/cv.module';
import { TemplateModule } from './modules/template/template.module';
import { AiModule } from './modules/ai/ai.module';
import { BillingModule } from './modules/billing/billing.module';
import { HealthModule } from './modules/health/health.module';
import { ExportModule } from './modules/export/export.module';
import { ShareModule } from './modules/share/share.module';
import { AtsModule } from './modules/ats/ats.module';
import { OcrModule } from './modules/ocr/ocr.module';
import { AppController } from './app.controller';
import { CoreModule } from './core/core.module';
import { LoggerModule } from './core/logger/logger.module';
import { AuditModule } from './modules/audit/audit.module';

import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './database/redis/redis.module';
import { RedisService } from './database/redis/redis.service';

import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardAuthMiddleware } from './core/middleware/bull-board-auth.middleware';
import { RequestContextMiddleware } from './core/middleware/request-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      inject: [ConfigService, RedisService],
      useFactory: (config: ConfigService, redisService: RedisService) => ({
        throttlers: [
          {
            name: 'global',
            ttl: 60000,
            limit: 300,
          },
          {
            name: 'ats',
            ttl: 60000,
            limit: 5,
          },
        ],
        storage: redisService.getClient()
          ? new ThrottlerStorageRedisService(redisService.getClient()!)
          : undefined,
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          enableOfflineQueue: false,
        },
      }),
      inject: [ConfigService],
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'thumbnail-queue',
      adapter: BullMQAdapter,
    }),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UserModule,
    CvModule,
    TemplateModule,
    AiModule,
    BillingModule,
    HealthModule,
    ExportModule,
    ShareModule,
    AtsModule,
    OcrModule,
    CoreModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
    consumer.apply(BullBoardAuthMiddleware).forRoutes('/admin/queues');
  }
}
