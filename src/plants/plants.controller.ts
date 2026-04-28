import {
  Controller, Get, Post, Delete, Param, Body,
  UseGuards, Request, UseInterceptors, UploadedFile, Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PlantsService } from './plants.service';
import { AiService } from '../ai/ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { v2 as cloudinary } from 'cloudinary';

@Controller('plants')
@UseGuards(JwtAuthGuard)
export class PlantsController {
  constructor(
    private plantsService: PlantsService,
    private aiService: AiService,
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // POST /api/plants/identify — sube foto, identifica con IA y guarda
  @Post('identify')
  @UseInterceptors(FileInterceptor('photo'))
  async identifyAndSave(@UploadedFile() file: Express.Multer.File, @Request() req) {
    // 1. Identificar con Claude
    const base64 = file.buffer.toString('base64');
    const mediaType = file.mimetype as 'image/jpeg' | 'image/png';
    const analysis = await this.aiService.identifyPlant(base64, mediaType);

    // 2. Subir imagen a Cloudinary
    const uploaded = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'plantapp', resource_type: 'image' },
        (err, result) => (err ? reject(err) : resolve(result as { secure_url: string })),
      ).end(file.buffer);
    });

    // 3. Guardar en DB
    return this.plantsService.create(req.user.id, {
      ...analysis,
      imageUrl: uploaded.secure_url,
    });
  }

  // GET /api/plants — mi colección
  @Get()
  findAll(@Request() req) {
    return this.plantsService.findAll(req.user.id);
  }

  // GET /api/plants/:id
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.plantsService.findOne(+id, req.user.id);
  }

  // PATCH /api/plants/:id/water — registrar riego
  @Patch(':id/water')
  water(@Param('id') id: string, @Request() req) {
    return this.plantsService.water(+id, req.user.id);
  }

  // DELETE /api/plants/:id
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.plantsService.remove(+id, req.user.id);
  }
}
