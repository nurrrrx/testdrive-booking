import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailableSalesExecs(showroomId: string, date: Date) {
    const dayOfWeek = date.getDay();

    return this.prisma.user.findMany({
      where: {
        showroomId,
        role: 'SALES_EXECUTIVE',
        isActive: true,
        schedules: {
          some: {
            date: date,
          },
        },
      },
      include: {
        schedules: {
          where: {
            date: date,
          },
        },
      },
    });
  }

  async getSchedule(userId: string, startDate: Date, endDate: Date) {
    return this.prisma.salesExecSchedule.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getTeamSchedule(showroomId: string, startDate: Date, endDate: Date) {
    return this.prisma.salesExecSchedule.findMany({
      where: {
        user: {
          showroomId,
          role: 'SALES_EXECUTIVE',
          isActive: true,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { user: { firstName: 'asc' } }],
    });
  }

  async setAvailability(
    userId: string,
    date: Date,
    availableFrom: string,
    availableTo: string,
  ) {
    return this.prisma.salesExecSchedule.upsert({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
      create: {
        userId,
        date,
        availableFrom,
        availableTo,
      },
      update: {
        availableFrom,
        availableTo,
      },
    });
  }

  async removeAvailability(userId: string, date: Date) {
    return this.prisma.salesExecSchedule.delete({
      where: {
        userId_date: {
          userId,
          date,
        },
      },
    });
  }
}
