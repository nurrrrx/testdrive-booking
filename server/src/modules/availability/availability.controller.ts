import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('showrooms/:showroomId/slots')
  @Public()
  @ApiOperation({ summary: 'Get available time slots for a showroom' })
  @ApiQuery({ name: 'date', required: true, example: '2024-12-20' })
  @ApiQuery({ name: 'carModelId', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of available time slots',
  })
  async getAvailableSlots(
    @Param('showroomId') showroomId: string,
    @Query('date') date: string,
    @Query('carModelId') carModelId?: string,
  ) {
    const slots = await this.availabilityService.getAvailableSlots(
      showroomId,
      date,
      carModelId,
    );

    // Transform to frontend-expected format
    return {
      showroomId,
      date,
      slots: slots.map((slot) => ({
        time: slot.startTime,
        available: slot.status === 'available',
        endTime: slot.endTime,
        status: slot.status,
        holdExpiresAt: slot.holdExpiresAt,
      })),
    };
  }

  @Post('slots/hold')
  @Public()
  @ApiOperation({ summary: 'Hold a slot temporarily (10 minutes)' })
  @ApiResponse({
    status: 201,
    description: 'Slot held successfully',
  })
  async holdSlot(
    @Body()
    body: {
      showroomId: string;
      date: string;
      startTime: string;
    },
  ) {
    return this.availabilityService.holdSlot(
      body.showroomId,
      body.date,
      body.startTime,
    );
  }

  @Delete('slots/hold/:holdId')
  @Public()
  @ApiOperation({ summary: 'Release a slot hold' })
  async releaseHold(@Param('holdId') holdId: string) {
    await this.availabilityService.releaseHold(holdId);
    return { message: 'Hold released' };
  }
}
