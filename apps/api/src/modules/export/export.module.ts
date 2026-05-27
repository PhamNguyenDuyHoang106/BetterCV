import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [CvModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
