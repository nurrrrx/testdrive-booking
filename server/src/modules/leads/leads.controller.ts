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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { UserRole, LeadStatus } from '@prisma/client';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new lead (from website form)' })
  async create(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      source: string;
      interestedCarModelId?: string;
      preferredShowroomId?: string;
      notes?: string;
    },
  ) {
    return this.leadsService.create(body);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CALL_CENTER_AGENT, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all leads' })
  @ApiQuery({ name: 'status', required: false, enum: LeadStatus })
  @ApiQuery({ name: 'source', required: false })
  async findAll(
    @Query('status') status?: LeadStatus,
    @Query('source') source?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const assignedToId =
      user?.role === UserRole.CALL_CENTER_AGENT ? user.id : undefined;
    return this.leadsService.findAll({ status, source, assignedToId });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CALL_CENTER_AGENT, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lead by ID' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CALL_CENTER_AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign lead to agent' })
  async assignTo(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const targetUserId = userId || user.id;
    return this.leadsService.assignTo(id, targetUserId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CALL_CENTER_AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lead status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: LeadStatus,
  ) {
    return this.leadsService.updateStatus(id, status);
  }

  @Patch(':id/convert')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.CALL_CENTER_AGENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert lead to booking' })
  async convertToBooking(
    @Param('id') id: string,
    @Body('bookingId') bookingId: string,
  ) {
    return this.leadsService.convertToBooking(id, bookingId);
  }
}
