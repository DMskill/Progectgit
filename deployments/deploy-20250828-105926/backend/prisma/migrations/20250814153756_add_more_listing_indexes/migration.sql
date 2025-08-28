-- AlterTable
ALTER TABLE "public"."Listing" ALTER COLUMN "expiresAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Listing_countryCode_action_idx" ON "public"."Listing"("countryCode", "action");

-- CreateIndex
CREATE INDEX "Listing_regionCity_idx" ON "public"."Listing"("regionCity");

-- CreateIndex
CREATE INDEX "Listing_cryptoSymbol_idx" ON "public"."Listing"("cryptoSymbol");

-- CreateIndex
CREATE INDEX "Listing_receiveType_idx" ON "public"."Listing"("receiveType");

-- CreateIndex
CREATE INDEX "Listing_createdAt_idx" ON "public"."Listing"("createdAt");
