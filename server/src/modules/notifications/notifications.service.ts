import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

interface BookingWithRelations {
  id: string;
  referenceNumber: string;
  date: Date;
  startTime: string;
  endTime: string;
  customer: {
    id: string;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  showroom: {
    name: string;
    address: string;
    phone: string;
  };
  carUnit: {
    carModel: {
      brand: string;
      model: string;
      year: number;
    };
  };
}

@Injectable()
export class NotificationsService {
  private readonly whatsappEnabled: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.whatsappEnabled =
      this.configService.get<string>('WHATSAPP_ENABLED') === 'true';
  }

  async sendBookingConfirmation(booking: BookingWithRelations) {
    const message = this.generateConfirmationMessage(booking);
    return this.send(booking.customer.phone!, message, 'BOOKING_CONFIRMATION', booking.id);
  }

  async sendBookingCancellation(booking: BookingWithRelations) {
    const message = this.generateCancellationMessage(booking);
    return this.send(booking.customer.phone!, message, 'BOOKING_CANCELLATION', booking.id);
  }

  async sendBookingRescheduled(booking: BookingWithRelations) {
    const message = this.generateRescheduleMessage(booking);
    return this.send(booking.customer.phone!, message, 'BOOKING_RESCHEDULED', booking.id);
  }

  async sendReminder(booking: BookingWithRelations, hoursBeforeStr: string) {
    const hoursBefore = parseInt(hoursBeforeStr, 10);
    const message = this.generateReminderMessage(booking, hoursBefore);
    return this.send(booking.customer.phone!, message, 'BOOKING_REMINDER', booking.id);
  }

  private async send(
    phone: string,
    message: string,
    type: string,
    bookingId: string,
  ) {
    // Log the notification
    await this.prisma.notificationLog.create({
      data: {
        bookingId,
        type,
        channel: 'WHATSAPP',
        recipient: phone,
        message,
        status: this.whatsappEnabled ? 'PENDING' : 'MOCK',
        sentAt: new Date(),
      },
    });

    if (!this.whatsappEnabled) {
      // Mock mode - just log
      console.log(`[WhatsApp Mock] To: ${phone}`);
      console.log(`[WhatsApp Mock] Message: ${message}`);
      return { success: true, mock: true };
    }

    // In production, integrate with WhatsApp Business API
    // Example: Twilio, MessageBird, or direct WhatsApp Cloud API
    try {
      // const response = await this.whatsappClient.sendMessage(phone, message);
      // Update notification log with success
      console.log(`[WhatsApp] Sending to ${phone}: ${message}`);
      return { success: true };
    } catch (error) {
      console.error(`[WhatsApp] Failed to send to ${phone}:`, error);
      return { success: false, error };
    }
  }

  private generateConfirmationMessage(booking: BookingWithRelations): string {
    const date = new Date(booking.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
Your test drive is confirmed!

Booking Reference: ${booking.referenceNumber}

Car: ${booking.carUnit.carModel.brand} ${booking.carUnit.carModel.model} ${booking.carUnit.carModel.year}
Date: ${date}
Time: ${booking.startTime} - ${booking.endTime}

Location: ${booking.showroom.name}
Address: ${booking.showroom.address}

Questions? Call ${booking.showroom.phone}

See you soon!
`.trim();
  }

  private generateCancellationMessage(booking: BookingWithRelations): string {
    return `
Your test drive has been cancelled.

Booking Reference: ${booking.referenceNumber}
Car: ${booking.carUnit.carModel.brand} ${booking.carUnit.carModel.model}

We're sorry to see you go. Feel free to book again anytime!
`.trim();
  }

  private generateRescheduleMessage(booking: BookingWithRelations): string {
    const date = new Date(booking.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
Your test drive has been rescheduled!

Booking Reference: ${booking.referenceNumber}

New Date: ${date}
New Time: ${booking.startTime} - ${booking.endTime}

Location: ${booking.showroom.name}

See you then!
`.trim();
  }

  private generateReminderMessage(
    booking: BookingWithRelations,
    hoursBefore: number,
  ): string {
    const timeText = hoursBefore === 24 ? 'tomorrow' : `in ${hoursBefore} hours`;
    const date = new Date(booking.date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

    return `
Reminder: Your test drive is ${timeText}!

Car: ${booking.carUnit.carModel.brand} ${booking.carUnit.carModel.model}
Date: ${date}
Time: ${booking.startTime}
Location: ${booking.showroom.name}

Need to reschedule? Reply to this message.
`.trim();
  }
}
