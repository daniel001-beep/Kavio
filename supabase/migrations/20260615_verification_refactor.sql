-- Migration: Verification Refactor
-- Description: Adds columns to invoice and verification_attempt tables and sets up RLS policy on invoice.

ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "verification_status" VARCHAR(50) DEFAULT 'unverified';
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "verification_attempts" INTEGER DEFAULT 0;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "gemini_extracted_data" JSONB;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "transaction_reference" TEXT;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "confidence_score" INTEGER;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "upload_id" TEXT;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "flagged" BOOLEAN DEFAULT false;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "flag_reason" TEXT;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP;

-- Alter verification_attempt table
ALTER TABLE "verification_attempt" ADD COLUMN IF NOT EXISTS "fingerprint" TEXT;

-- Enable Row Level Security on the invoices table (if not already enabled)
ALTER TABLE "invoice" ENABLE ROW LEVEL SECURITY;

-- Drop existing public read policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow public read-only of non-draft invoices" ON "invoice";

-- Create the RLS policy allowing public access only to non-draft invoices
CREATE POLICY "Allow public read-only of non-draft invoices" ON "invoice"
FOR SELECT
TO public
USING (status != 'DRAFT');
