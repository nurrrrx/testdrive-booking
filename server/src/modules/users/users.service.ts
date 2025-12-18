import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, CreateCustomerDto } from './dto/users.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        showroom: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        showroom: true,
      },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: {
        showroom: true,
      },
    });
  }

  async createCustomer(dto: CreateCustomerDto) {
    // Check if phone already exists
    const existing = await this.findByPhone(dto.phone);
    if (existing) {
      return existing;
    }

    return this.prisma.user.create({
      data: {
        phone: dto.phone,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.CUSTOMER,
        isActive: true,
      },
    });
  }

  async createStaff(dto: CreateUserDto) {
    // Check if email already exists
    if (dto.email) {
      const existing = await this.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('Email already registered');
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        showroomId: dto.showroomId,
        passwordHash,
        isActive: true,
      },
      include: {
        showroom: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Hash password if being updated
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        showroomId: dto.showroomId,
        passwordHash,
        isActive: dto.isActive,
      },
      include: {
        showroom: true,
      },
    });
  }

  async findAll(filters?: {
    role?: UserRole;
    showroomId?: string;
    isActive?: boolean;
  }) {
    return this.prisma.user.findMany({
      where: {
        role: filters?.role,
        showroomId: filters?.showroomId,
        isActive: filters?.isActive,
      },
      include: {
        showroom: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findSalesExecsByShowroom(showroomId: string) {
    return this.prisma.user.findMany({
      where: {
        showroomId,
        role: UserRole.SALES_EXECUTIVE,
        isActive: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  async deactivate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
