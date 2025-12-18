import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsEmail,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingSource } from '@prisma/client';

export class CustomerInfoDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+971501234567' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  showroomId: string;

  @ApiPropertyOptional({ description: 'Car model ID - if not provided, will auto-select available car' })
  @ValidateIf((o) => o.carModelId !== undefined)
  @IsUUID()
  carModelId?: string;

  @ApiPropertyOptional({ description: 'Slot hold ID from availability hold - optional for direct bookings' })
  @ValidateIf((o) => o.holdId !== undefined)
  @IsString()
  holdId?: string;

  @ApiProperty({ example: '2024-12-20' })
  @IsString()
  date: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  startTime: string;

  @ApiPropertyOptional({ example: '10:30', description: 'End time - will be auto-calculated if not provided' })
  @ValidateIf((o) => o.endTime !== undefined)
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ type: CustomerInfoDto })
  @ValidateIf((o) => o.customerInfo !== undefined)
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo?: CustomerInfoDto;

  @ApiPropertyOptional({ enum: BookingSource, default: BookingSource.WEB })
  @ValidateIf((o) => o.source !== undefined)
  @IsEnum(BookingSource)
  source?: BookingSource;

  @ApiPropertyOptional()
  @ValidateIf((o) => o.notes !== undefined)
  @IsString()
  notes?: string;
}

export class RescheduleBookingDto {
  @ApiProperty({ description: 'New slot hold ID' })
  @IsString()
  holdId: string;

  @ApiProperty({ example: '2024-12-21' })
  @IsString()
  date: string;

  @ApiProperty({ example: '14:00' })
  @IsString()
  startTime: string;

  @ApiProperty({ example: '14:30' })
  @IsString()
  endTime: string;
}
