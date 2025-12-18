import { PrismaClient, UserRole, FuelType, Transmission, CarUnitStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Showrooms (Lexus UAE Showrooms)
  const showroom1 = await prisma.showroom.create({
    data: {
      name: 'Lexus Al Futtaim Dubai',
      address: 'Sheikh Zayed Road, Near Mall of the Emirates',
      city: 'Dubai',
      latitude: 25.1180,
      longitude: 55.2003,
      phone: '+97148052222',
      email: 'dubai@lexus.ae',
      operatingHours: [
        { dayOfWeek: 0, openTime: '10:00', closeTime: '22:00', isClosed: false }, // Sunday
        { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false }, // Monday
        { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false }, // Tuesday
        { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false }, // Wednesday
        { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isClosed: false }, // Thursday
        { dayOfWeek: 5, openTime: '14:00', closeTime: '22:00', isClosed: false }, // Friday
        { dayOfWeek: 6, openTime: '10:00', closeTime: '22:00', isClosed: false }, // Saturday
      ],
    },
  });

  const showroom2 = await prisma.showroom.create({
    data: {
      name: 'Lexus Abu Dhabi',
      address: 'Corniche Road, Al Bateen',
      city: 'Abu Dhabi',
      latitude: 24.4652,
      longitude: 54.3555,
      phone: '+97126267777',
      email: 'abudhabi@lexus.ae',
      operatingHours: [
        { dayOfWeek: 0, openTime: '10:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isClosed: false },
        { dayOfWeek: 5, openTime: '14:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 6, openTime: '10:00', closeTime: '22:00', isClosed: false },
      ],
    },
  });

  console.log('Created showrooms');

  // Create Lexus Car Models
  const lexusLX = await prisma.carModel.create({
    data: {
      brand: 'Lexus',
      model: 'LX 700h',
      year: 2026,
      variant: 'Ultra Luxury',
      fuelType: FuelType.HYBRID,
      transmission: Transmission.AUTOMATIC,
      imageUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400',
      specs: {
        engineCapacity: '3.5L V6 Twin-Turbo Hybrid',
        power: '480 HP Combined',
        torque: '650 Nm',
        acceleration: '0-100 km/h in 5.4s',
        topSpeed: '250 km/h',
        fuelEfficiency: '8.9 L/100km',
      },
    },
  });

  const lexusRX = await prisma.carModel.create({
    data: {
      brand: 'Lexus',
      model: 'RX 350h',
      year: 2025,
      variant: 'F Sport',
      fuelType: FuelType.HYBRID,
      transmission: Transmission.AUTOMATIC,
      imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
      specs: {
        engineCapacity: '2.5L 4-Cylinder Hybrid',
        power: '246 HP Combined',
        torque: '400 Nm',
        acceleration: '0-100 km/h in 7.9s',
        topSpeed: '200 km/h',
        fuelEfficiency: '6.0 L/100km',
      },
    },
  });

  const lexusES = await prisma.carModel.create({
    data: {
      brand: 'Lexus',
      model: 'ES 350',
      year: 2025,
      variant: 'Luxury',
      fuelType: FuelType.PETROL,
      transmission: Transmission.AUTOMATIC,
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
      thumbnailUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',
      specs: {
        engineCapacity: '3.5L V6',
        power: '302 HP',
        torque: '362 Nm',
        acceleration: '0-100 km/h in 6.6s',
        topSpeed: '210 km/h',
        fuelEfficiency: '9.5 L/100km',
      },
    },
  });

  console.log('Created car models');

  // Create Car Units at showrooms
  await prisma.carUnit.createMany({
    data: [
      // Dubai Showroom
      { carModelId: lexusLX.id, showroomId: showroom1.id, color: 'Sonic Titanium', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusLX.id, showroomId: showroom1.id, color: 'Black Onyx', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusRX.id, showroomId: showroom1.id, color: 'Sonic Chrome', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusRX.id, showroomId: showroom1.id, color: 'Matador Red Mica', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusES.id, showroomId: showroom1.id, color: 'Ultra White', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusES.id, showroomId: showroom1.id, color: 'Nightfall Mica', status: CarUnitStatus.AVAILABLE },
      // Abu Dhabi Showroom
      { carModelId: lexusLX.id, showroomId: showroom2.id, color: 'Nori Green Pearl', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusLX.id, showroomId: showroom2.id, color: 'Sonic Quartz', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusRX.id, showroomId: showroom2.id, color: 'Caviar', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusRX.id, showroomId: showroom2.id, color: 'Cloudburst Gray', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusES.id, showroomId: showroom2.id, color: 'Atomic Silver', status: CarUnitStatus.AVAILABLE },
      { carModelId: lexusES.id, showroomId: showroom2.id, color: 'Grecian Water', status: CarUnitStatus.AVAILABLE },
    ],
  });

  console.log('Created car units');

  // Create Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@lexus.ae',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Create Showroom Managers
  const managerPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.create({
    data: {
      email: 'manager.dubai@lexus.ae',
      passwordHash: managerPassword,
      firstName: 'Ahmed',
      lastName: 'Al Maktoum',
      role: UserRole.SHOWROOM_MANAGER,
      showroomId: showroom1.id,
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: 'manager.abudhabi@lexus.ae',
      passwordHash: managerPassword,
      firstName: 'Fatima',
      lastName: 'Al Nahyan',
      role: UserRole.SHOWROOM_MANAGER,
      showroomId: showroom2.id,
      isActive: true,
    },
  });

  // Create Sales Executives
  const salesPassword = await bcrypt.hash('sales123', 10);
  const salesExec1 = await prisma.user.create({
    data: {
      email: 'khalid.sales@lexus.ae',
      phone: '+971501111111',
      passwordHash: salesPassword,
      firstName: 'Khalid',
      lastName: 'Hassan',
      role: UserRole.SALES_EXECUTIVE,
      showroomId: showroom1.id,
      isActive: true,
    },
  });

  const salesExec2 = await prisma.user.create({
    data: {
      email: 'sara.sales@lexus.ae',
      phone: '+971502222222',
      passwordHash: salesPassword,
      firstName: 'Sara',
      lastName: 'Abdullah',
      role: UserRole.SALES_EXECUTIVE,
      showroomId: showroom1.id,
      isActive: true,
    },
  });

  const salesExec3 = await prisma.user.create({
    data: {
      email: 'omar.sales@lexus.ae',
      phone: '+971503333333',
      passwordHash: salesPassword,
      firstName: 'Omar',
      lastName: 'Rashid',
      role: UserRole.SALES_EXECUTIVE,
      showroomId: showroom2.id,
      isActive: true,
    },
  });

  const salesExec4 = await prisma.user.create({
    data: {
      email: 'layla.sales@lexus.ae',
      phone: '+971504444444',
      passwordHash: salesPassword,
      firstName: 'Layla',
      lastName: 'Mohammed',
      role: UserRole.SALES_EXECUTIVE,
      showroomId: showroom2.id,
      isActive: true,
    },
  });

  // Create Call Center Agent
  const agentPassword = await bcrypt.hash('agent123', 10);
  await prisma.user.create({
    data: {
      email: 'agent@lexus.ae',
      passwordHash: agentPassword,
      firstName: 'Noor',
      lastName: 'Ali',
      role: UserRole.CALL_CENTER_AGENT,
      isActive: true,
    },
  });

  console.log('Created users');

  // Create sample schedules for sales executives (next 60 days)
  const today = new Date();
  const salesExecs = [salesExec1, salesExec2, salesExec3, salesExec4];

  for (let i = 0; i < 60; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();

    // Skip Fridays (day 5)
    if (dayOfWeek === 5) {
      continue;
    }

    for (const exec of salesExecs) {
      // Determine working hours based on day
      let availableFrom = '09:00';
      let availableTo = '18:00';

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        // Sunday or Saturday
        availableFrom = '10:00';
        availableTo = '20:00';
      }

      await prisma.salesExecSchedule.create({
        data: {
          userId: exec.id,
          date: date,
          availableFrom,
          availableTo,
        },
      });
    }
  }

  console.log('Created sales exec schedules for 60 days');

  // Create a sample customer
  await prisma.user.create({
    data: {
      phone: '+971505555555',
      email: 'customer@example.com',
      firstName: 'Mohammed',
      lastName: 'Al Rashid',
      role: UserRole.CUSTOMER,
      isActive: true,
    },
  });

  console.log('Seed completed successfully!');
  console.log('');
  console.log('=================================');
  console.log('   LEXUS UAE - Test Credentials');
  console.log('=================================');
  console.log('');
  console.log('Admin:');
  console.log('  Email: admin@lexus.ae');
  console.log('  Password: admin123');
  console.log('');
  console.log('Showroom Manager (Dubai):');
  console.log('  Email: manager.dubai@lexus.ae');
  console.log('  Password: manager123');
  console.log('');
  console.log('Showroom Manager (Abu Dhabi):');
  console.log('  Email: manager.abudhabi@lexus.ae');
  console.log('  Password: manager123');
  console.log('');
  console.log('Sales Executive:');
  console.log('  Email: khalid.sales@lexus.ae');
  console.log('  Password: sales123');
  console.log('');
  console.log('Call Center Agent:');
  console.log('  Email: agent@lexus.ae');
  console.log('  Password: agent123');
  console.log('');
  console.log('Customer (OTP Login):');
  console.log('  Phone: +971505555555');
  console.log('');
  console.log('=================================');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
