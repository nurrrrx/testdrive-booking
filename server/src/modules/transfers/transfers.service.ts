import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransferStatus } from '@prisma/client';

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    carUnitId: string,
    fromShowroomId: string,
    toShowroomId: string,
    requestedById: string,
    requestedDate: Date,
    notes?: string,
  ) {
    return this.prisma.carTransferRequest.create({
      data: {
        carUnitId,
        fromShowroomId,
        toShowroomId,
        requestedById,
        requestedDate,
        notes,
        status: TransferStatus.PENDING,
      },
      include: {
        carUnit: { include: { carModel: true } },
        fromShowroom: true,
        toShowroom: true,
        requestedBy: true,
      },
    });
  }

  async findAll(showroomId?: string, status?: TransferStatus) {
    return this.prisma.carTransferRequest.findMany({
      where: {
        OR: showroomId
          ? [{ fromShowroomId: showroomId }, { toShowroomId: showroomId }]
          : undefined,
        status,
      },
      include: {
        carUnit: { include: { carModel: true } },
        fromShowroom: true,
        toShowroom: true,
        requestedBy: true,
        approvedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, approvedById: string) {
    const transfer = await this.prisma.carTransferRequest.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer request not found');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer is not pending');
    }

    return this.prisma.carTransferRequest.update({
      where: { id },
      data: {
        status: TransferStatus.APPROVED,
        approvedById,
        approvedAt: new Date(),
      },
    });
  }

  async reject(id: string, approvedById: string, reason?: string) {
    const transfer = await this.prisma.carTransferRequest.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer request not found');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException('Transfer is not pending');
    }

    return this.prisma.carTransferRequest.update({
      where: { id },
      data: {
        status: TransferStatus.REJECTED,
        approvedById,
        approvedAt: new Date(),
        notes: reason,
      },
    });
  }

  async markInTransit(id: string) {
    return this.prisma.carTransferRequest.update({
      where: { id },
      data: { status: TransferStatus.IN_TRANSIT },
    });
  }

  async markCompleted(id: string) {
    const transfer = await this.prisma.carTransferRequest.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer request not found');
    }

    // Update car unit location
    await this.prisma.carUnit.update({
      where: { id: transfer.carUnitId },
      data: { showroomId: transfer.toShowroomId },
    });

    return this.prisma.carTransferRequest.update({
      where: { id },
      data: {
        status: TransferStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }
}
