import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LeadStatus } from '@prisma/client';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    source: string;
    interestedCarModelId?: string;
    preferredShowroomId?: string;
    notes?: string;
  }) {
    return this.prisma.lead.create({
      data: {
        ...data,
        status: LeadStatus.NEW,
      },
      include: {
        interestedCarModel: true,
        preferredShowroom: true,
      },
    });
  }

  async findAll(filters?: {
    status?: LeadStatus;
    source?: string;
    assignedToId?: string;
  }) {
    return this.prisma.lead.findMany({
      where: {
        status: filters?.status,
        source: filters?.source,
        assignedToId: filters?.assignedToId,
      },
      include: {
        interestedCarModel: true,
        preferredShowroom: true,
        assignedTo: true,
        convertedBooking: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        interestedCarModel: true,
        preferredShowroom: true,
        assignedTo: true,
        convertedBooking: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async assignTo(id: string, userId: string) {
    return this.prisma.lead.update({
      where: { id },
      data: {
        assignedToId: userId,
        status: LeadStatus.CONTACTED,
      },
    });
  }

  async updateStatus(id: string, status: LeadStatus) {
    return this.prisma.lead.update({
      where: { id },
      data: { status },
    });
  }

  async convertToBooking(id: string, bookingId: string) {
    return this.prisma.lead.update({
      where: { id },
      data: {
        status: LeadStatus.CONVERTED,
        convertedBookingId: bookingId,
        convertedAt: new Date(),
      },
    });
  }
}
