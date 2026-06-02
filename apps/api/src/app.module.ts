import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database';
import { RolesGuard } from './core/guards';
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

import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from './database/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
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
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
