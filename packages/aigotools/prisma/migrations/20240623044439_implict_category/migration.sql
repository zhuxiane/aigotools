/*
  Warnings:

  - You are about to drop the `CategoriesOnSites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CategoriesOnSites" DROP CONSTRAINT "CategoriesOnSites_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CategoriesOnSites" DROP CONSTRAINT "CategoriesOnSites_siteId_fkey";

-- DropTable
DROP TABLE "CategoriesOnSites";

-- CreateTable
CREATE TABLE "_CategoryToSite" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToSite_AB_unique" ON "_CategoryToSite"("A", "B");

-- CreateIndex
CREATE INDEX "_CategoryToSite_B_index" ON "_CategoryToSite"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToSite" ADD CONSTRAINT "_CategoryToSite_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToSite" ADD CONSTRAINT "_CategoryToSite_B_fkey" FOREIGN KEY ("B") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
