/*
  Warnings:

  - Added the required column `expiresAt` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ListingStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable (add nullable columns first)
ALTER TABLE "public"."Listing" 
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "status" "public"."ListingStatus" NOT NULL DEFAULT 'ACTIVE';

-- Backfill expiresAt for existing rows: set to createdAt + interval '30 days' or now() if createdAt is null
UPDATE "public"."Listing"
SET "expiresAt" = COALESCE("createdAt" + interval '30 days', now())
WHERE "expiresAt" IS NULL;

-- Now enforce NOT NULL on expiresAt
ALTER TABLE "public"."Listing"
  ALTER COLUMN "expiresAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Listing_status_expiresAt_idx" ON "public"."Listing"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "Listing_sellerId_status_idx" ON "public"."Listing"("sellerId", "status");
