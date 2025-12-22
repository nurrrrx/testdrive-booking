# Lexus UAE Test Drive Booking System

A test drive booking platform for Lexus UAE dealerships.

---

## Project Components

| Component | Technology | Location | Purpose |
|-----------|------------|----------|---------|
| **Web Dashboard** | Next.js 15 | `/web` | Staff dashboard & customer booking |
| **Backend API** | NestJS | `/server` | REST API & business logic |
| **Mobile App** | React Native / Expo | `/mobile` | Staff app for check-ins & bookings |
| **Database** | PostgreSQL | Railway | Data storage |

---

## Live URLs

- **Website**: https://testdrive-booking-web.vercel.app
- **Backend API**: https://testdrive-booking-production.up.railway.app/api
- **Swagger Docs**: https://testdrive-booking-production.up.railway.app/api/docs
- **Mobile App**: Scan QR code from EC2 Expo tunnel

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lexus.ae` | `admin123` |
| Manager (Dubai) | `manager.dubai@lexus.ae` | `manager123` |
| Manager (Abu Dhabi) | `manager.abudhabi@lexus.ae` | `manager123` |
| Sales Executive | `khalid.sales@lexus.ae` | `sales123` |
| Call Center Agent | `agent@lexus.ae` | `agent123` |

---

## Running Locally

### Prerequisites
- Node.js 18+
- Docker (for database)

### 1. Start Database
```bash
docker-compose up -d
```

### 2. Run Backend Server
```bash
cd server
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```
Backend runs at: http://localhost:3001

### 3. Run Web Dashboard
```bash
cd web
npm install
npm run dev
```
Web runs at: http://localhost:3000

### 4. Run Mobile App
```bash
cd mobile
npm install
npx expo start
```
Scan QR code with Expo Go app on your phone.

---

## GitHub Workflow

### Pull Latest Code from GitHub (Update Local)
```bash
cd /path/to/TestDriveBooking
git pull origin main
```

### Push Local Changes to GitHub
```bash
cd /path/to/TestDriveBooking
git add .
git commit -m "Your message"
git push origin main
```

---

## EC2 Server

### Connection Details
- **IP Address**: `<YOUR-EC2-PUBLIC-IP>`
- **User**: `ubuntu`
- **Key File**: `your-key.pem`

### SSH into EC2
```bash
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>
```

### Pull Latest Code on EC2
```bash
cd ~/testdrive-booking
git pull origin main
cd mobile
npm install
```

### Push Changes from EC2 to GitHub
```bash
cd ~/testdrive-booking
git add .
git commit -m "Your message"
git push origin main
```

### Start Mobile App Server
```bash
cd ~/testdrive-booking/mobile
npx expo start --tunnel
```

### Keep Server Running (Background)
```bash
# Using screen
screen -S expo
npx expo start --tunnel
# Press Ctrl+A, then D to detach

# Reattach later
screen -r expo
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Pull from GitHub | `git pull origin main` |
| Push to GitHub | `git add . && git commit -m "msg" && git push origin main` |
| SSH to EC2 | `ssh -i your-key.pem ubuntu@<EC2-IP>` |
| Start mobile server | `npx expo start --tunnel` |
| Start web locally | `cd web && npm run dev` |
| Start backend locally | `cd server && npm run start:dev` |