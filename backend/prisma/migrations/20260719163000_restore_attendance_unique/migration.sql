-- Normalize duplicate attendance rows (keep newest) before restoring uniqueness.
-- Dates may differ by time-of-day; we collapse by (dojoId, userId, calendar day in UTC).

DELETE FROM "Attendance" a
USING "Attendance" b
WHERE a."dojoId" = b."dojoId"
  AND a."userId" = b."userId"
  AND date_trunc('day', a."date") = date_trunc('day', b."date")
  AND a."id" < b."id";

-- Normalize remaining dates to start of day (UTC) so unique key is stable.
UPDATE "Attendance"
SET "date" = date_trunc('day', "date");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_dojoId_userId_date_key" ON "Attendance"("dojoId", "userId", "date");

-- CreateIndex
CREATE INDEX "Attendance_dojoId_date_idx" ON "Attendance"("dojoId", "date");

-- CreateIndex
CREATE INDEX "Attendance_userId_date_idx" ON "Attendance"("userId", "date");
