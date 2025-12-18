import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OperatingHoursDto {
  @ApiProperty({ description: '0 = Sunday, 6 = Saturday', example: 1 })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  openTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  closeTime: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isClosed: boolean;
}

export class CreateShowroomDto {
  @ApiProperty({ example: 'City Center Showroom' })
  @IsString()
  name: string;

  @ApiProperty({ example: '123 Main Street, Downtown' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Dubai' })
  @IsString()
  city: string;

  @ApiProperty({ example: 25.2048 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 55.2708 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: '+97141234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'showroom@dealership.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ type: [OperatingHoursDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDto)
  operatingHours: OperatingHoursDto[];
}

export class UpdateShowroomDto {
  @ApiPropertyOptional({ example: 'City Center Showroom' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '123 Main Street, Downtown' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Dubai' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 25.2048 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 55.2708 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: '+97141234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'showroom@dealership.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ type: [OperatingHoursDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHoursDto)
  @IsOptional()
  operatingHours?: OperatingHoursDto[];

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
