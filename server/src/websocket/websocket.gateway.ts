import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Socket>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() channel: string,
  ) {
    console.log(`Client ${client.id} subscribing to ${channel}`);
    client.join(channel);
    return { event: 'subscribed', data: { channel } };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() channel: string,
  ) {
    console.log(`Client ${client.id} unsubscribing from ${channel}`);
    client.leave(channel);
    return { event: 'unsubscribed', data: { channel } };
  }

  // Broadcast methods for other services to use
  emitSlotBooked(showroomId: string, date: string, slotId: string) {
    const channel = `slots:${showroomId}:${date}`;
    this.server.to(channel).emit(channel, {
      type: 'SLOT_BOOKED',
      slotId,
      timestamp: new Date().toISOString(),
    });
  }

  emitSlotReleased(
    showroomId: string,
    date: string,
    slot: { id: string; startTime: string; endTime: string },
  ) {
    const channel = `slots:${showroomId}:${date}`;
    this.server.to(channel).emit(channel, {
      type: 'SLOT_RELEASED',
      slot,
      timestamp: new Date().toISOString(),
    });
  }

  emitSlotHeld(
    showroomId: string,
    date: string,
    slotId: string,
    expiresAt: string,
  ) {
    const channel = `slots:${showroomId}:${date}`;
    this.server.to(channel).emit(channel, {
      type: 'SLOT_HELD',
      slotId,
      expiresAt,
      timestamp: new Date().toISOString(),
    });
  }

  emitBookingCreated(showroomId: string, booking: object) {
    const channel = `bookings:${showroomId}`;
    this.server.to(channel).emit(channel, {
      type: 'BOOKING_CREATED',
      booking,
      timestamp: new Date().toISOString(),
    });
  }

  emitBookingUpdated(showroomId: string, bookingId: string, status: string) {
    const channel = `bookings:${showroomId}`;
    this.server.to(channel).emit(channel, {
      type: 'BOOKING_UPDATED',
      bookingId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitScheduleUpdate(salesExecId: string, booking: object) {
    const channel = `schedule:${salesExecId}`;
    this.server.to(channel).emit(channel, {
      type: 'NEW_ASSIGNMENT',
      booking,
      timestamp: new Date().toISOString(),
    });
  }

  emitNotification(userId: string, notification: object) {
    const channel = `notifications:${userId}`;
    this.server.to(channel).emit(channel, {
      type: 'NOTIFICATION',
      notification,
      timestamp: new Date().toISOString(),
    });
  }
}
