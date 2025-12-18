import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  Matches,
} from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'Phone number with country code',
    example: '+971501234567',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{9,14}$/, {
    message: 'Invalid phone number format',
  })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number with country code',
    example: '+971501234567',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{9,14}$/, {
    message: 'Invalid phone number format',
  })
  phone: string;

  @ApiProperty({
    description: 'OTP received via SMS/WhatsApp',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(4)
  otp: string;
}

export class StaffLoginDto {
  @ApiProperty({
    description: 'Staff email address',
    example: 'staff@dealership.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class OtpResponseDto {
  @ApiProperty({ example: 'OTP sent successfully' })
  message: string;

  @ApiProperty({ description: 'Expiry time in seconds', example: 300 })
  expiresIn: number;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  firstName?: string;

  @ApiProperty({ required: false })
  lastName?: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ required: false })
  showroomId?: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: object;
}
