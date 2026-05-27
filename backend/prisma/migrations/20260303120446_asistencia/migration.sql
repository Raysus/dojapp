/*
  Warnings:

  - A unique constraint covering the columns `[dojoId,userId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Attendance_dojoId_date_idx" ON "Attendance"("dojoId", "date");

-- CreateIndex
CREATE INDEX "Attendance_userId_date_idx" ON "Attendance"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_dojoId_userId_date_key" ON "Attendance"("dojoId", "userId", "date");
