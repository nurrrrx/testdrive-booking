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
import { ShowroomsService } from './showrooms.service';
import { CreateShowroomDto, UpdateShowroomDto } from './dto/showrooms.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('showrooms')
@Controller('showrooms')
export class ShowroomsController {
  constructor(private readonly showroomsService: ShowroomsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all showrooms' })
  @ApiQuery({ name: 'city', required: false })
  async findAll(@Query('city') city?: string) {
    return this.showroomsService.findAll({ city, isActive: true });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get showroom by ID' })
  async findOne(@Param('id') id: string) {
    return this.showroomsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new showroom (admin only)' })
  @ApiResponse({ status: 201, description: 'Showroom created successfully' })
  async create(@Body() dto: CreateShowroomDto) {
    return this.showroomsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update showroom (admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateShowroomDto) {
    return this.showroomsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate showroom (admin only)' })
  async deactivate(@Param('id') id: string) {
    return this.showroomsService.deactivate(id);
  }
}
