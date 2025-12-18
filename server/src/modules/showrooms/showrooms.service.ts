import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShowroomDto, UpdateShowroomDto } from './dto/showrooms.dto';

@Injectable()
export class ShowroomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: { city?: string; isActive?: boolean }) {
    return this.prisma.showroom.findMany({
      where: {
        city: filters?.city,
        isActive: filters?.isActive ?? true,
      },
      include: {
        _count: {
          select: {
            carUnits: true,
            users: true,
            bookings: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const showroom = await this.prisma.showroom.findUnique({
      where: { id },
      include: {
        carUnits: {
          include: {
            carModel: true,
          },
        },
        users: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!showroom) {
      throw new NotFoundException('Showroom not found');
    }

    return showroom;
  }

  async create(dto: CreateShowroomDto) {
    return this.prisma.showroom.create({
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
        email: dto.email,
        operatingHours: dto.operatingHours as object[],
        isActive: true,
      },
    });
  }

  async update(id: string, dto: UpdateShowroomDto) {
    await this.findById(id);

    return this.prisma.showroom.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
        email: dto.email,
        operatingHours: dto.operatingHours as object[] | undefined,
        isActive: dto.isActive,
      },
    });
  }

  async deactivate(id: string) {
    await this.findById(id);

    return this.prisma.showroom.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getOperatingHours(id: string, date: Date) {
    const showroom = await this.findById(id);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    const operatingHours = showroom.operatingHours as {
      dayOfWeek: number;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }[];

    return operatingHours.find((h) => h.dayOfWeek === dayOfWeek) || null;
  }
}
