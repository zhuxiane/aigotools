/*
  Warnings:

  - You are about to drop the column `links` on the `sites` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sites" DROP COLUMN "links";

-- CreateTable
CREATE TABLE "Link" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Link_siteId_key" ON "Link"("siteId");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
