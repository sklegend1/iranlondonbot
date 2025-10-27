-- CreateTable
CREATE TABLE "InviteLog" (
    "id" SERIAL NOT NULL,
    "operatorId" INTEGER,
    "telegramId" BIGINT,
    "username" TEXT,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InviteLog_operatorId_createdAt_idx" ON "InviteLog"("operatorId", "createdAt");

-- CreateIndex
CREATE INDEX "InviteLog_telegramId_createdAt_idx" ON "InviteLog"("telegramId", "createdAt");
