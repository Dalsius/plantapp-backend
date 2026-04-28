import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlantDto } from './dto/create-plant.dto';

@Injectable()
export class PlantsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreatePlantDto) {
    return this.prisma.plant.create({
      data: { ...dto, userId },
    });
  }

  async findAll(userId: number) {
    return this.prisma.plant.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    const plant = await this.prisma.plant.findFirst({ where: { id, userId } });
    if (!plant) throw new NotFoundException('Planta no encontrada');
    return plant;
  }

  async water(id: number, userId: number) {
    await this.findOne(id, userId);
    return this.prisma.plant.update({
      where: { id },
      data: { lastWatered: new Date() },
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    return this.prisma.plant.delete({ where: { id } });
  }
}
