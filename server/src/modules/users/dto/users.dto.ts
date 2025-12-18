import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  Matches,
  IsUUID,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ example: '+971501234567' })
  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/)
  phone: string;

  @ApiPropertyOptional({ example: 'customer@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'staff@dealership.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '+971501234567' })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{9,14}$/)
  phone?: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SALES_EXECUTIVE })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ description: 'Showroom ID for showroom-assigned roles' })
  @IsUUID()
  @IsOptional()
  showroomId?: string;

  @ApiPropertyOptional({ minLength: 6 })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'staff@dealership.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+971501234567' })
  @IsString()
  @IsOptional()
  @Matches(/^\+?[1-9]\d{9,14}$/)
  phone?: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  showroomId?: string;

  @ApiPropertyOptional({ minLength: 6 })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
