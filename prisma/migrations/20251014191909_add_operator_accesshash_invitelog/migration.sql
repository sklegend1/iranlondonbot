/*
  Warnings:

  - You are about to drop the column `telegramId` on the `InviteLog` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `InviteLog` table. All the data in the column will be lost.
  - You are about to drop the column `accessHash` on the `ScrapedUser` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."InviteLog_telegramId_createdAt_idx";

-- AlterTable
ALTER TABLE "InviteLog" DROP COLUMN "telegramId",
DROP COLUMN "username",
ADD COLUMN     "groupKey" TEXT,
ADD COLUMN     "method" TEXT,
ADD COLUMN     "userId" INTEGER;

-- AlterTable
ALTER TABLE "ScrapedUser" DROP COLUMN "accessHash";

-- CreateTable
CREATE TABLE "Operator" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "phone" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessHash" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "operatorId" INTEGER NOT NULL,
    "accessHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessHash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Operator_name_key" ON "Operator"("name");

-- CreateIndex
CREATE INDEX "AccessHash_operatorId_idx" ON "AccessHash"("operatorId");

-- CreateIndex
CREATE INDEX "AccessHash_userId_idx" ON "AccessHash"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessHash_userId_operatorId_key" ON "AccessHash"("userId", "operatorId");

-- CreateIndex
CREATE INDEX "InviteLog_userId_createdAt_idx" ON "InviteLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AccessHash" ADD CONSTRAINT "AccessHash_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ScrapedUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessHash" ADD CONSTRAINT "AccessHash_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteLog" ADD CONSTRAINT "InviteLog_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteLog" ADD CONSTRAINT "InviteLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "ScrapedUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
