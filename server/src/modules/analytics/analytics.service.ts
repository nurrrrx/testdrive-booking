import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(showroomId?: string, startDate?: Date, endDate?: Date) {
    const where = {
      ...(showroomId && { showroomId }),
      ...(startDate &&
        endDate && {
          date: { gte: startDate, lte: endDate },
        }),
    };

    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShows,
      pendingBookings,
    ] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.booking.count({ where: { ...where, status: 'NO_SHOW' } }),
      this.prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
    ]);

    const conversionRate =
      totalBookings > 0
        ? ((completedBookings / totalBookings) * 100).toFixed(1)
        : 0;

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShows,
      pendingBookings,
      conversionRate: `${conversionRate}%`,
    };
  }

  async getBookingsBySource(showroomId?: string, startDate?: Date, endDate?: Date) {
    const where = {
      ...(showroomId && { showroomId }),
      ...(startDate &&
        endDate && {
          date: { gte: startDate, lte: endDate },
        }),
    };

    const bookings = await this.prisma.booking.groupBy({
      by: ['source'],
      where,
      _count: true,
    });

    return bookings.map((b) => ({
      source: b.source,
      count: b._count,
    }));
  }

  async getPopularCars(showroomId?: string, startDate?: Date, endDate?: Date) {
    const where = {
      ...(showroomId && { showroomId }),
      ...(startDate &&
        endDate && {
          date: { gte: startDate, lte: endDate },
        }),
    };

    const bookings = await this.prisma.booking.findMany({
      where,
      include: {
        carUnit: {
          include: { carModel: true },
        },
      },
    });

    const carCounts = new Map<string, { car: object; count: number }>();

    for (const booking of bookings) {
      const carModel = booking.carUnit.carModel;
      const key = carModel.id;
      const existing = carCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        carCounts.set(key, {
          car: {
            id: carModel.id,
            brand: carModel.brand,
            model: carModel.model,
            year: carModel.year,
          },
          count: 1,
        });
      }
    }

    return Array.from(carCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getBookingsByDay(
    showroomId?: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where = {
      ...(showroomId && { showroomId }),
      ...(startDate &&
        endDate && {
          date: { gte: startDate, lte: endDate },
        }),
    };

    const bookings = await this.prisma.booking.groupBy({
      by: ['date'],
      where,
      _count: true,
      orderBy: { date: 'asc' },
    });

    return bookings.map((b) => ({
      date: b.date.toISOString().split('T')[0],
      count: b._count,
    }));
  }

  async getLeadConversionStats(startDate?: Date, endDate?: Date) {
    const where = {
      ...(startDate &&
        endDate && {
          createdAt: { gte: startDate, lte: endDate },
        }),
    };

    const [total, converted, contacted, lost] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, status: 'CONVERTED' } }),
      this.prisma.lead.count({ where: { ...where, status: 'CONTACTED' } }),
      this.prisma.lead.count({ where: { ...where, status: 'LOST' } }),
    ]);

    const conversionRate =
      total > 0 ? ((converted / total) * 100).toFixed(1) : 0;

    return {
      total,
      converted,
      contacted,
      lost,
      conversionRate: `${conversionRate}%`,
    };
  }
}
