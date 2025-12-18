import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  StaffLoginDto,
  OtpResponseDto,
  AuthResponseDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: OtpResponseDto,
  })
  async sendOtp(@Body() dto: SendOtpDto): Promise<OtpResponseDto> {
    return this.authService.sendOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and get access token' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified, returns access token',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'OTP expired or not found' })
  @ApiResponse({ status: 401, description: 'Invalid OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<AuthResponseDto> {
    return this.authService.verifyOtp(dto);
  }

  @Post('staff/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Staff login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async staffLogin(@Body() dto: StaffLoginDto): Promise<AuthResponseDto> {
    return this.authService.validateStaffLogin(dto.email, dto.password);
  }
}
