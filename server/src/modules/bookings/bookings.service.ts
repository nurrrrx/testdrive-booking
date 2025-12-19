import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { REDIS_CLIENT } from '../../config/redis.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto, RescheduleBookingDto } from './dto/bookings.dto';
import { BookingStatus, BookingSource, CarUnitStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async create(dto: CreateBookingDto, userId?: string) {
    // Validate hold if provided
    if (dto.holdId) {
      const isValidHold = await this.availabilityService.validateHold(dto.holdId);
      if (!isValidHold) {
        throw new BadRequestException('Slot hold expired or invalid');
      }
    }

    // Get or create customer
    let customerId = userId;
    if (!customerId && dto.customerInfo) {
      const customer = await this.prisma.user.upsert({
        where: { phone: dto.customerInfo.phone },
        create: {
          phone: dto.customerInfo.phone,
          email: dto.customerInfo.email,
          firstName: dto.customerInfo.firstName,
          lastName: dto.customerInfo.lastName,
          role: 'CUSTOMER',
          isActive: true,
        },
        update: {
          email: dto.customerInfo.email,
          firstName: dto.customerInfo.firstName,
          lastName: dto.customerInfo.lastName,
        },
      });
      customerId = customer.id;
    }

    if (!customerId) {
      throw new BadRequestException('Customer information is required');
    }

    // Find available car unit (with optional carModelId filter)
    const carUnit = await this.prisma.carUnit.findFirst({
      where: {
        showroomId: dto.showroomId,
        ...(dto.carModelId && { carModelId: dto.carModelId }),
        status: 'AVAILABLE',
      },
    });

    if (!carUnit) {
      throw new BadRequestException('No car available at the showroom');
    }

    // Find available sales executive
    const salesExec = await this.prisma.user.findFirst({
      where: {
        showroomId: dto.showroomId,
        role: 'SALES_EXECUTIVE',
        isActive: true,
      },
    });

    // Generate reference number
    const referenceNumber = `TD-${Date.now().toString(36).toUpperCase()}`;

    // Calculate end time if not provided (30 min default slot)
    const slotDuration = Number(this.configService.get('SLOT_DURATION_MINUTES')) || 30;
    const endTime = dto.endTime || this.calculateEndTime(dto.startTime, slotDuration);

    // Use distributed lock for booking creation
    const lockKey = `booking_lock:${dto.showroomId}:${dto.date}:${dto.startTime}`;
    const lockValue = uuidv4();
    const lockAcquired = await this.redis.set(
      lockKey,
      lockValue,
      'EX',
      30,
      'NX',
    );

    if (!lockAcquired) {
      throw new BadRequestException('Slot is being booked by another user');
    }

    try {
      // Create booking
      const booking = await this.prisma.booking.create({
        data: {
          referenceNumber,
          showroomId: dto.showroomId,
          carUnitId: carUnit.id,
          customerId: customerId,
          salesExecId: salesExec?.id,
          date: new Date(dto.date),
          startTime: dto.startTime,
          endTime: endTime,
          status: BookingStatus.CONFIRMED,
          source: dto.source || BookingSource.WEB,
          notes: dto.notes,
        },
        include: {
          showroom: true,
          carUnit: {
            include: { carModel: true },
          },
          customer: true,
          salesExec: true,
        },
      });

      // Mark car as RESERVED
      await this.prisma.carUnit.update({
        where: { id: carUnit.id },
        data: { status: CarUnitStatus.RESERVED },
      });

      // Release the hold if it was provided
      if (dto.holdId) {
        await this.availabilityService.releaseHold(dto.holdId);
      }

      // Send confirmation notification
      await this.notificationsService.sendBookingConfirmation(booking);

      return booking;
    } finally {
      // Release lock only if we still own it
      const currentValue = await this.redis.get(lockKey);
      if (currentValue === lockValue) {
        await this.redis.del(lockKey);
      }
    }
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    let endMinutes = minutes + durationMinutes;
    let endHours = hours;
    if (endMinutes >= 60) {
      endHours += Math.floor(endMinutes / 60);
      endMinutes = endMinutes % 60;
    }
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  async findById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        showroom: true,
        carUnit: {
          include: { carModel: true },
        },
        customer: true,
        salesExec: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findByReference(referenceNumber: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { referenceNumber },
      include: {
        showroom: true,
        carUnit: {
          include: { carModel: true },
        },
        customer: true,
        salesExec: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async findAll(filters: {
    showroomId?: string;
    customerId?: string;
    salesExecId?: string;
    status?: BookingStatus;
    date?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return this.prisma.booking.findMany({
      where: {
        showroomId: filters.showroomId,
        customerId: filters.customerId,
        salesExecId: filters.salesExecId,
        status: filters.status,
        date: filters.date
          ? new Date(filters.date)
          : filters.startDate && filters.endDate
            ? {
                gte: new Date(filters.startDate),
                lte: new Date(filters.endDate),
              }
            : undefined,
      },
      include: {
        showroom: true,
        carUnit: {
          include: { carModel: true },
        },
        customer: true,
        salesExec: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async cancel(id: string, reason?: string) {
    const booking = await this.findById(id);

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Booking already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed booking');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
      include: {
        showroom: true,
        carUnit: {
          include: { carModel: true },
        },
        customer: true,
      },
    });

    // Release car back to AVAILABLE
    if (booking.carUnitId) {
      await this.prisma.carUnit.update({
        where: { id: booking.carUnitId },
        data: { status: CarUnitStatus.AVAILABLE },
      });
    }

    // Send cancellation notification
    await this.notificationsService.sendBookingCancellation(updated);

    return updated;
  }

  async reschedule(id: string, dto: RescheduleBookingDto) {
    const booking = await this.findById(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Can only reschedule confirmed bookings');
    }

    // Validate new slot hold
    const isValidHold = await this.availabilityService.validateHold(dto.holdId);
    if (!isValidHold) {
      throw new BadRequestException('New slot hold expired or invalid');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      include: {
        showroom: true,
        carUnit: {
          include: { carModel: true },
        },
        customer: true,
        salesExec: true,
      },
    });

    // Release the hold
    await this.availabilityService.releaseHold(dto.holdId);

    // Send reschedule notification
    await this.notificationsService.sendBookingRescheduled(updated);

    return updated;
  }

  async markCompleted(id: string, notes?: string) {
    const booking = await this.findById(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Can only complete confirmed bookings');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
        notes: notes || booking.notes,
      },
    });

    // Release car back to AVAILABLE
    if (booking.carUnitId) {
      await this.prisma.carUnit.update({
        where: { id: booking.carUnitId },
        data: { status: CarUnitStatus.AVAILABLE },
      });
    }

    return updated;
  }

  async markNoShow(id: string) {
    const booking = await this.findById(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Can only mark confirmed bookings as no-show');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.NO_SHOW,
      },
    });

    // Release car back to AVAILABLE
    if (booking.carUnitId) {
      await this.prisma.carUnit.update({
        where: { id: booking.carUnitId },
        data: { status: CarUnitStatus.AVAILABLE },
      });
    }

    return updated;
  }
}
