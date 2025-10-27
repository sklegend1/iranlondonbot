-- CreateTable
CREATE TABLE "TargetGroup" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "username" TEXT,
    "title" TEXT,
    "memberCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetGroupMember" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "userId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "status" TEXT NOT NULL,
    "lastSeen" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TargetGroup_key_key" ON "TargetGroup"("key");

-- CreateIndex
CREATE INDEX "TargetGroupMember_userId_idx" ON "TargetGroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TargetGroupMember_groupId_userId_key" ON "TargetGroupMember"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "TargetGroupMember" ADD CONSTRAINT "TargetGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TargetGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
