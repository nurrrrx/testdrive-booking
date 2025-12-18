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
import { UserRole, CarUnitStatus } from '@prisma/client';

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
}
