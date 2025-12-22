# Lexus UAE Test Drive Booking System

A complete test drive booking platform for Lexus UAE dealerships with web dashboard, backend API, and mobile staff app.

---

## Architecture Overview

| Component | Technology | Deployment |
|-----------|------------|------------|
| **Web Dashboard** | Next.js 15 | Vercel |
| **Backend API** | NestJS | Railway |
| **Mobile App** | React Native / Expo | EC2 (Expo tunnel) |
| **Database** | PostgreSQL | Railway |

---

## Live URLs

- **Website**: https://testdrive-booking-web.vercel.app
- **Backend API**: https://testdrive-booking-production.up.railway.app/api
- **Mobile App**: Scan QR code from Expo tunnel (see Mobile section)

---

## Test Credentials

### Admin
- **Email**: `admin@lexus.ae`
- **Password**: `admin123`

### Showroom Manager (Dubai)
- **Email**: `manager.dubai@lexus.ae`
- **Password**: `manager123`

### Showroom Manager (Abu Dhabi)
- **Email**: `manager.abudhabi@lexus.ae`
- **Password**: `manager123`

### Sales Executive
- **Email**: `khalid.sales@lexus.ae`
- **Password**: `sales123`

### Call Center Agent
- **Email**: `agent@lexus.ae`
- **Password**: `agent123`

### Customer (OTP Login - Web only)
- **Phone**: `+971505555555`

---

## Web Dashboard

### Access
1. Go to https://testdrive-booking-web.vercel.app
2. Click "Staff Login" or go to `/login`
3. Enter email and password from credentials above
4. Click "Sign In"

### Features by Role

| Role | Can Access |
|------|------------|
| Admin | All pages, all showrooms |
| Showroom Manager | Dashboard, Bookings, Cars, Schedule (own showroom) |
| Sales Executive | Dashboard, Bookings, My Schedule |
| Call Center Agent | Dashboard, Bookings, Create bookings |

### Key Pages
- `/` - Home page (public test drive booking)
- `/login` - Staff login
- `/dashboard` - Main dashboard with analytics
- `/dashboard/bookings` - Manage bookings
- `/dashboard/cars` - Car inventory management
- `/dashboard/schedule` - Team schedule management

---

## Mobile App (Staff)

### Running the Mobile App

#### On EC2 Server
```bash
# SSH into EC2
ssh ubuntu@<ec2-ip>

# Navigate to mobile folder
cd ~/testdrive-booking/mobile

# Pull latest changes
git pull

# Install dependencies
npm install

# Start Expo tunnel
npx expo start --tunnel
```

#### Scan QR Code
1. Install **Expo Go** app on your phone (iOS App Store / Google Play)
2. Scan the QR code shown in terminal
3. App will load on your phone

### Login on Mobile
1. Open the app via Expo Go
2. Enter staff email (e.g., `khalid.sales@lexus.ae`)
3. Enter password (e.g., `sales123`)
4. Tap "Sign In"

### Mobile App Features

| Tab | Description |
|-----|-------------|
| **Home** | Today's bookings, quick actions |
| **Check-In** | Scan VIN barcode, record car movements |
| **Cars** | View car inventory, filter by status |
| **My Schedule** | View/set your availability (Sales Exec) |
| **Team Schedule** | Manage team schedules (Manager only) |
| **Profile** | User info, logout |

### Creating a New Booking (Walk-in)
1. Go to Home tab
2. Tap "+" button in header
3. Select car model
4. Pick date and time slot
5. Enter customer details
6. Tap "Create Booking"

---

## Backend Server

### API Base URL
```
https://testdrive-booking-production.up.railway.app/api
```

### Swagger API Documentation

Interactive API documentation is available at:
```
https://testdrive-booking-production.up.railway.app/api/docs
```

Open this URL in your browser to:
- View all available endpoints
- See request/response schemas
- Test API calls directly from the browser
- Download OpenAPI specification

---

## Testing APIs with Postman

### Setup Postman

1. Download Postman: https://www.postman.com/downloads/
2. Create a new Collection called "TestDrive Booking API"
3. Set a variable `baseUrl` = `https://testdrive-booking-production.up.railway.app/api`

### Step 1: Login to Get Token

**Request:**
```
POST {{baseUrl}}/auth/staff/login
Content-Type: application/json

{
  "email": "admin@lexus.ae",
  "password": "admin123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@lexus.ae",
    "role": "ADMIN"
  }
}
```

### Step 2: Set Authorization Header

For all subsequent requests, add the header:
```
Authorization: Bearer <accessToken>
```

In Postman:
1. Go to Collection > Authorization tab
2. Type: Bearer Token
3. Token: `{{accessToken}}`
4. Save the token from login response to this variable

### Example API Calls

#### Get All Showrooms (No Auth Required)
```
GET {{baseUrl}}/showrooms
```

#### Get Car Models (No Auth Required)
```
GET {{baseUrl}}/cars/models
```

#### Get Available Time Slots
```
GET {{baseUrl}}/availability/showrooms/{showroomId}/slots?date=2024-12-23
```

#### Get Today's Bookings (Auth Required)
```
GET {{baseUrl}}/bookings?date=2024-12-22
Authorization: Bearer {{accessToken}}
```

#### Create a Booking (Auth Required)
```
POST {{baseUrl}}/bookings
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "showroomId": "showroom-uuid-here",
  "carModelId": "car-model-uuid-here",
  "date": "2024-12-23",
  "startTime": "10:00",
  "customerInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+971501234567",
    "email": "john@example.com"
  },
  "source": "WALK_IN",
  "notes": "VIP customer"
}
```

#### Mark Booking Complete (Auth Required)
```
PATCH {{baseUrl}}/bookings/{bookingId}/complete
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "notes": "Customer completed test drive successfully"
}
```

#### Get Car Units at Showroom (Auth Required)
```
GET {{baseUrl}}/cars/units?showroomId={showroomId}
Authorization: Bearer {{accessToken}}
```

#### Record Car Check-In (Auth Required)
```
POST {{baseUrl}}/cars/check-in
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "carUnitId": "car-unit-uuid-here",
  "type": "RECEIVED",
  "notes": "Car received from service"
}
```

Check-in types: `RECEIVED`, `SENT_OUT`, `RETURNED`, `OUT_FOR_DRIVE`

#### Get My Schedule (Sales Exec - Auth Required)
```
GET {{baseUrl}}/scheduling/my?startDate=2024-12-22&endDate=2024-12-28
Authorization: Bearer {{accessToken}}
```

#### Set Availability (Auth Required)
```
POST {{baseUrl}}/scheduling/availability
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "date": "2024-12-23",
  "availableFrom": "09:00",
  "availableTo": "18:00"
}
```

### Quick Reference: Key Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/staff/login` | POST | No | Staff login |
| `/auth/customer/request-otp` | POST | No | Customer OTP request |
| `/showrooms` | GET | No | List showrooms |
| `/cars/models` | GET | No | List car models |
| `/availability/showrooms/:id/slots` | GET | No | Get available slots |
| `/bookings` | GET | Yes | List bookings |
| `/bookings` | POST | Yes | Create booking |
| `/bookings/:id` | GET | Yes | Get booking details |
| `/bookings/:id/complete` | PATCH | Yes | Mark complete |
| `/bookings/:id/cancel` | PATCH | Yes | Cancel booking |
| `/bookings/:id/no-show` | PATCH | Yes | Mark no-show |
| `/cars/units` | GET | Yes | List car units |
| `/cars/units/:id/status` | PATCH | Yes | Update car status |
| `/cars/check-in` | POST | Yes | Record check-in |
| `/cars/check-in/history` | GET | Yes | Check-in history |
| `/scheduling/my` | GET | Yes | My schedule |
| `/scheduling/team` | GET | Yes | Team schedule (Manager) |
| `/scheduling/availability` | POST | Yes | Set availability |
| `/health` | GET | No | Health check |

### Import Swagger to Postman

1. Open Postman
2. Click "Import" button
3. Select "Link" tab
4. Enter: `https://testdrive-booking-production.up.railway.app/api/docs-json`
5. Click "Import"
6. All endpoints will be imported automatically

---

### Running Backend Locally
```bash
cd server

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Start server
npm run start:dev
```

---

## Initial Setup: GitHub Repository

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `testdrive-booking`
3. Set to Private (recommended)
4. Click "Create repository"

### Step 2: Push Code to GitHub

```bash
# Navigate to project root
cd /path/to/TestDriveBooking

# Initialize git (if not already)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: TestDrive Booking System"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/testdrive-booking.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify Upload

Go to your GitHub repository URL to confirm all files are uploaded.

---

## EC2 Setup (First Time)

### Step 1: Launch EC2 Instance

1. Go to AWS Console > EC2 > Launch Instance
2. **Name**: `testdrive-mobile-server`
3. **AMI**: Ubuntu Server 22.04 LTS
4. **Instance type**: t2.micro (free tier) or t2.small
5. **Key pair**: Create new or use existing (.pem file)
6. **Security Group**: Allow SSH (22), HTTP (80), HTTPS (443)
7. Click "Launch Instance"

### Step 2: Connect to EC2

```bash
# Make key file secure
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Step 3: Install Node.js on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install git
sudo apt install -y git
```

### Step 4: Clone Repository on EC2

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/YOUR_USERNAME/testdrive-booking.git

# Navigate to mobile folder
cd testdrive-booking/mobile

# Install dependencies
npm install

# Install Expo CLI globally
npm install -g expo-cli @expo/ngrok
```

### Step 5: Start Mobile Development Server

```bash
# Start Expo with tunnel
npx expo start --tunnel
```

Scan the QR code with Expo Go app on your phone.

---

## EC2: Running in Background (Keep Server Running)

### Option 1: Using Screen (Simple)

```bash
# Install screen
sudo apt install -y screen

# Create new screen session
screen -S expo

# Start Expo
cd ~/testdrive-booking/mobile
npx expo start --tunnel

# Detach from screen: Press Ctrl+A, then D

# Reattach later
screen -r expo

# List all screens
screen -ls
```

### Option 2: Using PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Create startup script
cd ~/testdrive-booking/mobile

# Start with PM2
pm2 start "npx expo start --tunnel" --name expo-server

# Save PM2 config
pm2 save

# Auto-start on reboot
pm2 startup
# Run the command it outputs

# View logs
pm2 logs expo-server

# Stop server
pm2 stop expo-server

# Restart server
pm2 restart expo-server
```

---

## Deployment Workflow

### Deploying Changes to GitHub

From your local machine:

```bash
# Navigate to project
cd /path/to/TestDriveBooking

# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

### Deploying to EC2 (Pull Latest Changes)

SSH into EC2 and pull:

```bash
# Connect to EC2
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# Pull latest changes
cd ~/testdrive-booking
git pull origin main

# Go to mobile and install any new dependencies
cd mobile
npm install

# Restart Expo (if using PM2)
pm2 restart expo-server

# Or if using screen, reattach and restart
screen -r expo
# Press Ctrl+C to stop, then:
npx expo start --tunnel
```

### Deploying Web (Vercel)

Vercel auto-deploys when you push to GitHub.

Manual deploy:
```bash
cd web
npx vercel --prod
```

### Deploying Backend (Railway)

Railway auto-deploys when you push to GitHub.

Check dashboard: https://railway.app

---

## Quick Deploy Commands

### From Local Machine (One Command)

```bash
# Add, commit, and push
git add . && git commit -m "Update" && git push origin main
```

### On EC2 (One Command)

```bash
# Pull and restart
cd ~/testdrive-booking && git pull && cd mobile && npm install && pm2 restart expo-server
```

---

## EC2 Troubleshooting

### Can't connect to EC2
```bash
# Check if instance is running in AWS Console
# Verify security group allows SSH (port 22)
# Check your IP hasn't changed (update security group)
```

### Expo tunnel not working
```bash
# Kill any existing processes
pkill -f expo

# Clear npm cache
npm cache clean --force

# Reinstall ngrok
npm install -g @expo/ngrok

# Try again
npx expo start --tunnel --clear
```

### Out of memory on t2.micro
```bash
# Create swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Check running processes
```bash
# View PM2 processes
pm2 list

# View all node processes
ps aux | grep node

# Kill all node processes
pkill -f node
```

---

## Database Management

### Railway Database
- **Host**: `ballast.proxy.rlwy.net`
- **Port**: `14140`
- **Database**: `railway`

### Prisma Commands
```bash
cd server

# View database in browser
npx prisma studio

# Run migrations
npx prisma migrate dev

# Reset and reseed database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

### Seeding Database
```bash
cd server
npx prisma db seed
```

This creates:
- 2 showrooms (Dubai, Abu Dhabi)
- 3 car models (LX 700h, RX 350h, ES 350)
- 12 car units
- Admin, managers, sales executives, call center agent
- 60 days of sales exec schedules

---

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker (for local database)

### Start Local Database
```bash
docker-compose up -d
```

### Run All Services
```bash
# Terminal 1 - Backend
cd server
npm run start:dev

# Terminal 2 - Web
cd web
npm run dev

# Terminal 3 - Mobile
cd mobile
npx expo start
```

### Environment Variables

#### Server (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/testdrive
JWT_SECRET=your-secret-key
```

#### Web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### Mobile
Uses Railway backend by default. To use local:
```
EXPO_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Troubleshooting

### Mobile app not loading
1. Run `npm install` on EC2
2. Check if tunnel is running: `npx expo start --tunnel`
3. Make sure Expo Go app is installed on phone

### Images not showing
- Car images are served from Unsplash CDN
- If images don't load, check network connectivity

### Login not working
1. Verify credentials from "Test Credentials" section
2. Check backend is running: https://testdrive-booking-production.up.railway.app/api/health
3. Check browser console for errors

### Database issues
```bash
# Reset and reseed
cd server
npx prisma migrate reset
npx prisma db seed
```

---

## Project Structure

```
TestDriveBooking/
├── web/                    # Next.js web dashboard
│   ├── src/app/           # App router pages
│   ├── src/components/    # React components
│   ├── src/hooks/         # React Query hooks
│   └── src/lib/           # API client, utilities
│
├── server/                 # NestJS backend API
│   ├── src/               # Source code
│   ├── prisma/            # Database schema & migrations
│   └── prisma/seed.ts     # Database seeder
│
├── mobile/                 # React Native / Expo app
│   ├── app/               # Expo Router screens
│   ├── components/        # React Native components
│   ├── stores/            # Zustand stores
│   └── lib/               # API client
│
└── docker-compose.yml      # Local dev database
```

---

## Support

For issues or questions, check the codebase or contact the development team.