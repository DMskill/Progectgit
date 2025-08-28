-- Add receiveTypes array column to Listing
ALTER TABLE "Listing" ADD COLUMN "receiveTypes" "PaymentMethod"[] DEFAULT '{}'::"PaymentMethod"[]; 