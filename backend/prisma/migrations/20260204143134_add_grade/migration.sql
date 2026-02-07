/*
  Warnings:

  - Added the required column `gradeId` to the `UserStyle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserStyle" ADD COLUMN     "gradeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UserStyle" ADD CONSTRAINT "UserStyle_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
