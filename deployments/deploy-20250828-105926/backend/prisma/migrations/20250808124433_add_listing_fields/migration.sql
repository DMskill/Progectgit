/*
  Warnings:

  - You are about to drop the column `assetFrom` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `assetTo` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Listing` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nickname]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `action` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountTotal` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryCode` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryName` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cryptoSymbol` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minTrade` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiveType` to the `Listing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `regionCity` to the `Listing` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TradeAction" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('CASH', 'CRYPTO', 'BANK_TRANSFER', 'GOODS');

-- AlterTable
ALTER TABLE "public"."Listing" DROP COLUMN "assetFrom",
DROP COLUMN "assetTo",
DROP COLUMN "price",
DROP COLUMN "title",
ADD COLUMN     "action" "public"."TradeAction" NOT NULL,
ADD COLUMN     "amountTotal" DECIMAL(38,18) NOT NULL,
ADD COLUMN     "countryCode" TEXT NOT NULL,
ADD COLUMN     "countryName" TEXT NOT NULL,
ADD COLUMN     "cryptoSymbol" TEXT NOT NULL,
ADD COLUMN     "minTrade" DECIMAL(38,18) NOT NULL,
ADD COLUMN     "receiveAmount" DECIMAL(38,18),
ADD COLUMN     "receiveAsset" TEXT,
ADD COLUMN     "receiveType" "public"."PaymentMethod" NOT NULL,
ADD COLUMN     "regionCity" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "nickname" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "public"."User"("nickname");
