/*
  Warnings:

  - A unique constraint covering the columns `[link]` on the table `News` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `link` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publishedAt` to the `News` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "News" ADD COLUMN     "link" TEXT NOT NULL,
ADD COLUMN     "publishedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "News_link_key" ON "News"("link");
