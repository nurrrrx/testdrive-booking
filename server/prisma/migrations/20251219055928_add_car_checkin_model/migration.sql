-- CreateEnum
CREATE TYPE "CheckInType" AS ENUM ('RECEIVED', 'SENT_OUT', 'RETURNED', 'OUT_FOR_DRIVE');

-- CreateTable
CREATE TABLE "CarCheckIn" (
    "id" TEXT NOT NULL,
    "carUnitId" TEXT NOT NULL,
    "showroomId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "type" "CheckInType" NOT NULL,
    "notes" TEXT,
    "fromShowroomId" TEXT,
    "toShowroomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CarCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CarCheckIn_carUnitId_idx" ON "CarCheckIn"("carUnitId");

-- CreateIndex
CREATE INDEX "CarCheckIn_showroomId_idx" ON "CarCheckIn"("showroomId");

-- CreateIndex
CREATE INDEX "CarCheckIn_performedById_idx" ON "CarCheckIn"("performedById");

-- CreateIndex
CREATE INDEX "CarCheckIn_createdAt_idx" ON "CarCheckIn"("createdAt");

-- CreateIndex
CREATE INDEX "CarUnit_vin_idx" ON "CarUnit"("vin");

-- AddForeignKey
ALTER TABLE "CarCheckIn" ADD CONSTRAINT "CarCheckIn_carUnitId_fkey" FOREIGN KEY ("carUnitId") REFERENCES "CarUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarCheckIn" ADD CONSTRAINT "CarCheckIn_showroomId_fkey" FOREIGN KEY ("showroomId") REFERENCES "Showroom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarCheckIn" ADD CONSTRAINT "CarCheckIn_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarCheckIn" ADD CONSTRAINT "CarCheckIn_fromShowroomId_fkey" FOREIGN KEY ("fromShowroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarCheckIn" ADD CONSTRAINT "CarCheckIn_toShowroomId_fkey" FOREIGN KEY ("toShowroomId") REFERENCES "Showroom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
