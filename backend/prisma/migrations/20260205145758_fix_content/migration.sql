-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DojoMembership" ADD COLUMN     "gradeId" TEXT;

-- AddForeignKey
ALTER TABLE "DojoMembership" ADD CONSTRAINT "DojoMembership_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
