import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { REDIS_CLIENT } from '../../config/redis.module';
import { PrismaService } from '../../prisma/prisma.service';
import { ShowroomsService } from '../showrooms/showrooms.service';
import { CarsService } from '../cars/cars.service';
import { SchedulingService } from '../scheduling/scheduling.service';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'available' | 'held' | 'booked';
  holdExpiresAt?: string;
}

@Injectable()
export class AvailabilityService {
  private readonly slotDuration: number;
  private readonly bufferTime: number;
  private readonly holdMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly showroomsService: ShowroomsService,
    private readonly carsService: CarsService,
    private readonly schedulingService: SchedulingService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.slotDuration = Number(this.configService.get('SLOT_DURATION_MINUTES')) || 30;
    this.bufferTime = Number(this.configService.get('SLOT_BUFFER_MINUTES')) || 15;
    this.holdMinutes = Number(this.configService.get('SLOT_HOLD_MINUTES')) || 10;
  }

  async getAvailableSlots(
    showroomId: string,
    date: string,
    carModelId?: string,
  ): Promise<TimeSlot[]> {
    // 1. Get showroom operating hours for the date
    const dateObj = new Date(date);
    const operatingHours = await this.showroomsService.getOperatingHours(
      showroomId,
      dateObj,
    );

    if (!operatingHours || operatingHours.isClosed) {
      return [];
    }

    // 2. Generate all possible slots
    const allSlots = this.generateSlots(
      date,
      operatingHours.openTime,
      operatingHours.closeTime,
    );

    // 3. Get existing bookings for the date
    const bookings = await this.prisma.booking.findMany({
      where: {
        showroomId,
        date: dateObj,
        status: { in: ['PENDING', 'CONFIRMED'] },
        ...(carModelId && {
          carUnit: { carModelId },
        }),
      },
      select: {
        startTime: true,
        endTime: true,
        carUnitId: true,
      },
    });

    // 4. Get slot holds from Redis
    const holdKeys = await this.redis.keys(`slot_hold:${showroomId}:${date}:*`);
    const holds = new Map<string, string>();
    for (const key of holdKeys) {
      const expiresAt = await this.redis.get(key);
      if (expiresAt) {
        const slotTime = key.split(':').pop();
        holds.set(slotTime!, expiresAt);
      }
    }

    // 5. Get available sales executives
    const availableExecs = await this.schedulingService.getAvailableSalesExecs(
      showroomId,
      dateObj,
    );

    // 6. Filter available slots
    const availableSlots: TimeSlot[] = [];
    const bookedTimes = new Set(
      bookings.map((b) => `${b.startTime}-${b.endTime}`),
    );

    for (const slot of allSlots) {
      const slotKey = `${slot.startTime}-${slot.endTime}`;

      // Check if slot is booked
      if (bookedTimes.has(slotKey)) {
        continue;
      }

      // Check if there are available sales executives for this slot
      const execAvailable = availableExecs.some((exec) =>
        this.isExecAvailableForSlot(exec, slot.startTime, slot.endTime, bookings),
      );

      if (!execAvailable && availableExecs.length > 0) {
        continue;
      }

      // Check if slot is held
      const holdExpiry = holds.get(slot.startTime);
      if (holdExpiry) {
        const expiryDate = new Date(holdExpiry);
        if (expiryDate > new Date()) {
          availableSlots.push({
            ...slot,
            status: 'held',
            holdExpiresAt: holdExpiry,
          });
          continue;
        }
      }

      availableSlots.push({
        ...slot,
        status: 'available',
      });
    }

    return availableSlots;
  }

  async holdSlot(
    showroomId: string,
    date: string,
    startTime: string,
  ): Promise<{ holdId: string; expiresAt: string }> {
    // Verify slot is available
    const slots = await this.getAvailableSlots(showroomId, date);
    const slot = slots.find((s) => s.startTime === startTime);

    if (!slot) {
      throw new BadRequestException('Slot not available');
    }

    if (slot.status === 'held') {
      throw new BadRequestException('Slot is already held');
    }

    // Create hold
    const holdId = uuidv4();
    const expiresAt = new Date(
      Date.now() + this.holdMinutes * 60 * 1000,
    ).toISOString();

    const key = `slot_hold:${showroomId}:${date}:${startTime}`;
    await this.redis.setex(key, this.holdMinutes * 60, expiresAt);
    await this.redis.setex(`hold:${holdId}`, this.holdMinutes * 60, key);

    return { holdId, expiresAt };
  }

  async releaseHold(holdId: string): Promise<void> {
    const key = await this.redis.get(`hold:${holdId}`);
    if (key) {
      await this.redis.del(key);
      await this.redis.del(`hold:${holdId}`);
    }
  }

  async validateHold(holdId: string): Promise<boolean> {
    const key = await this.redis.get(`hold:${holdId}`);
    if (!key) {
      return false;
    }
    const expiresAt = await this.redis.get(key);
    return !!expiresAt && new Date(expiresAt) > new Date();
  }

  private generateSlots(
    date: string,
    openTime: string,
    closeTime: string,
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);

    let currentHour = openHour;
    let currentMin = openMin;

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMin < closeMin)
    ) {
      const startTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

      // Calculate end time
      let endMin = currentMin + this.slotDuration;
      let endHour = currentHour;
      if (endMin >= 60) {
        endHour += Math.floor(endMin / 60);
        endMin = endMin % 60;
      }

      // Don't create slot if it goes past closing time
      if (
        endHour > closeHour ||
        (endHour === closeHour && endMin > closeMin)
      ) {
        break;
      }

      const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

      slots.push({
        id: `${date}-${startTime}`,
        startTime,
        endTime,
        date,
        status: 'available',
      });

      // Move to next slot (slot duration + buffer)
      currentMin += this.slotDuration + this.bufferTime;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return slots;
  }

  private isExecAvailableForSlot(
    exec: { id: string; schedules: { availableFrom: string; availableTo: string }[] },
    startTime: string,
    endTime: string,
    existingBookings: { startTime: string; endTime: string; carUnitId: string }[],
  ): boolean {
    // Check if exec has overlapping bookings
    const hasConflict = existingBookings.some(
      (b) =>
        (startTime >= b.startTime && startTime < b.endTime) ||
        (endTime > b.startTime && endTime <= b.endTime),
    );

    if (hasConflict) {
      return false;
    }

    // Check if exec is available during this time
    return exec.schedules.some(
      (s) => startTime >= s.availableFrom && endTime <= s.availableTo,
    );
  }
}
