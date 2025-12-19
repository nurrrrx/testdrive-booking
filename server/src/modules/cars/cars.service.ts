import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCarModelDto,
  UpdateCarModelDto,
  CreateCarUnitDto,
  UpdateCarUnitDto,
} from './dto/cars.dto';
import { CarUnitStatus, FuelType, CheckInType } from '@prisma/client';

@Injectable()
export class CarsService {
  constructor(private readonly prisma: PrismaService) {}

  // Car Models
  async findAllModels(filters?: {
    brand?: string;
    fuelType?: string;
    isAvailableForTestDrive?: boolean;
  }) {
    return this.prisma.carModel.findMany({
      where: {
        brand: filters?.brand,
        fuelType: filters?.fuelType as FuelType | undefined,
        isAvailableForTestDrive: filters?.isAvailableForTestDrive,
      },
      orderBy: [{ brand: 'asc' }, { model: 'asc' }],
    });
  }

  async findModelById(id: string) {
    const model = await this.prisma.carModel.findUnique({
      where: { id },
      include: {
        carUnits: {
          include: {
            showroom: true,
          },
        },
      },
    });

    if (!model) {
      throw new NotFoundException('Car model not found');
    }

    return model;
  }

  async createModel(dto: CreateCarModelDto) {
    return this.prisma.carModel.create({
      data: {
        brand: dto.brand,
        model: dto.model,
        year: dto.year,
        variant: dto.variant,
        fuelType: dto.fuelType,
        transmission: dto.transmission,
        imageUrl: dto.imageUrl,
        thumbnailUrl: dto.thumbnailUrl,
        specs: dto.specs as object | undefined,
        isAvailableForTestDrive: dto.isAvailableForTestDrive ?? true,
      },
    });
  }

  async updateModel(id: string, dto: UpdateCarModelDto) {
    await this.findModelById(id);

    const { specs, ...rest } = dto;
    return this.prisma.carModel.update({
      where: { id },
      data: {
        ...rest,
        specs: specs as object | undefined,
      },
    });
  }

  // Car Units (Physical cars at showrooms)
  async findAllUnits(filters?: {
    showroomId?: string;
    carModelId?: string;
    status?: CarUnitStatus;
  }) {
    return this.prisma.carUnit.findMany({
      where: {
        showroomId: filters?.showroomId,
        carModelId: filters?.carModelId,
        status: filters?.status,
      },
      include: {
        carModel: true,
        showroom: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUnitById(id: string) {
    const unit = await this.prisma.carUnit.findUnique({
      where: { id },
      include: {
        carModel: true,
        showroom: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Car unit not found');
    }

    return unit;
  }

  async createUnit(dto: CreateCarUnitDto) {
    // Verify car model and showroom exist
    await this.findModelById(dto.carModelId);

    return this.prisma.carUnit.create({
      data: {
        carModelId: dto.carModelId,
        showroomId: dto.showroomId,
        vin: dto.vin,
        color: dto.color,
        status: dto.status || CarUnitStatus.AVAILABLE,
        isDemoOnly: dto.isDemoOnly ?? false,
      },
      include: {
        carModel: true,
        showroom: true,
      },
    });
  }

  async updateUnit(id: string, dto: UpdateCarUnitDto) {
    await this.findUnitById(id);

    return this.prisma.carUnit.update({
      where: { id },
      data: dto,
      include: {
        carModel: true,
        showroom: true,
      },
    });
  }

  async updateUnitStatus(id: string, status: CarUnitStatus) {
    await this.findUnitById(id);

    return this.prisma.carUnit.update({
      where: { id },
      data: { status },
      include: {
        carModel: true,
        showroom: true,
      },
    });
  }

  async findAvailableUnitsAtShowroom(showroomId: string, carModelId?: string) {
    return this.prisma.carUnit.findMany({
      where: {
        showroomId,
        carModelId,
        status: CarUnitStatus.AVAILABLE,
        carModel: {
          isAvailableForTestDrive: true,
        },
      },
      include: {
        carModel: true,
      },
    });
  }

  // Car Check-In/Check-Out functionality
  async findUnitByVin(vin: string) {
    const unit = await this.prisma.carUnit.findUnique({
      where: { vin },
      include: {
        carModel: true,
        showroom: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Car unit not found with this VIN');
    }

    return unit;
  }

  async checkIn(
    carUnitId: string,
    showroomId: string,
    performedById: string,
    type: CheckInType,
    notes?: string,
    fromShowroomId?: string,
    toShowroomId?: string,
  ) {
    const carUnit = await this.findUnitById(carUnitId);

    // Create check-in log
    const checkIn = await this.prisma.carCheckIn.create({
      data: {
        carUnitId,
        showroomId,
        performedById,
        type,
        notes,
        fromShowroomId,
        toShowroomId,
      },
      include: {
        carUnit: {
          include: { carModel: true },
        },
        showroom: true,
        performedBy: true,
        fromShowroom: true,
        toShowroom: true,
      },
    });

    // Update car unit status and showroom based on check-in type
    let newStatus: CarUnitStatus = carUnit.status;
    let newShowroomId = carUnit.showroomId;

    switch (type) {
      case CheckInType.RECEIVED:
        newStatus = CarUnitStatus.AVAILABLE;
        newShowroomId = showroomId;
        break;
      case CheckInType.SENT_OUT:
        newStatus = CarUnitStatus.IN_TRANSIT;
        break;
      case CheckInType.RETURNED:
        newStatus = CarUnitStatus.AVAILABLE;
        break;
      case CheckInType.OUT_FOR_DRIVE:
        newStatus = CarUnitStatus.OUT_FOR_TEST_DRIVE;
        break;
    }

    await this.prisma.carUnit.update({
      where: { id: carUnitId },
      data: {
        status: newStatus,
        showroomId: newShowroomId,
      },
    });

    return checkIn;
  }

  async getCheckInHistory(filters?: {
    carUnitId?: string;
    showroomId?: string;
    performedById?: string;
    type?: CheckInType;
    limit?: number;
  }) {
    return this.prisma.carCheckIn.findMany({
      where: {
        carUnitId: filters?.carUnitId,
        showroomId: filters?.showroomId,
        performedById: filters?.performedById,
        type: filters?.type,
      },
      include: {
        carUnit: {
          include: { carModel: true },
        },
        showroom: true,
        performedBy: true,
        fromShowroom: true,
        toShowroom: true,
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });
  }
}
