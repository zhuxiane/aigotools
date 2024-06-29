/*
  Warnings:

  - You are about to drop the column `siteId` on the `Category` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_siteId_fkey";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "siteId";

-- CreateTable
CREATE TABLE "CategoriesOnSites" (
    "siteId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,

    CONSTRAINT "CategoriesOnSites_pkey" PRIMARY KEY ("siteId","categoryId")
);

-- AddForeignKey
ALTER TABLE "CategoriesOnSites" ADD CONSTRAINT "CategoriesOnSites_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriesOnSites" ADD CONSTRAINT "CategoriesOnSites_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
