import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiOperation({ summary: 'Get booking overview statistics' })
  @ApiQuery({ name: 'showroomId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getOverview(
    @Query('showroomId') showroomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const effectiveShowroomId =
      user?.role === UserRole.SHOWROOM_MANAGER ? user.showroomId : showroomId;

    return this.analyticsService.getOverview(
      effectiveShowroomId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('bookings-by-source')
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiOperation({ summary: 'Get bookings grouped by source' })
  @ApiQuery({ name: 'showroomId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getBookingsBySource(
    @Query('showroomId') showroomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const effectiveShowroomId =
      user?.role === UserRole.SHOWROOM_MANAGER ? user.showroomId : showroomId;

    return this.analyticsService.getBookingsBySource(
      effectiveShowroomId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('popular-cars')
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiOperation({ summary: 'Get most popular cars for test drives' })
  @ApiQuery({ name: 'showroomId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getPopularCars(
    @Query('showroomId') showroomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const effectiveShowroomId =
      user?.role === UserRole.SHOWROOM_MANAGER ? user.showroomId : showroomId;

    return this.analyticsService.getPopularCars(
      effectiveShowroomId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('bookings-by-day')
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiOperation({ summary: 'Get bookings count per day' })
  @ApiQuery({ name: 'showroomId', required: false })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getBookingsByDay(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('showroomId') showroomId?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const effectiveShowroomId =
      user?.role === UserRole.SHOWROOM_MANAGER ? user.showroomId : showroomId;

    return this.analyticsService.getBookingsByDay(
      effectiveShowroomId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('lead-conversion')
  @Roles(UserRole.ADMIN, UserRole.CALL_CENTER_AGENT)
  @ApiOperation({ summary: 'Get lead conversion statistics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getLeadConversion(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getLeadConversionStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
