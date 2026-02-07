/*
  Warnings:

  - You are about to drop the column `studentId` on the `StudentGrade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,dojoId]` on the table `StudentGrade` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `StudentGrade` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StudentGrade" DROP CONSTRAINT "StudentGrade_studentId_fkey";

-- DropIndex
DROP INDEX "StudentGrade_studentId_dojoId_key";

-- AlterTable
ALTER TABLE "StudentGrade" DROP COLUMN "studentId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StudentGrade_userId_dojoId_key" ON "StudentGrade"("userId", "dojoId");

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
