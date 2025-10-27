-- AlterTable
ALTER TABLE "TargetGroupMember" ADD COLUMN     "addedBy" INTEGER,
ADD COLUMN     "canShareLinks" BOOLEAN DEFAULT false;
