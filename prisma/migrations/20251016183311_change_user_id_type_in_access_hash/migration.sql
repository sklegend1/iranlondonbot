-- DropForeignKey
ALTER TABLE "public"."AccessHash" DROP CONSTRAINT "AccessHash_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."InviteLog" DROP CONSTRAINT "InviteLog_userId_fkey";

-- AlterTable
ALTER TABLE "AccessHash" ALTER COLUMN "userId" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "InviteLog" ALTER COLUMN "userId" SET DATA TYPE BIGINT;

-- AddForeignKey
ALTER TABLE "AccessHash" ADD CONSTRAINT "AccessHash_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ScrapedUser"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteLog" ADD CONSTRAINT "InviteLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ScrapedUser"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
