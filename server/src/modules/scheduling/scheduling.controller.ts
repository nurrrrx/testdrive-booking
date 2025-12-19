import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SchedulingService } from './scheduling.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('scheduling')
@Controller('scheduling')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  @Get('my')
  @Roles(UserRole.SALES_EXECUTIVE)
  @ApiOperation({ summary: 'Get my schedule' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getMySchedule(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.schedulingService.getSchedule(
      user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('team')
  @Roles(UserRole.SHOWROOM_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get team schedule for showroom manager' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getTeamSchedule(
    @CurrentUser() user: CurrentUserData,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!user.showroomId) {
      return [];
    }
    return this.schedulingService.getTeamSchedule(
      user.showroomId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('availability')
  @Roles(UserRole.SALES_EXECUTIVE, UserRole.SHOWROOM_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Set availability for a date' })
  async setAvailability(
    @CurrentUser() user: CurrentUserData,
    @Body()
    body: {
      userId?: string;
      date: string;
      availableFrom: string;
      availableTo: string;
    },
  ) {
    const targetUserId =
      (user.role === UserRole.SHOWROOM_MANAGER || user.role === UserRole.ADMIN) && body.userId
        ? body.userId
        : user.id;

    return this.schedulingService.setAvailability(
      targetUserId,
      new Date(body.date),
      body.availableFrom,
      body.availableTo,
    );
  }

  @Delete('availability')
  @Roles(UserRole.SALES_EXECUTIVE, UserRole.SHOWROOM_MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove availability for a date' })
  async removeAvailability(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { userId?: string; date: string },
  ) {
    const targetUserId =
      (user.role === UserRole.SHOWROOM_MANAGER || user.role === UserRole.ADMIN) && body.userId
        ? body.userId
        : user.id;

    return this.schedulingService.removeAvailability(
      targetUserId,
      new Date(body.date),
    );
  }
}
