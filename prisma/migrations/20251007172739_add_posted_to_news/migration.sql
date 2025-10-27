/*
  Warnings:

  - Made the column `content` on table `News` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "News" ADD COLUMN     "posted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "content" SET NOT NULL;
