import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    {
      provide: 'AiProvider',
      useClass: OpenAiProvider,
    },
  ],
  exports: [AiService, 'AiProvider'],
})
export class AiModule {}
