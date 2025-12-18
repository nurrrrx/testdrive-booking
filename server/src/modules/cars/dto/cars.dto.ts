import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsUrl,
  IsObject,
} from 'class-validator';
import { FuelType, Transmission, CarUnitStatus } from '@prisma/client';

export class CarSpecsDto {
  @ApiPropertyOptional({ example: '2.0L' })
  engineCapacity?: string;

  @ApiPropertyOptional({ example: '250 HP' })
  power?: string;

  @ApiPropertyOptional({ example: '350 Nm' })
  torque?: string;

  @ApiPropertyOptional({ example: '0-100 km/h in 6.5s' })
  acceleration?: string;

  @ApiPropertyOptional({ example: '250 km/h' })
  topSpeed?: string;

  @ApiPropertyOptional({ example: '8.5 L/100km' })
  fuelEfficiency?: string;

  @ApiPropertyOptional({ example: '500 km' })
  range?: string;
}

export class CreateCarModelDto {
  @ApiProperty({ example: 'BMW' })
  @IsString()
  brand: string;

  @ApiProperty({ example: 'X5' })
  @IsString()
  model: string;

  @ApiProperty({ example: 2024 })
  @IsNumber()
  year: number;

  @ApiPropertyOptional({ example: 'xDrive40i' })
  @IsString()
  @IsOptional()
  variant?: string;

  @ApiProperty({ enum: FuelType, example: FuelType.PETROL })
  @IsEnum(FuelType)
  fuelType: FuelType;

  @ApiProperty({ enum: Transmission, example: Transmission.AUTOMATIC })
  @IsEnum(Transmission)
  transmission: Transmission;

  @ApiPropertyOptional({ example: 'https://example.com/bmw-x5.jpg' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/bmw-x5-thumb.jpg' })
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ type: CarSpecsDto })
  @IsObject()
  @IsOptional()
  specs?: CarSpecsDto;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isAvailableForTestDrive?: boolean;
}

export class UpdateCarModelDto {
  @ApiPropertyOptional({ example: 'BMW' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ example: 'X5' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ example: 'xDrive40i' })
  @IsString()
  @IsOptional()
  variant?: string;

  @ApiPropertyOptional({ enum: FuelType })
  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @ApiPropertyOptional({ enum: Transmission })
  @IsEnum(Transmission)
  @IsOptional()
  transmission?: Transmission;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ type: CarSpecsDto })
  @IsObject()
  @IsOptional()
  specs?: CarSpecsDto;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isAvailableForTestDrive?: boolean;
}

export class CreateCarUnitDto {
  @ApiProperty()
  @IsUUID()
  carModelId: string;

  @ApiProperty()
  @IsUUID()
  showroomId: string;

  @ApiPropertyOptional({ example: 'WBA5A5C55FD123456' })
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiPropertyOptional({ example: 'Alpine White' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ enum: CarUnitStatus, default: CarUnitStatus.AVAILABLE })
  @IsEnum(CarUnitStatus)
  @IsOptional()
  status?: CarUnitStatus;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isDemoOnly?: boolean;
}

export class UpdateCarUnitDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  showroomId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ enum: CarUnitStatus })
  @IsEnum(CarUnitStatus)
  @IsOptional()
  status?: CarUnitStatus;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDemoOnly?: boolean;
}
