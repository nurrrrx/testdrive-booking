import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto, RescheduleBookingDto } from './dto/bookings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { UserRole, BookingStatus } from '@prisma/client';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user?: CurrentUserData,
  ) {
    return this.bookingsService.create(dto, user?.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.ADMIN,
    UserRole.SHOWROOM_MANAGER,
    UserRole.CALL_CENTER_AGENT,
    UserRole.SALES_EXECUTIVE,
  )
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bookings (staff only)' })
  @ApiQuery({ name: 'showroomId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async findAll(
    @Query('showroomId') showroomId?: string,
    @Query('status') status?: BookingStatus,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    // Filter by showroom for showroom managers and sales execs
    const effectiveShowroomId =
      user?.role === UserRole.SHOWROOM_MANAGER ||
      user?.role === UserRole.SALES_EXECUTIVE
        ? user.showroomId
        : showroomId;

    // Filter by sales exec for sales executives
    const salesExecId =
      user?.role === UserRole.SALES_EXECUTIVE ? user.id : undefined;

    return this.bookingsService.findAll({
      showroomId: effectiveShowroomId,
      salesExecId,
      status,
      date,
      startDate,
      endDate,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user bookings' })
  async findMyBookings(@CurrentUser() user: CurrentUserData) {
    return this.bookingsService.findAll({ customerId: user.id });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get booking by ID' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Get('reference/:referenceNumber')
  @Public()
  @ApiOperation({ summary: 'Get booking by reference number' })
  async findByReference(@Param('referenceNumber') referenceNumber: string) {
    return this.bookingsService.findByReference(referenceNumber);
  }

  @Patch(':id/cancel')
  @Public()
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancel(id, reason);
  }

  @Patch(':id/reschedule')
  @Public()
  @ApiOperation({ summary: 'Reschedule a booking' })
  async reschedule(
    @Param('id') id: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingsService.reschedule(id, dto);
  }

  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALES_EXECUTIVE, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark booking as completed' })
  async markCompleted(
    @Param('id') id: string,
    @Body('notes') notes?: string,
  ) {
    return this.bookingsService.markCompleted(id, notes);
  }

  @Patch(':id/no-show')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SALES_EXECUTIVE, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark booking as no-show' })
  async markNoShow(@Param('id') id: string) {
    return this.bookingsService.markNoShow(id);
  }
}
