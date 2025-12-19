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
import { CarsService } from './cars.service';
import {
  CreateCarModelDto,
  UpdateCarModelDto,
  CreateCarUnitDto,
  UpdateCarUnitDto,
} from './dto/cars.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole, CarUnitStatus, CheckInType } from '@prisma/client';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('cars')
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  // Car Models
  @Get('models')
  @Public()
  @ApiOperation({ summary: 'Get all car models available for test drive' })
  @ApiQuery({ name: 'brand', required: false })
  @ApiQuery({ name: 'fuelType', required: false })
  async findAllModels(
    @Query('brand') brand?: string,
    @Query('fuelType') fuelType?: string,
  ) {
    return this.carsService.findAllModels({
      brand,
      fuelType,
      isAvailableForTestDrive: true,
    });
  }

  @Get('models/:id')
  @Public()
  @ApiOperation({ summary: 'Get car model by ID' })
  async findModelById(@Param('id') id: string) {
    return this.carsService.findModelById(id);
  }

  @Post('models')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new car model (admin only)' })
  @ApiResponse({ status: 201, description: 'Car model created successfully' })
  async createModel(@Body() dto: CreateCarModelDto) {
    return this.carsService.createModel(dto);
  }

  @Patch('models/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update car model (admin only)' })
  async updateModel(@Param('id') id: string, @Body() dto: UpdateCarModelDto) {
    return this.carsService.updateModel(id, dto);
  }

  // Car Units
  @Get('units')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all car units' })
  @ApiQuery({ name: 'showroomId', required: false })
  @ApiQuery({ name: 'carModelId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: CarUnitStatus })
  async findAllUnits(
    @Query('showroomId') showroomId?: string,
    @Query('carModelId') carModelId?: string,
    @Query('status') status?: CarUnitStatus,
  ) {
    return this.carsService.findAllUnits({ showroomId, carModelId, status });
  }

  @Get('units/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get car unit by ID' })
  async findUnitById(@Param('id') id: string) {
    return this.carsService.findUnitById(id);
  }

  @Post('units')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new car unit' })
  @ApiResponse({ status: 201, description: 'Car unit created successfully' })
  async createUnit(@Body() dto: CreateCarUnitDto) {
    return this.carsService.createUnit(dto);
  }

  @Patch('units/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update car unit' })
  async updateUnit(@Param('id') id: string, @Body() dto: UpdateCarUnitDto) {
    return this.carsService.updateUnit(id, dto);
  }

  @Patch('units/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update car unit status' })
  async updateUnitStatus(
    @Param('id') id: string,
    @Body('status') status: CarUnitStatus,
  ) {
    return this.carsService.updateUnitStatus(id, status);
  }

  // Car Check-In/Check-Out endpoints
  @Get('units/vin/:vin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER, UserRole.SALES_EXECUTIVE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Find car unit by VIN' })
  async findUnitByVin(@Param('vin') vin: string) {
    return this.carsService.findUnitByVin(vin);
  }

  @Post('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER, UserRole.SALES_EXECUTIVE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check in/out a car (receive, send, return, out for drive)' })
  @ApiResponse({ status: 201, description: 'Check-in recorded successfully' })
  async checkIn(
    @CurrentUser() user: CurrentUserData,
    @Body()
    body: {
      carUnitId: string;
      type: CheckInType;
      notes?: string;
      fromShowroomId?: string;
      toShowroomId?: string;
    },
  ) {
    const showroomId = user.showroomId;
    if (!showroomId) {
      throw new Error('User must be assigned to a showroom to perform check-in');
    }

    return this.carsService.checkIn(
      body.carUnitId,
      showroomId,
      user.id,
      body.type,
      body.notes,
      body.fromShowroomId,
      body.toShowroomId,
    );
  }

  @Post('check-in/vin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER, UserRole.SALES_EXECUTIVE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check in/out a car by VIN (receive, send, return, out for drive)' })
  @ApiResponse({ status: 201, description: 'Check-in recorded successfully' })
  async checkInByVin(
    @CurrentUser() user: CurrentUserData,
    @Body()
    body: {
      vin: string;
      type: CheckInType;
      notes?: string;
      fromShowroomId?: string;
      toShowroomId?: string;
    },
  ) {
    const showroomId = user.showroomId;
    if (!showroomId) {
      throw new Error('User must be assigned to a showroom to perform check-in');
    }

    // Find car by VIN first
    const carUnit = await this.carsService.findUnitByVin(body.vin);

    return this.carsService.checkIn(
      carUnit.id,
      showroomId,
      user.id,
      body.type,
      body.notes,
      body.fromShowroomId,
      body.toShowroomId,
    );
  }

  @Get('check-in/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SHOWROOM_MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get check-in history' })
  @ApiQuery({ name: 'carUnitId', required: false })
  @ApiQuery({ name: 'showroomId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: CheckInType })
  @ApiQuery({ name: 'limit', required: false })
  async getCheckInHistory(
    @Query('carUnitId') carUnitId?: string,
    @Query('showroomId') showroomId?: string,
    @Query('type') type?: CheckInType,
    @Query('limit') limit?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    const effectiveShowroomId =
      user?.role === UserRole.SHOWROOM_MANAGER ? user.showroomId : showroomId;

    return this.carsService.getCheckInHistory({
      carUnitId,
      showroomId: effectiveShowroomId || undefined,
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
