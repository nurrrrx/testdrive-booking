import { Module } from '@nestjs/common';
import { ShowroomsService } from './showrooms.service';
import { ShowroomsController } from './showrooms.controller';

@Module({
  controllers: [ShowroomsController],
  providers: [ShowroomsService],
  exports: [ShowroomsService],
})
export class ShowroomsModule {}
