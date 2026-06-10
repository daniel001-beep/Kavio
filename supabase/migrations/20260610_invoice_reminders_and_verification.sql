-- Migration: Add bank details to invoices, and create invoice_reminder, receipt_upload, verification_attempt, notifications tables

-- 1. Alter invoice table to add bank details if they don't exist
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "bank_name" text;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "account_name" text;
ALTER TABLE "invoice" ADD COLUMN IF NOT EXISTS "account_number" text;

-- 2. Create invoice_reminder table
CREATE TABLE IF NOT EXISTS "invoice_reminder" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" uuid NOT NULL REFERENCES "invoice"("id") ON DELETE CASCADE,
  "reminder_date" timestamp DEFAULT now(),
  "status" text NOT NULL DEFAULT 'PENDING',
  "channel" text NOT NULL,
  "schedule_day" integer NOT NULL,
  "error_message" text,
  "created_at" timestamp DEFAULT now()
);

-- Create indexes on invoice_reminder
CREATE INDEX IF NOT EXISTS "idx_invoice_reminder_invoice_id" ON "invoice_reminder" ("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_invoice_reminder_status" ON "invoice_reminder" ("status");

-- 3. Create receipt_upload table
CREATE TABLE IF NOT EXISTS "receipt_upload" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" uuid NOT NULL REFERENCES "invoice"("id") ON DELETE CASCADE,
  "file_url" text,
  "file_name" text,
  "file_size" integer,
  "file_type" text,
  "receipt_image_base64" text,
  "created_at" timestamp DEFAULT now()
);

-- Create indexes on receipt_upload
CREATE INDEX IF NOT EXISTS "idx_receipt_upload_invoice_id" ON "receipt_upload" ("invoice_id");

-- 4. Create verification_attempt table
CREATE TABLE IF NOT EXISTS "verification_attempt" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoice_id" uuid NOT NULL REFERENCES "invoice"("id") ON DELETE CASCADE,
  "receipt_upload_id" uuid REFERENCES "receipt_upload"("id") ON DELETE SET NULL,
  "confidence_score" double precision NOT NULL DEFAULT 0,
  "extracted_amount" double precision,
  "extracted_account_number" text,
  "extracted_account_name" text,
  "extracted_bank_name" text,
  "extracted_ref" text,
  "extracted_sender_name" text,
  "extracted_date" text,
  "score_amount" integer DEFAULT 0,
  "score_account_number" integer DEFAULT 0,
  "score_account_name" integer DEFAULT 0,
  "score_date" integer DEFAULT 0,
  "score_reference" integer DEFAULT 0,
  "total_score" integer DEFAULT 0,
  "status" text NOT NULL DEFAULT 'REJECTED',
  "fraud_flags" jsonb DEFAULT '[]',
  "is_suspected_fraud" boolean DEFAULT false,
  "ocr_raw_result" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT now()
);

-- Create indexes on verification_attempt
CREATE INDEX IF NOT EXISTS "idx_verification_attempt_invoice_id" ON "verification_attempt" ("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_verification_attempt_status" ON "verification_attempt" ("status");
CREATE INDEX IF NOT EXISTS "idx_verification_attempt_ref" ON "verification_attempt" ("extracted_ref");

-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "is_read" boolean DEFAULT false,
  "type" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

-- Create indexes on notifications
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications" ("is_read");

-- 6. RLS Policies for the newly created tables
ALTER TABLE "invoice_reminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "receipt_upload" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_attempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

-- invoice_reminder policies (Admins / Freelancers who own the invoice can view)
CREATE POLICY "invoice_reminder_owner_select" ON "invoice_reminder"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "invoice" i
      WHERE i.id = "invoice_reminder".invoice_id
      AND i.user_id = auth.uid()::text
    )
  );

-- receipt_upload policies (No login is required to upload, but selecting requires ownership)
CREATE POLICY "receipt_upload_anonymous_insert" ON "receipt_upload"
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "receipt_upload_owner_select" ON "receipt_upload"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "invoice" i
      WHERE i.id = "receipt_upload".invoice_id
      AND i.user_id = auth.uid()::text
    )
  );

-- verification_attempt policies (Freelancers can see verification attempts for their invoices)
CREATE POLICY "verification_attempt_owner_select" ON "verification_attempt"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "invoice" i
      WHERE i.id = "verification_attempt".invoice_id
      AND i.user_id = auth.uid()::text
    )
  );

-- notifications policies (Users can only view/update their own notifications)
CREATE POLICY "notifications_user_select" ON "notifications"
  FOR SELECT
  USING (user_id = auth.uid()::text);

CREATE POLICY "notifications_user_update" ON "notifications"
  FOR UPDATE
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
