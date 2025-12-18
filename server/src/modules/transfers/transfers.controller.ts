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
import { TransfersService } from './transfers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';
import { UserRole, TransferStatus } from '@prisma/client';

@ApiTags('transfers')
@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiOperation({ summary: 'Get all transfer requests' })
  @ApiQuery({ name: 'showroomId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TransferStatus })
  async findAll(
    @Query('showroomId') showroomId?: string,
    @Query('status') status?: TransferStatus,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const effectiveShowroomId =
      user?.role === UserRole.SHOWROOM_MANAGER ? user.showroomId : showroomId;
    return this.transfersService.findAll(effectiveShowroomId, status);
  }

  @Post()
  @Roles(UserRole.SHOWROOM_MANAGER, UserRole.CALL_CENTER_AGENT)
  @ApiOperation({ summary: 'Create transfer request' })
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body()
    body: {
      carUnitId: string;
      fromShowroomId: string;
      toShowroomId: string;
      requestedDate: string;
      notes?: string;
    },
  ) {
    return this.transfersService.create(
      body.carUnitId,
      body.fromShowroomId,
      body.toShowroomId,
      user.id,
      new Date(body.requestedDate),
      body.notes,
    );
  }

  @Patch(':id/approve')
  @Roles(UserRole.SHOWROOM_MANAGER)
  @ApiOperation({ summary: 'Approve transfer request' })
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.transfersService.approve(id, user.id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.SHOWROOM_MANAGER)
  @ApiOperation({ summary: 'Reject transfer request' })
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
    @Body('reason') reason?: string,
  ) {
    return this.transfersService.reject(id, user.id, reason);
  }

  @Patch(':id/in-transit')
  @Roles(UserRole.SHOWROOM_MANAGER)
  @ApiOperation({ summary: 'Mark transfer as in transit' })
  async markInTransit(@Param('id') id: string) {
    return this.transfersService.markInTransit(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.SHOWROOM_MANAGER)
  @ApiOperation({ summary: 'Mark transfer as completed' })
  async markCompleted(@Param('id') id: string) {
    return this.transfersService.markCompleted(id);
  }
}
