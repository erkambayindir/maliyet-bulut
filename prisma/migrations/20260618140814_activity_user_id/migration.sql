-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
