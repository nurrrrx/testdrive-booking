import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../config/redis.module';
import { UsersService } from '../users/users.service';
import { SendOtpDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly otpExpiry: number;
  private readonly otpLength: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    this.otpExpiry =
      this.configService.get<number>('OTP_EXPIRY_MINUTES') || 5;
    this.otpLength = this.configService.get<number>('OTP_LENGTH') || 6;
  }

  async sendOtp(dto: SendOtpDto): Promise<{ message: string; expiresIn: number }> {
    const { phone } = dto;

    // Generate OTP
    const otp = this.generateOtp();

    // Store OTP in Redis with expiry
    const key = `otp:${phone}`;
    await this.redis.setex(key, this.otpExpiry * 60, otp);

    // In production, send via WhatsApp/SMS
    // For now, log it (mock)
    console.log(`[OTP] Sending OTP ${otp} to ${phone}`);

    return {
      message: 'OTP sent successfully',
      expiresIn: this.otpExpiry * 60,
    };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
  ): Promise<{ accessToken: string; user: object }> {
    const { phone, otp } = dto;

    // Get stored OTP
    const key = `otp:${phone}`;
    const storedOtp = await this.redis.get(key);

    if (!storedOtp) {
      throw new BadRequestException('OTP expired or not found');
    }

    if (storedOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Delete OTP after successful verification
    await this.redis.del(key);

    // Find or create customer
    let user = await this.usersService.findByPhone(phone);

    if (!user) {
      // Create new customer
      const newCustomer = await this.usersService.createCustomer({ phone });
      user = await this.usersService.findById(newCustomer.id);
    }

    if (!user) {
      throw new BadRequestException('Failed to create user');
    }

    // Generate JWT
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async validateStaffLogin(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; user: object }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Password login not available. Please use SSO.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      showroomId: user.showroomId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        showroomId: user.showroomId,
      },
    };
  }

  private generateOtp(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.otpLength; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }
}
