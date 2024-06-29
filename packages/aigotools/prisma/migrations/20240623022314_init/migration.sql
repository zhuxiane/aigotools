-- CreateEnum
CREATE TYPE "ReviewState" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "SiteState" AS ENUM ('published', 'unpublished');

-- CreateEnum
CREATE TYPE "ProcessStage" AS ENUM ('pending', 'processing', 'success', 'fail');

-- CreateEnum
CREATE TYPE "UpvoteType" AS ENUM ('site');

-- CreateTable
CREATE TABLE "Blog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "icon" TEXT,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "state" "ReviewState" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT '00000000000000000',
    "siteKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "snapshot" TEXT NOT NULL DEFAULT '',
    "desceription" TEXT NOT NULL DEFAULT '',
    "pricingType" TEXT NOT NULL DEFAULT '',
    "pricings" TEXT[],
    "images" TEXT[],
    "features" TEXT[],
    "usecases" TEXT[],
    "users" TEXT[],
    "relatedSearchs" TEXT[],
    "links" JSONB NOT NULL DEFAULT '{}',
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "metaKeywords" TEXT[],
    "metaDesceription" TEXT NOT NULL DEFAULT '',
    "searchSuggestWords" TEXT[],
    "state" "SiteState" NOT NULL DEFAULT 'unpublished',
    "processStage" "ProcessStage" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upvotes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "upvoteType" "UpvoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upvotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sites_siteKey_key" ON "sites"("siteKey");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
