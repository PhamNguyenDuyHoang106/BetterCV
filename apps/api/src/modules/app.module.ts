import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { CvModule } from "./cv/cv.module";
import { TemplateModule } from "./template/template.module";
import { AiModule } from "./ai/ai.module";
import { BillingModule } from "./billing/billing.module";
import { HealthModule } from "./health/health.module";
import { ExportModule } from "./export/export.module";
import { ShareModule } from "./share/share.module";
import { RolesGuard } from "./auth/roles.guard";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UserModule,
    CvModule,
    TemplateModule,
    AiModule,
    BillingModule,
    HealthModule,
    ExportModule,
    ShareModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
