import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiUsageService } from './ai-usage.service';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    AiUsageService,
    {
      provide: 'AiProvider',
      useClass: OpenAiProvider,
    },
  ],
  exports: [AiService, AiUsageService, 'AiProvider'],
})
export class AiModule {}
