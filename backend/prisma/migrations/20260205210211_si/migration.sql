/*
  Warnings:

  - You are about to drop the column `gradeId` on the `DojoMembership` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DojoMembership" DROP CONSTRAINT "DojoMembership_gradeId_fkey";

-- AlterTable
ALTER TABLE "DojoMembership" DROP COLUMN "gradeId";
