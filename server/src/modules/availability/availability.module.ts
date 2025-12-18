import { Module } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';
import { CarsModule } from '../cars/cars.module';
import { ShowroomsModule } from '../showrooms/showrooms.module';
import { SchedulingModule } from '../scheduling/scheduling.module';

@Module({
  imports: [CarsModule, ShowroomsModule, SchedulingModule],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
