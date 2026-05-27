import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
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
import { RequestIdMiddleware } from './core/middleware/request-id.middleware';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
