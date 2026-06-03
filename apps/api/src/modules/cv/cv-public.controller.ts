import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('cvs')
export class CvPublicController {
  @Get('thumbnails/:id.webp')
  async getThumbnail(@Param('id') id: string, @Res() res: Response) {
    // Path traversal protection: ensure id is strictly alphanumeric with optional dashes/underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new BadRequestException('Invalid thumbnail ID format');
    }

    const filePath = path.join(
      process.cwd(),
      'storage',
      'thumbnails',
      `${id}.webp`,
    );
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Thumbnail not found');
    }
    res.setHeader('Content-Type', 'image/webp');
    fs.createReadStream(filePath).pipe(res);
  }
}
