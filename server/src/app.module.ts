import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './config/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ShowroomsModule } from './modules/showrooms/showrooms.module';
import { CarsModule } from './modules/cars/cars.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { TransfersModule } from './modules/transfers/transfers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { LeadsModule } from './modules/leads/leads.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WebsocketModule } from './websocket/websocket.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Infrastructure
    PrismaModule,
    RedisModule,

    // Health check
    HealthModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ShowroomsModule,
    CarsModule,
    AvailabilityModule,
    BookingsModule,
    SchedulingModule,
    TransfersModule,
    NotificationsModule,
    LeadsModule,
    AnalyticsModule,

    // WebSocket
    WebsocketModule,
  ],
})
export class AppModule {}
